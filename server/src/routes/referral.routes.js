import express from 'express';
import { z } from 'zod';
import { Referral, Patient, Doctor } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, requireValidId, objectIdSchema } from '../middleware/validate.js';
import { AppError, asyncHandler, parsePagination } from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';
import { DEPARTMENTS } from '../config/env.js';

export const referralRouter = express.Router();

const createReferralSchema = z.object({
  patientId: objectIdSchema,
  toDoctorId: objectIdSchema.optional().nullable().or(z.literal('')).transform((v) => v || null),
  targetDepartment: z.enum(DEPARTMENTS),
  urgency: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']).default('ROUTINE'),
  reason: z.string().trim().min(3, 'Referral reason is required').max(1000),
  clinicalSummary: z.string().trim().max(2000).optional().default('')
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'SCHEDULED', 'COMPLETED', 'DECLINED'])
});

// List referrals (Role-scoped)
referralRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

    const query = {};
    if (req.user.role === 'PATIENT') {
      if (!req.userProfile) return res.json({ referrals: [], total: 0, page, totalPages: 1 });
      query.patientId = req.userProfile._id;
    } else if (req.user.role === 'DOCTOR' && req.userProfile) {
      query.$or = [
        { fromDoctorId: req.userProfile._id },
        { toDoctorId: req.userProfile._id },
        { targetDepartment: req.userProfile.department, toDoctorId: null }
      ];
    }

    if (status && ['PENDING', 'ACCEPTED', 'SCHEDULED', 'COMPLETED', 'DECLINED'].includes(status)) {
      query.status = status;
    }

    const [total, referrals] = await Promise.all([
      Referral.countDocuments(query),
      Referral.find(query)
        .populate({
          path: 'patientId',
          select: 'gender dateOfBirth userId',
          populate: { path: 'userId', select: 'firstName lastName phone email' }
        })
        .populate({
          path: 'fromDoctorId',
          populate: { path: 'userId', select: 'firstName lastName' }
        })
        .populate({
          path: 'toDoctorId',
          populate: { path: 'userId', select: 'firstName lastName' }
        })
        .populate('fromUserId', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      referrals,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Create specialist referral (Doctor & Admin)
referralRouter.post(
  '/',
  authenticate,
  authorize('ADMIN', 'DOCTOR'),
  validateBody(createReferralSchema),
  asyncHandler(async (req, res) => {
    const { patientId, toDoctorId, targetDepartment, urgency, reason, clinicalSummary } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) throw new AppError('Selected patient not found', 404);

    if (toDoctorId) {
      const targetDoc = await Doctor.findById(toDoctorId);
      if (!targetDoc) throw new AppError('Target specialist not found', 404);
    }

    const referral = await Referral.create({
      patientId,
      fromDoctorId: req.user.role === 'DOCTOR' ? req.userProfile?._id || null : null,
      fromUserId: req.user._id,
      toDoctorId,
      targetDepartment,
      urgency,
      reason,
      clinicalSummary,
      status: 'PENDING'
    });

    await referral.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email' } },
      { path: 'fromDoctorId', populate: { path: 'userId', select: 'firstName lastName' } },
      { path: 'toDoctorId', populate: { path: 'userId', select: 'firstName lastName' } }
    ]);

    await recordAudit({
      req,
      action: 'REFERRAL_CREATE',
      resourceType: 'Referral',
      resourceId: referral._id,
      details: { patientId, targetDepartment, urgency }
    });

    res.status(201).json({ message: 'Specialist referral created', referral });
  })
);

// Update referral status
referralRouter.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
  requireValidId('id'),
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const referral = await Referral.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!referral) throw new AppError('Referral not found', 404);

    await recordAudit({
      req,
      action: 'REFERRAL_STATUS_CHANGE',
      resourceType: 'Referral',
      resourceId: referral._id,
      details: { status: referral.status }
    });

    res.json({ message: `Referral marked ${referral.status.toLowerCase()}`, referral });
  })
);
