import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { patientRouter } from './routes/patient.routes.js';
import { doctorRouter } from './routes/doctor.routes.js';
import { appointmentRouter } from './routes/appointment.routes.js';
import { billingRouter } from './routes/billing.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { prescriptionRouter } from './routes/prescription.routes.js';
import { contactRouter } from './routes/contact.routes.js';
import { userRouter } from './routes/user.routes.js';
import { labRouter } from './routes/lab.routes.js';
import { pharmacyRouter } from './routes/pharmacy.routes.js';
import { referralRouter } from './routes/referral.routes.js';

function stripDangerousKeys(value) {
  if (Array.isArray(value)) {
    return value.map(stripDangerousKeys);
  }
  if (value && typeof value === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor') {
        continue;
      }
      clean[key] = stripDangerousKeys(val);
    }
    return clean;
  }
  return value;
}

function sanitizeIncomingRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = stripDangerousKeys(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = stripDangerousKeys(req.query);
  }
  next();
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  // Strict allowlisted CORS
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGINS.includes(origin) || env.CORS_ORIGINS.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(sanitizeIncomingRequest);

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  // Liveness & readiness probes (exempt from rate limiting)
  app.get('/api/health', (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({
      status: dbReady ? 'healthy' : 'degraded',
      database: dbReady ? 'connected' : 'disconnected',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/ready', (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({ ready: dbReady });
  });

  // Rate limiting on API routes
  app.use('/api', apiLimiter);

  // Domain routes
  app.use('/api/auth', authRouter);
  app.use('/api/patients', patientRouter);
  app.use('/api/doctors', doctorRouter);
  app.use('/api/appointments', appointmentRouter);
  app.use('/api/billing', billingRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/prescriptions', prescriptionRouter);
  app.use('/api/contact', contactRouter);
  app.use('/api/users', userRouter);
  app.use('/api/labs', labRouter);
  app.use('/api/pharmacy', pharmacyRouter);
  app.use('/api/referrals', referralRouter);

  // JSON 404 & centralized error handler
  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp();
