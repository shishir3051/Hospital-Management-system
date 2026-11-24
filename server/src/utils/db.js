import bcrypt from 'bcryptjs';
import {
  User,
  Patient,
  Doctor,
  Appointment,
  Billing,
  Prescription,
  Token,
  ContactMessage,
  AuditLog,
  LabOrder,
  Medicine,
  Referral
} from '../models/index.js';

export {
  User,
  Patient,
  Doctor,
  Appointment,
  Billing,
  Prescription,
  Token,
  ContactMessage,
  AuditLog,
  LabOrder,
  Medicine,
  Referral
};

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email, includePassword = false) {
  const query = User.findOne({ email: String(email).toLowerCase().trim() });
  return includePassword ? query.select('+password') : query;
}

export async function findUserById(id, includePassword = false) {
  const query = User.findById(id);
  return includePassword ? query.select('+password') : query;
}

export async function resolveUserProfile(user) {
  if (!user) return null;
  if (user.role === 'PATIENT') {
    return Patient.findOne({ userId: user._id });
  }
  if (user.role === 'DOCTOR') {
    return Doctor.findOne({ userId: user._id });
  }
  return null;
}

export function formatUserResponse(user, profile = null) {
  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    avatar: user.avatar || null,
    status: user.status,
    createdAt: user.createdAt,
    profile: profile ? profile.toJSON() : null
  };
}
