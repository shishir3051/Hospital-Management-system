import mongoose from 'mongoose';

export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isValidObjectId(id) {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

export function parsePagination(query = {}, defaults = { page: 1, limit: 20, maxLimit: 100 }) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : defaults.page;
  const maxLimit = defaults.maxLimit ?? 100;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, maxLimit)
      : defaults.limit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function normalizeDepartment(input) {
  if (!input || typeof input !== 'string') return 'General Medicine / Internal Medicine';
  const trimmed = input.trim();
  const map = {
    cardiology: 'Cardiology',
    neurology: 'Neurology & Neurosurgery',
    'neurology & neurosurgery': 'Neurology & Neurosurgery',
    orthopedics: 'Orthopedics & Spine',
    'orthopedics & spine': 'Orthopedics & Spine',
    dermatology: 'Dermatology (Skin & VD)',
    'dermatology (skin & vd)': 'Dermatology (Skin & VD)',
    pediatrics: 'Pediatrics',
    general: 'General Medicine / Internal Medicine',
    'general medicine': 'General Medicine / Internal Medicine',
    'general medicine / internal medicine': 'General Medicine / Internal Medicine',
    'internal medicine': 'General Medicine / Internal Medicine',
    ent: 'ENT (Otolaryngology)',
    'ent (otolaryngology)': 'ENT (Otolaryngology)',
    oncology: 'Oncology',
    radiology: 'Radiology'
  };
  return map[trimmed.toLowerCase()] || trimmed;
}
