import mongoose from 'mongoose';

const billingSchema = new mongoose.Schema({
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
      description: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      unitPrice: { type: Number, required: true },
      total: { type: Number, required: true }
    }
  ],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED'],
    default: 'UNPAID'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'INSURANCE', 'ONLINE'],
    default: 'CASH'
  },
  paymentDate: {
    type: Date
  },
  dueDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

export const Billing = mongoose.model('Billing', billingSchema);
