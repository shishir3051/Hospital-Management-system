import crypto from 'crypto';
import express from 'express';
import { z } from 'zod';
import {
  User,
  Patient,
  Token,
  findUserByEmail,
  findUserById,
  resolveUserProfile,
  formatUserResponse
} from '../utils/db.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { validateBody, passwordPolicySchema } from '../middleware/validate.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import { sendEmail } from '../utils/emailService.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';
import { BLOOD_GROUPS } from '../config/env.js';

export const authRouter = express.Router();

const MAX_OTP_ATTEMPTS = 5;

function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

async function verifyAndConsumeOtp(email, otp, type) {
  const normalizedEmail = email.toLowerCase().trim();
  const tokenDoc = await Token.findOne({ email: normalizedEmail, type });
  if (!tokenDoc) {
    throw new AppError('Invalid or expired verification code', 400);
  }

  if (tokenDoc.attempts >= MAX_OTP_ATTEMPTS) {
    await Token.deleteOne({ _id: tokenDoc._id });
    throw new AppError('Too many failed attempts. Please request a new verification code.', 429);
  }

  const candidateBuf = Buffer.from(hashOtp(otp), 'hex');
  const storedBuf = Buffer.from(tokenDoc.tokenHash, 'hex');
  const isMatch =
    candidateBuf.length === storedBuf.length &&
    crypto.timingSafeEqual(candidateBuf, storedBuf);

  if (!isMatch) {
    tokenDoc.attempts += 1;
    if (tokenDoc.attempts >= MAX_OTP_ATTEMPTS) {
      await Token.deleteOne({ _id: tokenDoc._id });
      throw new AppError('Too many failed attempts. Please request a new verification code.', 429);
    }
    await tokenDoc.save();
    throw new AppError('Invalid verification code', 400);
  }

  await Token.deleteOne({ _id: tokenDoc._id });
}

const sendRegisterOtpSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  firstName: z.string().trim().min(1).max(80).optional()
});

const registerSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: passwordPolicySchema,
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  phone: z.string().trim().max(30).optional().default(''),
  otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().default('OTHER')
});

const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required').max(128)
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address')
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  newPassword: passwordPolicySchema
});

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  avatar: z.string().trim().url('Avatar must be a valid URL').max(500).nullable().optional().or(z.literal('')),
  address: z.string().trim().max(300).optional(),
  emergencyContact: z.string().trim().max(150).optional(),
  bloodGroup: z.enum(BLOOD_GROUPS).optional(),
  allergies: z.string().trim().max(500).optional(),
  insuranceProvider: z.string().trim().max(150).optional(),
  insurancePolicyNumber: z.string().trim().max(100).optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(128),
  newPassword: passwordPolicySchema
});

