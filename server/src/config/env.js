import 'dotenv/config';

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && !isTest) {
  throw new Error('FATAL: JWT_SECRET environment variable is required.');
}
if (isProduction && jwtSecret && jwtSecret.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be at least 32 characters in production.');
}

const rawTaxRate = Number(process.env.TAX_RATE ?? 0.08);
const taxRate = Number.isFinite(rawTaxRate) && rawTaxRate >= 0 && rawTaxRate <= 1 ? rawTaxRate : 0.08;

export const DEPARTMENTS = Object.freeze([
  'Cardiology',
  'Neurology & Neurosurgery',
  'Orthopedics & Spine',
  'Dermatology (Skin & VD)',
  'Pediatrics',
  'General Medicine / Internal Medicine',
  'ENT (Otolaryngology)',
  'Oncology',
  'Radiology'
]);

export const USER_ROLES = Object.freeze([
  'ADMIN',
  'DOCTOR',
  'NURSE',
  'PATIENT',
  'ACCOUNTANT',
  'RECEPTIONIST',
  'PHARMACIST',
  'LAB_TECH'
]);

export const STAFF_ROLES = Object.freeze([
  'ADMIN',
  'DOCTOR',
  'NURSE',
  'ACCOUNTANT',
  'RECEPTIONIST',
  'PHARMACIST',
  'LAB_TECH'
]);

export const APPOINTMENT_STATUSES = Object.freeze([
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
]);

export const BILLING_STATUSES = Object.freeze([
  'UNPAID',
  'PARTIAL',
  'PAID',
  'CANCELLED'
]);

export const PAYMENT_METHODS = Object.freeze([
  'CASH',
  'CARD',
  'INSURANCE',
  'ONLINE'
]);

export const BLOOD_GROUPS = Object.freeze([
  '',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-'
]);

export const env = Object.freeze({
  NODE_ENV,
  isProduction,
  isTest,
  PORT: Number(process.env.PORT) || 3001,
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: jwtSecret || 'test-only-jwt-secret-key-minimum-32-bytes',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  CORS_ORIGINS: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  TAX_RATE: taxRate,
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM:
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER
      ? `"HealthCore Medical Center" <${process.env.SMTP_USER}>`
      : '"HealthCore Medical Center" <no-reply@healthcore.org>')
});
