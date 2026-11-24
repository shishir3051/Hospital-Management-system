import express from 'express';
import { z } from 'zod';
import { Prescription, Patient, Doctor } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, requireValidId, objectIdSchema } from '../middleware/validate.js';
import { AppError, asyncHandler, parsePagination, isValidObjectId } from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';

export const prescriptionRouter = express.Router();

const medicationSchema = z.object({
  name: z.string().trim().min(1, 'Medication name is required').max(150),
  dosage: z.string().trim().min(1, 'Dosage is required').max(100),
  frequency: z.string().trim().min(1, 'Frequency is required').max(100),
  duration: z.string().trim().min(1, 'Duration is required').max(100),
  instructions: z.string().trim().max(300).optional().default('')
});

const createPrescriptionSchema = z.object({
  patientId: objectIdSchema,
  doctorId: objectIdSchema.optional().or(z.literal('')).transform((v) => v || undefined),
  appointmentId: objectIdSchema.optional().nullable().or(z.literal('')).transform((v) => v || null),
  diagnosis: z.string().trim().min(2, 'Diagnosis is required').max(1000),
  medications: z.array(medicationSchema).min(1, 'At least one medication is required'),
  notes: z.string().trim().max(2000).optional().default(''),
  followUpDate: z.string().optional().nullable()
});

const updatePrescriptionSchema = z.object({
  diagnosis: z.string().trim().min(2).max(1000).optional(),
  medications: z.array(medicationSchema).min(1).optional(),
  notes: z.string().trim().max(2000).optional(),
  followUpDate: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional()
});

// List prescriptions (Clinical staff & owning Patient only — blocked for Accountant)
prescriptionRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const { patientId, doctorId, appointmentId, status } = req.query;

    const query = {};

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile) {
        return res.json({ prescriptions: [], total: 0, page, totalPages: 1 });
      }
      query.patientId = req.userProfile._id;
    } else if (req.user.role === 'DOCTOR') {
      if (isValidObjectId(patientId)) {
        query.patientId = patientId;
      } else if (req.userProfile) {
        query.doctorId = req.userProfile._id;
      } else {
        return res.json({ prescriptions: [], total: 0, page, totalPages: 1 });
      }
    } else {
      if (isValidObjectId(patientId)) query.patientId = patientId;
      if (isValidObjectId(doctorId)) query.doctorId = doctorId;
    }

    if (isValidObjectId(appointmentId)) {
      query.appointmentId = appointmentId;
    }
    if (typeof status === 'string' && ['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      query.status = status;
    }

    const [total, prescriptions] = await Promise.all([
      Prescription.countDocuments(query),
      Prescription.find(query)
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'firstName lastName email phone' }
        })
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'firstName lastName' }
        })
        .populate('appointmentId', 'dateTime type reason')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      prescriptions,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Get prescription by ID (Clinical staff & owning Patient only)
prescriptionRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'),
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email phone' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate('appointmentId', 'dateTime type reason');

    if (!prescription) {
      throw new AppError('Prescription not found', 404);
    }

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile || prescription.patientId?._id.toString() !== req.userProfile._id.toString()) {
        throw new AppError('Insufficient permissions to view this prescription', 403);
      }
    }

    res.json(prescription);
  })
);

// Create prescription (Doctor & Admin)
prescriptionRouter.post(
  '/',
  authenticate,
  authorize('DOCTOR', 'ADMIN'),
  validateBody(createPrescriptionSchema),
  asyncHandler(async (req, res) => {
    const { patientId, doctorId, appointmentId, diagnosis, medications, notes, followUpDate } = req.body;

    let finalDoctorId;
    if (req.user.role === 'DOCTOR') {
      if (!req.userProfile) {
        throw new AppError('Doctor profile not found for your account', 400);
      }
      finalDoctorId = req.userProfile._id;
    } else {
      if (!doctorId) {
        throw new AppError('Please select the prescribing doctor', 400);
      }
      finalDoctorId = doctorId;
    }

    const [patient, doctor] = await Promise.all([
      Patient.findById(patientId),
      Doctor.findById(finalDoctorId)
    ]);
    if (!patient) throw new AppError('Selected patient not found', 404);
    if (!doctor) throw new AppError('Selected doctor not found', 404);

    const parsedFollowUp =
      followUpDate && !Number.isNaN(Date.parse(followUpDate)) ? new Date(followUpDate) : null;

    const prescription = await Prescription.create({
      patientId,
      doctorId: finalDoctorId,
      appointmentId: appointmentId || null,
      diagnosis,
      medications,
      notes,
      followUpDate: parsedFollowUp,
      status: 'ACTIVE'
    });

    await prescription.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email phone' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } }
    ]);

    await recordAudit({
      req,
      action: 'PRESCRIPTION_CREATE',
      resourceType: 'Prescription',
      resourceId: prescription._id,
      details: { patientId, medicationCount: medications.length }
    });

    res.status(201).json({
      message: 'Prescription issued successfully',
      prescription
    });
  })
);

// Update prescription (Admin or prescribing Doctor)
prescriptionRouter.put(
  '/:id',
  authenticate,
  authorize('DOCTOR', 'ADMIN'),
  requireValidId('id'),
  validateBody(updatePrescriptionSchema),
  asyncHandler(async (req, res) => {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      throw new AppError('Prescription not found', 404);
    }

    if (req.user.role === 'DOCTOR') {
      if (!req.userProfile || prescription.doctorId.toString() !== req.userProfile._id.toString()) {
        throw new AppError('You can only edit prescriptions you issued', 403);
      }
    }

    const update = {};
    if (req.body.diagnosis !== undefined) update.diagnosis = req.body.diagnosis;
    if (req.body.medications !== undefined) update.medications = req.body.medications;
    if (req.body.notes !== undefined) update.notes = req.body.notes;
    if (req.body.status !== undefined) update.status = req.body.status;
    if (req.body.followUpDate !== undefined) {
      update.followUpDate =
        req.body.followUpDate && !Number.isNaN(Date.parse(req.body.followUpDate))
          ? new Date(req.body.followUpDate)
          : null;
    }

    const updated = await Prescription.findByIdAndUpdate(prescription._id, update, {
      new: true,
      runValidators: true
    })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email phone' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } });

    await recordAudit({
      req,
      action: 'PRESCRIPTION_UPDATE',
      resourceType: 'Prescription',
      resourceId: prescription._id
    });

    res.json({
      message: 'Prescription updated successfully',
      prescription: updated
    });
  })
);

// Delete prescription (Admin or prescribing Doctor)
prescriptionRouter.delete(
  '/:id',
  authenticate,
  authorize('DOCTOR', 'ADMIN'),
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      throw new AppError('Prescription not found', 404);
    }

    if (req.user.role === 'DOCTOR') {
      if (!req.userProfile || prescription.doctorId.toString() !== req.userProfile._id.toString()) {
        throw new AppError('You can only delete prescriptions you issued', 403);
      }
    }

    await Prescription.deleteOne({ _id: prescription._id });

    await recordAudit({
      req,
      action: 'PRESCRIPTION_DELETE',
      resourceType: 'Prescription',
      resourceId: prescription._id
    });

    res.json({ message: 'Prescription deleted successfully' });
  })
);
