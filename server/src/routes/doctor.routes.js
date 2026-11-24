import crypto from 'crypto';
import express from 'express';
import { z } from 'zod';
import { User, Doctor, Appointment, findUserByEmail } from '../utils/db.js';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.js';
import { validateBody, requireValidId } from '../middleware/validate.js';
import {
  AppError,
  asyncHandler,
  escapeRegex,
  parsePagination,
  normalizeDepartment
} from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';
import { DEPARTMENTS } from '../config/env.js';

export const doctorRouter = express.Router();

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const timeSlotSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time slots must use HH:MM format');

const scheduleSchema = z.record(z.enum(DAYS), z.array(timeSlotSchema)).optional();

const createDoctorSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().max(30).optional().default(''),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128).optional(),
  specialization: z.string().trim().min(2, 'Specialization is required').max(120),
  department: z
    .string()
    .optional()
    .transform((v) => normalizeDepartment(v))
    .refine((v) => DEPARTMENTS.includes(v), { message: 'Invalid medical department' }),
  licenseNumber: z.string().trim().min(3, 'Medical license number is required').max(60),
  education: z.string().trim().min(2, 'Education/credentials are required').max(250),
  yearsOfExperience: z.coerce.number().min(0).max(80),
  consultationFee: z.coerce.number().min(0).max(100000),
  schedule: scheduleSchema,
  bio: z.string().trim().max(1500).optional().default(''),
  status: z.enum(['AVAILABLE', 'ON_LEAVE', 'BUSY']).optional().default('AVAILABLE')
});

const updateDoctorSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  specialization: z.string().trim().min(2).max(120).optional(),
  department: z
    .string()
    .optional()
    .transform((v) => (v ? normalizeDepartment(v) : undefined))
    .refine((v) => v === undefined || DEPARTMENTS.includes(v), { message: 'Invalid medical department' }),
  licenseNumber: z.string().trim().min(3).max(60).optional(),
  education: z.string().trim().min(2).max(250).optional(),
  yearsOfExperience: z.coerce.number().min(0).max(80).optional(),
  consultationFee: z.coerce.number().min(0).max(100000).optional(),
  schedule: scheduleSchema,
  bio: z.string().trim().max(1500).optional(),
  status: z.enum(['AVAILABLE', 'ON_LEAVE', 'BUSY']).optional()
});

function isStaffUser(user) {
  return Boolean(user && ['ADMIN', 'DOCTOR', 'NURSE', 'ACCOUNTANT'].includes(user.role));
}

// Public: Live department directory with active doctor counts
doctorRouter.get(
  '/departments',
  asyncHandler(async (_req, res) => {
    const activeUserIds = await User.find({ role: 'DOCTOR', status: 'ACTIVE' }).distinct('_id');
    const agg = await Doctor.aggregate([
      { $match: { userId: { $in: activeUserIds } } },
      {
        $group: {
          _id: '$department',
          doctorCount: { $sum: 1 },
          availableCount: {
            $sum: { $cond: [{ $eq: ['$status', 'AVAILABLE'] }, 1, 0] }
          },
          avgRating: { $avg: '$rating' },
          minFee: { $min: '$consultationFee' },
          maxFee: { $max: '$consultationFee' }
        }
      }
    ]);

    const aggMap = new Map(agg.map((item) => [item._id, item]));
    const departments = DEPARTMENTS.map((name) => {
      const stats = aggMap.get(name);
      return {
        name,
        doctorCount: stats?.doctorCount || 0,
        availableCount: stats?.availableCount || 0,
        avgRating: stats?.avgRating ? Number(stats.avgRating.toFixed(1)) : 0,
        minFee: stats?.minFee ?? null,
        maxFee: stats?.maxFee ?? null
      };
    });

    res.json({ departments });
  })
);

// List doctors (Publicly browsable — strips personal PII for non-staff)
doctorRouter.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const specialization = typeof req.query.specialization === 'string' ? req.query.specialization.trim() : '';
    const department = typeof req.query.department === 'string' ? req.query.department.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'ADMIN';

    const userFilter = { role: 'DOCTOR' };
    if (!includeInactive) {
      userFilter.status = 'ACTIVE';
    }
    const activeDoctorUserIds = await User.find(userFilter).distinct('_id');

    const query = { userId: { $in: activeDoctorUserIds } };

    if (search) {
      const safe = escapeRegex(search);
      const regex = new RegExp(safe, 'i');
      const matchedUsers = await User.find({
        _id: { $in: activeDoctorUserIds },
        $or: [{ firstName: regex }, { lastName: regex }]
      }).distinct('_id');

      query.$or = [
        { userId: { $in: matchedUsers } },
        { specialization: regex },
        { department: regex },
        { education: regex }
      ];
    }

    if (specialization) {
      query.specialization = new RegExp(escapeRegex(specialization), 'i');
    }

    if (department) {
      const normalized = normalizeDepartment(department);
      query.department = normalized;
    }

    if (status && ['AVAILABLE', 'ON_LEAVE', 'BUSY'].includes(status)) {
      query.status = status;
    }

    const userSelect = isStaffUser(req.user)
      ? 'firstName lastName email phone avatar status'
      : 'firstName lastName avatar status';

    const [total, doctors] = await Promise.all([
      Doctor.countDocuments(query),
      Doctor.find(query)
        .populate('userId', userSelect)
        .sort({ rating: -1, yearsOfExperience: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      doctors,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Get doctor by ID (Public profile; upcoming appointments only for staff/owning doctor)
doctorRouter.get(
  '/:id',
  optionalAuth,
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const staff = isStaffUser(req.user);
    const userSelect = staff
      ? 'firstName lastName email phone avatar status'
      : 'firstName lastName avatar status';

    const doctor = await Doctor.findById(req.params.id).populate('userId', userSelect);
    if (!doctor || (!staff && doctor.userId?.status !== 'ACTIVE')) {
      throw new AppError('Doctor not found', 404);
    }

    const canViewAppointments =
      req.user &&
      (['ADMIN', 'NURSE'].includes(req.user.role) ||
        (req.user.role === 'DOCTOR' && req.userProfile?._id.toString() === doctor._id.toString()));

    let upcomingAppointments = [];
    if (canViewAppointments) {
      upcomingAppointments = await Appointment.find({
        doctorId: doctor._id,
        dateTime: { $gte: new Date() },
        status: { $nin: ['CANCELLED', 'NO_SHOW'] }
      })
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'firstName lastName' }
        })
        .sort({ dateTime: 1 })
        .limit(10);
    }

    const completedCount = await Appointment.countDocuments({
      doctorId: doctor._id,
      status: 'COMPLETED'
    });

    res.json({
      ...doctor.toJSON(),
      completedAppointmentsCount: completedCount,
      upcomingAppointments
    });
  })
);

