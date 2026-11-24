import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['REGISTER', 'RESET_PASSWORD'],
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Auto-expire after 10 minutes
  }
});

tokenSchema.index({ email: 1, type: 1 });

export const Token = mongoose.model('Token', tokenSchema);
