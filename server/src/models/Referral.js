import mongoose from 'mongoose';
import { DEPARTMENTS } from '../config/env.js';

const referralSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    fromDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    toDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null
    },
    targetDepartment: {
      type: String,
      enum: DEPARTMENTS,
      required: true
    },
    urgency: {
      type: String,
      enum: ['ROUTINE', 'URGENT', 'EMERGENCY'],
      default: 'ROUTINE'
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    clinicalSummary: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'SCHEDULED', 'COMPLETED', 'DECLINED'],
      default: 'PENDING'
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

referralSchema.index({ patientId: 1, createdAt: -1 });
referralSchema.index({ toDoctorId: 1, status: 1 });
referralSchema.index({ targetDepartment: 1, status: 1 });

export const Referral = mongoose.model('Referral', referralSchema);
