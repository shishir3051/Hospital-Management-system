import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
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
    enum: [
      'Cardiology', 
      'Neurology & Neurosurgery', 
      'Orthopedics & Spine', 
      'Dermatology (Skin & VD)', 
      'Pediatrics', 
      'General Medicine / Internal Medicine', 
      'ENT (Otolaryngology)',
      'Oncology',
      'Radiology'
    ],
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
    required: true
  },
  yearsOfExperience: {
    type: Number,
    required: true
  },
  consultationFee: {
    type: Number,
    required: true
  },
  schedule: {
    type: Map,
    of: [String],
    default: {
      monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      wednesday: ['09:00', '10:00', '14:00'],
      thursday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      friday: ['09:00', '10:00', '11:00']
    }
  },
  bio: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    default: 4.5
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'ON_LEAVE', 'BUSY'],
    default: 'AVAILABLE'
  }
}, {
  timestamps: true
});

export const Doctor = mongoose.model('Doctor', doctorSchema);
