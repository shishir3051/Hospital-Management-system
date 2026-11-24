import mongoose from 'mongoose';

const medicationItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
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
      default: null
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    medications: {
      type: [medicationItemSchema],
      default: []
    },
    // Legacy compatibility field for existing DB records created before canonicalization
    medicines: {
      type: [medicationItemSchema],
      default: undefined
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
    followUpDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE'
    },
    dispenseStatus: {
      type: String,
      enum: ['PENDING', 'DISPENSED', 'CANCELLED'],
      default: 'PENDING'
    },
    dispensedAt: {
      type: Date,
      default: null
    },
    dispensedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    pharmacyBillingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Billing',
      default: null
    },
    issuedDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString?.() ?? ret._id;
        if ((!ret.medications || ret.medications.length === 0) && Array.isArray(ret.medicines)) {
          ret.medications = ret.medicines;
        }
        delete ret.medicines;
        delete ret.__v;
        return ret;
      }
    }
  }
);

prescriptionSchema.pre('validate', function () {
  if ((!this.medications || this.medications.length === 0) && Array.isArray(this.medicines) && this.medicines.length > 0) {
    this.medications = this.medicines;
  }
  this.medicines = undefined;
});

prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ appointmentId: 1 });

export const Prescription = mongoose.model('Prescription', prescriptionSchema);
