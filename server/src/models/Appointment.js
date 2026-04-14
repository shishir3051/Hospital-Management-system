import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 30 // in minutes
  },
  type: {
    type: String,
    enum: ['CONSULTATION', 'FOLLOWUP', 'CHECKUP', 'EMERGENCY'],
    default: 'CONSULTATION'
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'SCHEDULED'
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export const Appointment = mongoose.model('Appointment', appointmentSchema);