// Create doctor (Admin only)
doctorRouter.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateBody(createDoctorSchema),
  asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      specialization,
      department,
      licenseNumber,
      education,
      yearsOfExperience,
      consultationFee,
      schedule,
      bio,
      status
    } = req.body;

    const normalizedEmail = email.toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('A user with this email already exists', 409);
    }

    const existingLicense = await Doctor.findOne({ licenseNumber });
    if (existingLicense) {
      throw new AppError('A doctor with this license number already exists', 409);
    }

    const initialPassword = password || `Hc@${crypto.randomBytes(6).toString('hex')}1A`;
    const user = await User.create({
      email: normalizedEmail,
      password: initialPassword,
      role: 'DOCTOR',
      firstName,
      lastName,
      phone,
      status: 'ACTIVE'
    });

    let doctor;
    try {
      doctor = await Doctor.create({
        userId: user._id,
        specialization,
        department,
        licenseNumber,
        education,
        yearsOfExperience,
        consultationFee,
        ...(schedule ? { schedule } : {}),
        bio,
        status
      });
    } catch (err) {
      await User.deleteOne({ _id: user._id });
      throw err;
    }

    await doctor.populate('userId', 'firstName lastName email phone avatar status');

    await recordAudit({
      req,
      action: 'DOCTOR_CREATE',
      resourceType: 'Doctor',
      resourceId: doctor._id
    });

    res.status(201).json({
      message: 'Doctor onboarded successfully',
      doctor
    });
  })
);

// Update doctor (Admin or owning Doctor)
doctorRouter.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DOCTOR'),
  requireValidId('id'),
  validateBody(updateDoctorSchema),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    if (req.user.role === 'DOCTOR' && doctor.userId.toString() !== req.user._id.toString()) {
      throw new AppError('You can only update your own doctor profile', 403);
    }

    const {
      firstName,
      lastName,
      phone,
      specialization,
      department,
      licenseNumber,
      education,
      yearsOfExperience,
      consultationFee,
      schedule,
      bio,
      status
    } = req.body;

    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (phone !== undefined) userUpdate.phone = phone;
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(doctor.userId, userUpdate, { runValidators: true });
    }

    const doctorUpdate = {};
    if (specialization !== undefined) doctorUpdate.specialization = specialization;
    if (department !== undefined) doctorUpdate.department = department;
    if (licenseNumber !== undefined) doctorUpdate.licenseNumber = licenseNumber;
    if (education !== undefined) doctorUpdate.education = education;
    if (yearsOfExperience !== undefined) doctorUpdate.yearsOfExperience = yearsOfExperience;
    if (consultationFee !== undefined) doctorUpdate.consultationFee = consultationFee;
    if (schedule !== undefined) doctorUpdate.schedule = schedule;
    if (bio !== undefined) doctorUpdate.bio = bio;
    if (status !== undefined) doctorUpdate.status = status;

    const updated = await Doctor.findByIdAndUpdate(
      doctor._id,
      doctorUpdate,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone avatar status');

    await recordAudit({
      req,
      action: 'DOCTOR_UPDATE',
      resourceType: 'Doctor',
      resourceId: doctor._id
    });

    res.json({
      message: 'Doctor profile updated successfully',
      doctor: updated
    });
  })
);

// Dedicated schedule update (Admin or owning Doctor)
doctorRouter.put(
  '/:id/schedule',
  authenticate,
  authorize('ADMIN', 'DOCTOR'),
  requireValidId('id'),
  validateBody(z.object({ schedule: z.record(z.enum(DAYS), z.array(timeSlotSchema)) })),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    if (req.user.role === 'DOCTOR' && doctor.userId.toString() !== req.user._id.toString()) {
      throw new AppError('You can only update your own schedule', 403);
    }

    doctor.schedule = new Map(Object.entries(req.body.schedule));
    await doctor.save();

    await recordAudit({
      req,
      action: 'DOCTOR_SCHEDULE_UPDATE',
      resourceType: 'Doctor',
      resourceId: doctor._id
    });

    res.json({
      message: 'Schedule updated successfully',
      schedule: doctor.schedule
    });
  })
);

// Deactivate doctor (Admin only)
doctorRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    await Promise.all([
      User.findByIdAndUpdate(doctor.userId, { status: 'INACTIVE' }),
      Doctor.findByIdAndUpdate(doctor._id, { status: 'ON_LEAVE' })
    ]);

    await recordAudit({
      req,
      action: 'DOCTOR_DEACTIVATE',
      resourceType: 'Doctor',
      resourceId: doctor._id
    });

    res.json({ message: 'Doctor deactivated successfully' });
  })
);
