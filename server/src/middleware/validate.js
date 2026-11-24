import { z } from 'zod';
import { AppError, isValidObjectId } from '../utils/errors.js';

export const objectIdSchema = z
  .string({ required_error: 'ID is required', invalid_type_error: 'Invalid ID format' })
  .refine((val) => isValidObjectId(val), { message: 'Invalid ID format' });

export const passwordPolicySchema = z
  .string({ required_error: 'Password is required', invalid_type_error: 'Password must be text' })
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join('.') || 'body',
        message: i.message
      }));
      return next(new AppError(issues[0]?.message || 'Validation failed', 400, issues));
    }
    req.body = result.data;
    return next();
  };
}

export function requireValidId(paramName = 'id') {
  return (req, _res, next) => {
    if (!isValidObjectId(req.params[paramName])) {
      return next(new AppError(`Invalid ${paramName} parameter`, 400));
    }
    return next();
  };
}