// Send Registration OTP
authRouter.post(
  '/send-register-otp',
  otpLimiter,
  validateBody(sendRegisterOtpSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const firstName = req.body.firstName || 'Patient';

    const existing = await findUserByEmail(email);
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const otp = generateOtpCode();
    await Token.deleteMany({ email, type: 'REGISTER' });
    await Token.create({
      email,
      tokenHash: hashOtp(otp),
      type: 'REGISTER'
    });

    await sendEmail({
      to: email,
      subject: 'Your HealthCore Medical Center Verification Code',
      text: `Hello ${firstName}, your verification code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
          <h2 style="color: #0F766E; margin: 0 0 12px;">HealthCore Medical Center</h2>
          <p style="color: #334155; font-size: 15px;">Hello ${firstName},</p>
          <p style="color: #334155; font-size: 15px;">Use the verification code below to complete your patient portal registration:</p>
          <div style="background: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0F766E; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #64748B; font-size: 13px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'Verification code sent to your email address.' });
  })
);

// Public Patient Registration (strictly locked to PATIENT role)
authRouter.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, otp, dateOfBirth, gender } = req.body;
    const normalizedEmail = email.toLowerCase();

    await verifyAndConsumeOtp(normalizedEmail, otp, 'REGISTER');

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      firstName,
      lastName,
      phone,
      role: 'PATIENT',
      status: 'ACTIVE'
    });

    let patient;
    try {
      const dob = dateOfBirth && !Number.isNaN(Date.parse(dateOfBirth))
        ? new Date(dateOfBirth)
        : new Date('1990-01-01T00:00:00.000Z');
      patient = await Patient.create({
        userId: user._id,
        dateOfBirth: dob,
        gender: gender || 'OTHER',
        bloodGroup: '',
        address: '',
        emergencyContact: ''
      });
    } catch (err) {
      await User.deleteOne({ _id: user._id });
      throw err;
    }

    const token = generateToken(user);
    await recordAudit({
      req,
      actor: user,
      action: 'AUTH_REGISTER',
      resourceType: 'User',
      resourceId: user._id
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: formatUserResponse(user, patient)
    });
  })
);

// Forgot Password (non-enumerating response)
authRouter.post(
  '/forgot-password',
  otpLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await findUserByEmail(email);

    if (user && user.status === 'ACTIVE') {
      const otp = generateOtpCode();
      await Token.deleteMany({ email, type: 'RESET_PASSWORD' });
      await Token.create({
        email,
        tokenHash: hashOtp(otp),
        type: 'RESET_PASSWORD'
      });

      await sendEmail({
        to: email,
        subject: 'Password Reset Code — HealthCore Medical Center',
        text: `Hello ${user.firstName}, your password reset code is ${otp}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
            <h2 style="color: #0F766E; margin: 0 0 12px;">Password Reset Request</h2>
            <p style="color: #334155; font-size: 15px;">Hello ${user.firstName},</p>
            <p style="color: #334155; font-size: 15px;">Use this verification code to reset your HealthCore Medical Center password:</p>
            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #B91C1C; font-family: monospace;">${otp}</span>
            </div>
            <p style="color: #64748B; font-size: 13px;">This code expires in 10 minutes. If you did not request a reset, please ignore this email.</p>
          </div>
        `
      });
    }

    res.json({
      message: 'If an active account exists for that email, a password reset code has been sent.'
    });
  })
);

// Reset Password
authRouter.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase();

    await verifyAndConsumeOtp(normalizedEmail, otp, 'RESET_PASSWORD');

    const user = await findUserByEmail(normalizedEmail, true);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Account not found or inactive', 404);
    }

    user.password = newPassword;
    await user.save();

    await recordAudit({
      req,
      actor: user,
      action: 'AUTH_PASSWORD_RESET',
      resourceType: 'User',
      resourceId: user._id
    });

    res.json({ message: 'Password has been reset successfully. You can now sign in.' });
  })
);

// Login
authRouter.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await findUserByEmail(email, true);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is inactive or suspended. Please contact administration.', 403);
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      await recordAudit({
        req,
        actor: user,
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'User',
        resourceId: user._id
      });
      throw new AppError('Invalid email or password', 401);
    }

    const profile = await resolveUserProfile(user);
    const token = generateToken(user);

    await recordAudit({
      req,
      actor: user,
      action: 'AUTH_LOGIN',
      resourceType: 'User',
      resourceId: user._id
    });

    res.json({
      message: 'Login successful',
      token,
      user: formatUserResponse(user, profile)
    });
  })
);

// Get current authenticated user
authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      user: formatUserResponse(req.user, req.userProfile)
    });
  })
);

// Update own profile
authRouter.put(
  '/profile',
  authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      phone,
      avatar,
      address,
      emergencyContact,
      bloodGroup,
      allergies,
      insuranceProvider,
      insurancePolicyNumber
    } = req.body;

    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (phone !== undefined) userUpdate.phone = phone;
    if (avatar !== undefined) userUpdate.avatar = avatar || null;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      userUpdate,
      { new: true, runValidators: true }
    );

    let updatedProfile = req.userProfile;
    if (req.user.role === 'PATIENT' && req.userProfile) {
      const patientUpdate = {};
      if (address !== undefined) patientUpdate.address = address;
      if (emergencyContact !== undefined) patientUpdate.emergencyContact = emergencyContact;
      if (bloodGroup !== undefined) patientUpdate.bloodGroup = bloodGroup;
      if (allergies !== undefined) patientUpdate.allergies = allergies;
      if (insuranceProvider !== undefined) patientUpdate.insuranceProvider = insuranceProvider;
      if (insurancePolicyNumber !== undefined) patientUpdate.insurancePolicyNumber = insurancePolicyNumber;

      if (Object.keys(patientUpdate).length > 0) {
        updatedProfile = await Patient.findByIdAndUpdate(
          req.userProfile._id,
          patientUpdate,
          { new: true, runValidators: true }
        );
      }
    }

    await recordAudit({
      req,
      action: 'PROFILE_UPDATE',
      resourceType: 'User',
      resourceId: req.user._id
    });

    res.json({
      message: 'Profile updated successfully',
      user: formatUserResponse(updatedUser, updatedProfile)
    });
  })
);

// Change password
authRouter.put(
  '/change-password',
  authenticate,
  authLimiter,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await findUserById(req.user._id, true);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    await recordAudit({
      req,
      action: 'AUTH_PASSWORD_CHANGE',
      resourceType: 'User',
      resourceId: req.user._id
    });

    res.json({ message: 'Password updated successfully' });
  })
);

// Logout
authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await recordAudit({
      req,
      action: 'AUTH_LOGOUT',
      resourceType: 'User',
      resourceId: req.user._id
    });
    res.json({ message: 'Logged out successfully' });
  })
);
