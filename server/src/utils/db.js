// Database Models and Utilities
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import { Billing } from '../models/Billing.js';
import { Prescription } from '../models/Prescription.js';

import { Token } from '../models/Token.js';

// Export models for direct use
export {
  User,
  Patient,
  Doctor,
  Appointment,
  Billing,
  Prescription,
  Token
};

// Hash password helper
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password helper
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Find user by email helper (Async)
export async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase() });
}

// Find user by ID helper (Async)
export async function findUserById(id) {
  return User.findById(id);
}