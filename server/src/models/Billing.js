import mongoose from 'mongoose';
import { BILLING_STATUSES, PAYMENT_METHODS } from '../config/env.js';

const billingSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    items: [
      {
        description: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 }
      }
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    taxRate: {
      type: Number,
      default: 0.08,
      min: 0,
      max: 1
    },
    tax: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: BILLING_STATUSES,
      default: 'UNPAID'
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'CASH'
    },
    paymentDate: {
      type: Date
    },
    dueDate: {
      type: Date,
      required: true
    },
    notes: {
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

billingSchema.index({ patientId: 1, createdAt: -1 });
billingSchema.index({ appointmentId: 1 });
billingSchema.index({ status: 1, paymentDate: -1 });

export const Billing = mongoose.model('Billing', billingSchema);
