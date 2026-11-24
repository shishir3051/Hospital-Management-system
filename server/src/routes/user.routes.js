import crypto from 'crypto';
import express from 'express';
import { z } from 'zod';
import { User, findUserByEmail } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, requireValidId, passwordPolicySchema } from '../middleware/validate.js';
import { AppError, asyncHandler, escapeRegex, parsePagination } from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';
import { USER_ROLES } from '../config/env.js';

export const userRouter = express.Router();

const MANAGEABLE_STAFF_ROLES = ['ADMIN', 'NURSE', 'ACCOUNTANT', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECH'];

const createStaffSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('Valid email address is required'),
  phone: z.string().trim().max(30).optional().default(''),
  role: z.enum(MANAGEABLE_STAFF_ROLES),
  password: passwordPolicySchema.optional().or(z.literal('')).transform((v) => v || undefined)
});

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
});

const updateRoleSchema = z.object({
  role: z.enum(MANAGEABLE_STAFF_ROLES)
});

// Admin: List all users/staff with role, status, and search filters
userRouter.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const scope = typeof req.query.scope === 'string' ? req.query.scope.trim() : 'staff';

    const query = {};
    if (role && USER_ROLES.includes(role)) {
      query.role = role;
    } else if (scope === 'staff') {
      query.role = { $ne: 'PATIENT' };
    }

    if (status && ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex }
      ];
    }

    const [total, users, roleCountsAgg] = await Promise.all([
      User.countDocuments(query),
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    const roleCounts = Object.fromEntries(roleCountsAgg.map((r) => [r._id, r.count]));

    res.json({
      users,
      roleCounts,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Admin: Create non-doctor hospital staff account
userRouter.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateBody(createStaffSchema),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, role, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const generatedPassword = password || `Hc@${crypto.randomBytes(4).toString('hex')}1A`;
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      role,
      password: generatedPassword,
      status: 'ACTIVE'
    });

    await recordAudit({
      req,
      action: 'STAFF_CREATE',
      resourceType: 'User',
      resourceId: user._id,
      details: { email: user.email, role: user.role }
    });

    res.status(201).json({
      message: `${role.replace('_', ' ')} account created successfully`,
      user,
      ...(password ? {} : { temporaryPassword: generatedPassword })
    });
  })
);

// Admin: Activate, deactivate, or suspend a user account
userRouter.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  requireValidId('id'),
  validateBody(updateStatusSchema),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user._id.toString() && req.body.status !== 'ACTIVE') {
      throw new AppError('You cannot suspend or deactivate your own administrator account', 400);
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!updated) {
      throw new AppError('User account not found', 404);
    }

    await recordAudit({
      req,
      action: 'USER_STATUS_CHANGE',
      resourceType: 'User',
      resourceId: updated._id,
      details: { status: updated.status, email: updated.email }
    });

    res.json({
      message: `Account status updated to ${updated.status.toLowerCase()}`,
      user: updated
    });
  })
);

// Admin: Change hospital staff role
userRouter.patch(
  '/:id/role',
  authenticate,
  authorize('ADMIN'),
  requireValidId('id'),
  validateBody(updateRoleSchema),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user._id.toString() && req.body.role !== 'ADMIN') {
      throw new AppError('You cannot remove ADMIN role from your own account', 400);
    }

    const existing = await User.findById(req.params.id);
    if (!existing) {
      throw new AppError('User account not found', 404);
    }
    if (existing.role === 'PATIENT' || existing.role === 'DOCTOR') {
      throw new AppError(
        'Doctor and Patient accounts have dedicated clinical profiles and cannot be reassigned here.',
        400
      );
    }

    existing.role = req.body.role;
    await existing.save();

    await recordAudit({
      req,
      action: 'USER_ROLE_CHANGE',
      resourceType: 'User',
      resourceId: existing._id,
      details: { role: existing.role, email: existing.email }
    });

    res.json({
      message: `Staff role updated to ${existing.role.replace('_', ' ')}`,
      user: existing
    });
  })
);
