import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['REGISTER', 'RESET_PASSWORD'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // This document will automatically be deleted 10 minutes (600s) after creation
  }
});

export const Token = mongoose.model('Token', tokenSchema);
