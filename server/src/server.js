import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes.js';
import { patientRouter } from './routes/patient.routes.js';
import { doctorRouter } from './routes/doctor.routes.js';
import { appointmentRouter } from './routes/appointment.routes.js';
import { billingRouter } from './routes/billing.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { prescriptionRouter } from './routes/prescription.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeData } from './utils/initializeData.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // Initialize sample data if needed (only for migration)
    initializeData();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRouter);
app.use('/api/patients', patientRouter);
app.use('/api/doctors', doctorRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/billing', billingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/prescriptions', prescriptionRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🏥 HealthCore HMS API running on port ${PORT}`);
});

export default app;