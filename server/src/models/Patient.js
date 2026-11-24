import mongoose from 'mongoose';
import { BLOOD_GROUPS } from '../config/env.js';

const vitalsSchema = new mongoose.Schema(
  {
    bloodPressure: { type: String, trim: true, default: '' },
    systolic: { type: Number, min: 40, max: 300 },
    diastolic: { type: Number, min: 20, max: 200 },
    heartRate: { type: Number, min: 20, max: 260 },
    temperature: { type: Number, min: 90, max: 115 },
    oxygenSaturation: { type: Number, min: 50, max: 100 },
    weight: { type: Number, min: 1, max: 500 },
    recordedBy: { type: String, trim: true, default: '' },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true
    },
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: ''
    },
    allergies: {
      type: String,
      trim: true,
      default: ''
    },
    medicalHistory: {
      type: [String],
      default: []
    },
    medications: {
      type: [String],
      default: []
    },
    vitals: {
      type: vitalsSchema,
      default: undefined
    },
    vitalsHistory: {
      type: [vitalsSchema],
      default: []
    },
    insuranceProvider: {
      type: String,
      trim: true,
      default: ''
    },
    insurancePolicyNumber: {
      type: String,
      trim: true,
      default: ''
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

patientSchema.index({ createdAt: -1 });

export const Patient = mongoose.model('Patient', patientSchema);
