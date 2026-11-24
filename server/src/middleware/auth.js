import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserById, resolveUserProfile } from '../utils/db.js';
import { AppError } from '../utils/errors.js';

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN
    }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch {
    return null;
  }
}

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return next(new AppError('Authentication required', 401));
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return next(new AppError('Invalid or expired token', 401));
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      return next(new AppError('User account not found', 401));
    }

    if (user.status !== 'ACTIVE') {
      return next(new AppError('Account is inactive or suspended. Please contact administration.', 403));
    }

    req.user = user;
    req.userProfile = await resolveUserProfile(user);
    return next();
  } catch (err) {
    return next(err);
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.slice(7).trim();
    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return next();
    }
    const user = await findUserById(decoded.userId);
    if (user && user.status === 'ACTIVE') {
      req.user = user;
      req.userProfile = await resolveUserProfile(user);
    }
    return next();
  } catch {
    return next();
  }
}

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions for this action', 403));
    }
    return next();
  };
}
