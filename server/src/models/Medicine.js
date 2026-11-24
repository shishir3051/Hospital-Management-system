import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    genericName: { type: String, trim: true, default: '', maxlength: 150 },
    category: {
      type: String,
      enum: [
        'ANTIBIOTIC',
        'ANALGESIC',
        'CARDIOVASCULAR',
        'DIABETES',
        'RESPIRATORY',
        'GASTROINTESTINAL',
        'VITAMIN',
        'OTHER'
      ],
      default: 'OTHER'
    },
    dosageForm: {
      type: String,
      enum: ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'INHALER', 'DROPS'],
      default: 'TABLET'
    },
    strength: { type: String, trim: true, default: '', maxlength: 60 },
    sku: { type: String, trim: true, unique: true, sparse: true },
    batchNumber: { type: String, trim: true, default: '' },
    manufacturer: { type: String, trim: true, default: '' },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    reorderLevel: { type: Number, min: 0, default: 25 },
    unitPrice: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'],
      default: 'IN_STOCK'
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

medicineSchema.pre('save', function () {
  if (this.stockQuantity <= 0) {
    this.status = 'OUT_OF_STOCK';
  } else if (this.stockQuantity <= (this.reorderLevel || 25)) {
    this.status = 'LOW_STOCK';
  } else {
    this.status = 'IN_STOCK';
  }
});

medicineSchema.index({ name: 1, category: 1 });
medicineSchema.index({ status: 1, expiryDate: 1 });

export const Medicine = mongoose.model('Medicine', medicineSchema);
