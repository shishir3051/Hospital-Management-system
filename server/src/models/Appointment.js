import mongoose from 'mongoose';
import { APPOINTMENT_STATUSES } from '../config/env.js';

const appointmentSchema = new mongoose.Schema(
  {
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
      default: 30,
      min: 10,
      max: 240
    },
    type: {
      type: String,
      enum: ['CONSULTATION', 'FOLLOWUP', 'CHECKUP', 'EMERGENCY'],
      default: 'CONSULTATION'
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: 'SCHEDULED'
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
    soapNotes: {
      subjective: { type: String, trim: true, default: '', maxlength: 2000 },
      objective: { type: String, trim: true, default: '', maxlength: 2000 },
      assessment: { type: String, trim: true, default: '', maxlength: 1500 },
      plan: { type: String, trim: true, default: '', maxlength: 2000 },
      icdCode: { type: String, trim: true, default: '', maxlength: 30 }
    },
    queueNumber: {
      type: String,
      trim: true,
      default: ''
    },
    checkedInAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString?.() ?? ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

appointmentSchema.index({ doctorId: 1, dateTime: 1 });
appointmentSchema.index({ patientId: 1, dateTime: -1 });
appointmentSchema.index({ dateTime: 1, status: 1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
