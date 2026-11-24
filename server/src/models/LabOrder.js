import mongoose from 'mongoose';

const labResultItemSchema = new mongoose.Schema(
  {
    parameter: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    unit: { type: String, trim: true, default: '' },
    referenceRange: { type: String, trim: true, default: '' },
    flag: {
      type: String,
      enum: ['NORMAL', 'LOW', 'HIGH', 'CRITICAL'],
      default: 'NORMAL'
    }
  },
  { _id: false }
);

const labOrderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    orderedByDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null
    },
    orderedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    testName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    category: {
      type: String,
      enum: ['HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'IMAGING', 'PATHOLOGY', 'URINALYSIS'],
      default: 'HEMATOLOGY'
    },
    priority: {
      type: String,
      enum: ['ROUTINE', 'URGENT', 'STAT'],
      default: 'ROUTINE'
    },
    status: {
      type: String,
      enum: ['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'ORDERED'
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    billingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Billing',
      default: null
    },
    clinicalNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000
    },
    results: {
      type: [labResultItemSchema],
      default: []
    },
    summary: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
    completedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    completedAt: {
      type: Date,
      default: null
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

labOrderSchema.index({ patientId: 1, createdAt: -1 });
labOrderSchema.index({ status: 1, priority: 1, createdAt: -1 });
labOrderSchema.index({ appointmentId: 1 });

export const LabOrder = mongoose.model('LabOrder', labOrderSchema);
