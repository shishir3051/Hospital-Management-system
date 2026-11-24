import crypto from 'crypto';
import express from 'express';
import { z } from 'zod';
import { User, Patient, Appointment, Prescription, findUserByEmail } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, requireValidId } from '../middleware/validate.js';
import { AppError, asyncHandler, escapeRegex, parsePagination, isValidObjectId } from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';
import { BLOOD_GROUPS } from '../config/env.js';

export const patientRouter = express.Router();

const vitalsPayloadSchema = z
  .object({
    bloodPressure: z.string().trim().max(30).optional(),
    heartRate: z.coerce.number().min(20).max(260).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
    temperature: z.coerce.number().min(90).max(115).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
    oxygenSaturation: z.coerce.number().min(50).max(100).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
    weight: z.coerce.number().min(1).max(500).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v))
  })
  .optional();

const stringListSchema = z
  .union([
    z.array(z.string().trim().max(200)),
    z.string().transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ])
  .optional();

const createPatientSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().max(30).optional().default(''),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128).optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.enum(BLOOD_GROUPS).optional().default(''),
  address: z.string().trim().max(300).optional().default(''),
  emergencyContact: z.string().trim().max(150).optional().default(''),
  allergies: z.string().trim().max(500).optional().default(''),
  medicalHistory: stringListSchema.default([]),
  medications: stringListSchema.default([]),
  insuranceProvider: z.string().trim().max(150).optional().default(''),
  insurancePolicyNumber: z.string().trim().max(100).optional().default(''),
  vitals: vitalsPayloadSchema
});

const updatePatientSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.enum(BLOOD_GROUPS).optional(),
  address: z.string().trim().max(300).optional(),
  emergencyContact: z.string().trim().max(150).optional(),
  allergies: z.string().trim().max(500).optional(),
  medicalHistory: stringListSchema,
  medications: stringListSchema,
  insuranceProvider: z.string().trim().max(150).optional(),
  insurancePolicyNumber: z.string().trim().max(100).optional(),
  vitals: vitalsPayloadSchema
});

// List patients (Staff only — never exposed to PATIENT role)
patientRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'ACCOUNTANT', 'RECEPTIONIST'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const bloodGroup = typeof req.query.bloodGroup === 'string' ? req.query.bloodGroup.trim() : '';
    const includeInactive = req.query.includeInactive === 'true' && req.user.role === 'ADMIN';

    const userFilter = { role: 'PATIENT' };
    if (!includeInactive) {
      userFilter.status = 'ACTIVE';
    }

    if (search) {
      const safe = escapeRegex(search);
      const tokens = search.split(/\s+/).filter(Boolean).map(escapeRegex);
      const orClauses = [
        { firstName: new RegExp(safe, 'i') },
        { lastName: new RegExp(safe, 'i') },
        { email: new RegExp(safe, 'i') },
        { phone: new RegExp(safe, 'i') }
      ];
      if (tokens.length >= 2) {
        orClauses.push({
          $and: [
            { firstName: new RegExp(tokens[0], 'i') },
            { lastName: new RegExp(tokens[tokens.length - 1], 'i') }
          ]
        });
      }
      userFilter.$or = orClauses;
    }

    const matchingUsers = await User.find(userFilter).select('_id');
    const matchingUserIds = matchingUsers.map((u) => u._id);

    const query = {};
    if (search && isValidObjectId(search)) {
      query.$or = [{ _id: search }, { userId: { $in: matchingUserIds } }];
    } else {
      query.userId = { $in: matchingUserIds };
    }

    if (bloodGroup && BLOOD_GROUPS.includes(bloodGroup)) {
      query.bloodGroup = bloodGroup;
    }

    const isFinanceOnly = ['ACCOUNTANT', 'RECEPTIONIST'].includes(req.user.role);
    const selectFields = isFinanceOnly
      ? '-allergies -medicalHistory -medications -vitals -vitalsHistory'
      : '';

    const [total, patients] = await Promise.all([
      Patient.countDocuments(query),
      Patient.find(query)
        .select(selectFields)
        .populate('userId', 'firstName lastName email phone avatar status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      patients,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Get patient by ID (Staff or owning Patient only)
patientRouter.get(
  '/:id',
  authenticate,
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const isFinanceOnly = ['ACCOUNTANT', 'RECEPTIONIST'].includes(req.user.role);
    const patient = await Patient.findById(req.params.id)
      .select(isFinanceOnly ? '-allergies -medicalHistory -medications -vitals -vitalsHistory' : '')
      .populate('userId', 'firstName lastName email phone avatar status');

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile || req.userProfile._id.toString() !== patient._id.toString()) {
        throw new AppError('Insufficient permissions to access this patient record', 403);
      }
    }

    const [appointmentsCount, prescriptionsCount, recentAppointments] = await Promise.all([
      Appointment.countDocuments({ patientId: patient._id }),
      isFinanceOnly ? Promise.resolve(0) : Prescription.countDocuments({ patientId: patient._id }),
      isFinanceOnly
        ? Promise.resolve([])
        : Appointment.find({ patientId: patient._id })
            .populate({
              path: 'doctorId',
              populate: { path: 'userId', select: 'firstName lastName' }
            })
            .sort({ dateTime: -1 })
            .limit(10)
    ]);

    res.json({
      ...patient.toJSON(),
      appointmentsCount,
      prescriptionsCount,
      recentAppointments
    });
  })
);

