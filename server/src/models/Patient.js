import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
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
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    trim: true
  },
  allergies: {
    type: String,
    default: 'None'
  },
  medicalHistory: {
    type: [String],
    default: []
  },
  medications: {
    type: [String],
    default: []
  },
  insuranceProvider: {
    type: String,
    trim: true
  },
  insurancePolicyNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export const Patient = mongoose.model('Patient', patientSchema);
