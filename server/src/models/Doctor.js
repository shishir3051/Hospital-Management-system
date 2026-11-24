import mongoose from 'mongoose';
import { DEPARTMENTS } from '../config/env.js';

const DEFAULT_SCHEDULE = {
  monday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
  thursday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  friday: ['09:00', '10:00', '11:00'],
  saturday: [],
  sunday: []
};

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    specialization: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      enum: DEPARTMENTS,
      default: 'General Medicine / Internal Medicine'
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    education: {
      type: String,
      required: true,
      trim: true
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
      max: 80
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0
    },
    schedule: {
      type: Map,
      of: [String],
      default: () => new Map(Object.entries(DEFAULT_SCHEDULE))
    },
    bio: {
      type: String,
      trim: true,
      default: ''
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ON_LEAVE', 'BUSY'],
      default: 'AVAILABLE'
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

doctorSchema.index({ department: 1, status: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ rating: -1 });

export const Doctor = mongoose.model('Doctor', doctorSchema);