// Create patient (Admin, Doctor, Nurse, Receptionist)
patientRouter.post(
  '/',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'),
  validateBody(createPatientSchema),
  asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      allergies,
      medicalHistory,
      medications,
      insuranceProvider,
      insurancePolicyNumber,
      vitals
    } = req.body;

    const normalizedEmail = email.toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('A user with this email already exists', 409);
    }

    const parsedDob = new Date(dateOfBirth);
    if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
      throw new AppError('Please provide a valid date of birth in the past', 400);
    }

    const initialPassword = password || `Hc@${crypto.randomBytes(6).toString('hex')}1A`;
    const user = await User.create({
      email: normalizedEmail,
      password: initialPassword,
      role: 'PATIENT',
      firstName,
      lastName,
      phone,
      status: 'ACTIVE'
    });

    let patient;
    try {
      patient = await Patient.create({
        userId: user._id,
        dateOfBirth: parsedDob,
        gender,
        bloodGroup,
        address,
        emergencyContact,
        allergies,
        medicalHistory: medicalHistory || [],
        medications: medications || [],
        insuranceProvider,
        insurancePolicyNumber,
        ...(vitals ? { vitals: { ...vitals, updatedAt: new Date() } } : {})
      });
    } catch (err) {
      await User.deleteOne({ _id: user._id });
      throw err;
    }

    await patient.populate('userId', 'firstName lastName email phone avatar status');

    await recordAudit({
      req,
      action: 'PATIENT_CREATE',
      resourceType: 'Patient',
      resourceId: patient._id
    });

    res.status(201).json({
      message: 'Patient registered successfully',
      patient
    });
  })
);

// Update patient (Admin, Doctor, Nurse, or owning Patient)
patientRouter.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'),
  requireValidId('id'),
  validateBody(updatePatientSchema),
  asyncHandler(async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile || req.userProfile._id.toString() !== patient._id.toString()) {
        throw new AppError('Insufficient permissions to update this patient record', 403);
      }
    }

    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      allergies,
      medicalHistory,
      medications,
      insuranceProvider,
      insurancePolicyNumber,
      vitals
    } = req.body;

    // Update linked User demographics if provided
    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (phone !== undefined) userUpdate.phone = phone;
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(patient.userId, userUpdate, { runValidators: true });
    }

    // Update Patient clinical & contact fields
    const patientUpdate = {};
    if (dateOfBirth !== undefined) {
      const parsedDob = new Date(dateOfBirth);
      if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
        throw new AppError('Invalid date of birth', 400);
      }
      patientUpdate.dateOfBirth = parsedDob;
    }
    if (gender !== undefined) patientUpdate.gender = gender;
    if (bloodGroup !== undefined) patientUpdate.bloodGroup = bloodGroup;
    if (address !== undefined) patientUpdate.address = address;
    if (emergencyContact !== undefined) patientUpdate.emergencyContact = emergencyContact;
    if (allergies !== undefined) patientUpdate.allergies = allergies;
    if (insuranceProvider !== undefined) patientUpdate.insuranceProvider = insuranceProvider;
    if (insurancePolicyNumber !== undefined) patientUpdate.insurancePolicyNumber = insurancePolicyNumber;

    // Only clinical staff can directly modify medicalHistory, medications, and vitals
    let vitalsEntry = null;
    if (req.user.role !== 'PATIENT') {
      if (medicalHistory !== undefined) patientUpdate.medicalHistory = medicalHistory;
      if (medications !== undefined) patientUpdate.medications = medications;
      if (vitals !== undefined) {
        let systolic;
        let diastolic;
        if (typeof vitals.bloodPressure === 'string') {
          const bpMatch = vitals.bloodPressure.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
          if (bpMatch) {
            systolic = Number(bpMatch[1]);
            diastolic = Number(bpMatch[2]);
          }
        }
        vitalsEntry = {
          ...(patient.vitals?.toObject?.() || {}),
          ...vitals,
          ...(systolic ? { systolic, diastolic } : {}),
          recordedBy: `${req.user.firstName} ${req.user.lastName}`.trim(),
          updatedAt: new Date()
        };
        patientUpdate.vitals = vitalsEntry;
      }
    }

    const updateDoc = vitalsEntry
      ? { $set: patientUpdate, $push: { vitalsHistory: { $each: [vitalsEntry], $slice: -50 } } }
      : { $set: patientUpdate };

    const updated = await Patient.findByIdAndUpdate(
      patient._id,
      updateDoc,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone avatar status');

    await recordAudit({
      req,
      action: 'PATIENT_UPDATE',
      resourceType: 'Patient',
      resourceId: patient._id
    });

    res.json({
      message: 'Patient updated successfully',
      patient: updated
    });
  })
);

// Soft-delete patient (Admin only)
patientRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    await User.findByIdAndUpdate(patient.userId, { status: 'INACTIVE' });

    await recordAudit({
      req,
      action: 'PATIENT_DEACTIVATE',
      resourceType: 'Patient',
      resourceId: patient._id
    });

    res.json({ message: 'Patient deactivated successfully' });
  })
);
