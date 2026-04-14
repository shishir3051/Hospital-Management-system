import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true
  },
  medicines: [
    {
      name: { type: String, required: true },
      dosage: { type: String, required: true }, // e.g., "500mg"
      frequency: { type: String, required: true }, // e.g., "Twice a day"
      duration: { type: String, required: true }, // e.g., "7 days"
      instructions: { type: String }
    }
  ],
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const Prescription = mongoose.model('Prescription', prescriptionSchema);
