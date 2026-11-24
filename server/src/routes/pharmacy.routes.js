import express from 'express';
import { z } from 'zod';
import { Medicine, Prescription, Billing } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, requireValidId, objectIdSchema } from '../middleware/validate.js';
import {
  AppError,
  asyncHandler,
  escapeRegex,
  parsePagination,
  roundCurrency
} from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';
import { env } from '../config/env.js';

export const pharmacyRouter = express.Router();

const CATEGORIES = [
  'ANTIBIOTIC',
  'ANALGESIC',
  'CARDIOVASCULAR',
  'DIABETES',
  'RESPIRATORY',
  'GASTROINTESTINAL',
  'VITAMIN',
  'OTHER'
];

const FORMS = ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'INHALER', 'DROPS'];

const medicineSchema = z.object({
  name: z.string().trim().min(2, 'Medicine name is required').max(150),
  genericName: z.string().trim().max(150).optional().default(''),
  category: z.enum(CATEGORIES).default('OTHER'),
  dosageForm: z.enum(FORMS).default('TABLET'),
  strength: z.string().trim().max(60).optional().default(''),
  sku: z.string().trim().max(60).optional().or(z.literal('')).transform((v) => v || undefined),
  batchNumber: z.string().trim().max(60).optional().default(''),
  manufacturer: z.string().trim().max(120).optional().default(''),
  stockQuantity: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0).optional().default(25),
  unitPrice: z.coerce.number().min(0).max(50000),
  expiryDate: z.string().optional().nullable()
});

const updateMedicineSchema = medicineSchema.partial();

const dispenseSchema = z.object({
  items: z
    .array(
      z.object({
        medicineId: objectIdSchema,
        quantity: z.coerce.number().int().min(1).max(1000)
      })
    )
    .optional()
    .default([]),
  dispenseFee: z.coerce.number().min(0).max(5000).optional().default(0),
  createBill: z.boolean().optional().default(true)
});

// Inventory listing (Admin, Pharmacist, Doctor, Nurse)
pharmacyRouter.get(
  '/medicines',
  authenticate,
  authorize('ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 30, maxLimit: 100 });
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

    const query = {};
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { name: regex },
        { genericName: regex },
        { sku: regex },
        { manufacturer: regex }
      ];
    }
    if (category && CATEGORIES.includes(category)) query.category = category;
    if (status && ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].includes(status)) query.status = status;

    const soonDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const [total, medicines, lowStockCount, outOfStockCount, expiringSoonCount] = await Promise.all([
      Medicine.countDocuments(query),
      Medicine.find(query).sort({ name: 1 }).skip(skip).limit(limit),
      Medicine.countDocuments({ status: 'LOW_STOCK' }),
      Medicine.countDocuments({ status: 'OUT_OF_STOCK' }),
      Medicine.countDocuments({ expiryDate: { $ne: null, $lte: soonDate }, stockQuantity: { $gt: 0 } })
    ]);

    res.json({
      medicines,
      alerts: { lowStockCount, outOfStockCount, expiringSoonCount },
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Add medicine to inventory
pharmacyRouter.post(
  '/medicines',
  authenticate,
  authorize('ADMIN', 'PHARMACIST'),
  validateBody(medicineSchema),
  asyncHandler(async (req, res) => {
    const { expiryDate, ...rest } = req.body;
    const med = await Medicine.create({
      ...rest,
      unitPrice: roundCurrency(rest.unitPrice),
      expiryDate: expiryDate && !Number.isNaN(Date.parse(expiryDate)) ? new Date(expiryDate) : null
    });

    await recordAudit({
      req,
      action: 'PHARMACY_MEDICINE_CREATE',
      resourceType: 'Medicine',
      resourceId: med._id,
      details: { name: med.name, stockQuantity: med.stockQuantity }
    });

    res.status(201).json({ message: 'Medicine added to inventory', medicine: med });
  })
);

// Update / restock medicine
pharmacyRouter.put(
  '/medicines/:id',
  authenticate,
  authorize('ADMIN', 'PHARMACIST'),
  requireValidId('id'),
  validateBody(updateMedicineSchema),
  asyncHandler(async (req, res) => {
    const med = await Medicine.findById(req.params.id);
    if (!med) throw new AppError('Medicine not found', 404);

    for (const [k, v] of Object.entries(req.body)) {
      if (k === 'expiryDate') {
        med.expiryDate = v && !Number.isNaN(Date.parse(v)) ? new Date(v) : null;
      } else if (k === 'unitPrice') {
        med.unitPrice = roundCurrency(v);
      } else if (v !== undefined) {
        med[k] = v;
      }
    }
    await med.save();

    await recordAudit({
      req,
      action: 'PHARMACY_MEDICINE_UPDATE',
      resourceType: 'Medicine',
      resourceId: med._id,
      details: { name: med.name, stockQuantity: med.stockQuantity }
    });

    res.json({ message: 'Medicine inventory updated', medicine: med });
  })
);

// Delete medicine
pharmacyRouter.delete(
  '/medicines/:id',
  authenticate,
  authorize('ADMIN', 'PHARMACIST'),
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const med = await Medicine.findByIdAndDelete(req.params.id);
    if (!med) throw new AppError('Medicine not found', 404);

    await recordAudit({
      req,
      action: 'PHARMACY_MEDICINE_DELETE',
      resourceType: 'Medicine',
      resourceId: med._id
    });

    res.json({ message: 'Medicine removed from inventory' });
  })
);

// Pharmacist dispensing queue (with patient allergies populated for safety!)
pharmacyRouter.get(
  '/queue',
  authenticate,
  authorize('ADMIN', 'PHARMACIST'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const dispenseStatus = typeof req.query.dispenseStatus === 'string' ? req.query.dispenseStatus.trim() : '';

    const query = { status: { $ne: 'CANCELLED' } };
    if (dispenseStatus === 'PENDING') {
      query.$or = [{ dispenseStatus: 'PENDING' }, { dispenseStatus: { $exists: false } }];
    } else if (dispenseStatus && ['DISPENSED', 'CANCELLED'].includes(dispenseStatus)) {
      query.dispenseStatus = dispenseStatus;
    }

    const [total, prescriptions] = await Promise.all([
      Prescription.countDocuments(query),
      Prescription.find(query)
        .populate({
          path: 'patientId',
          select: 'allergies bloodGroup gender dateOfBirth userId',
          populate: { path: 'userId', select: 'firstName lastName phone email' }
        })
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'firstName lastName' }
        })
        .populate('dispensedByUserId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      prescriptions,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Dispense prescription, deduct stock, and optionally generate pharmacy bill
pharmacyRouter.post(
  '/dispense/:prescriptionId',
  authenticate,
  authorize('ADMIN', 'PHARMACIST'),
  requireValidId('prescriptionId'),
  validateBody(dispenseSchema),
  asyncHandler(async (req, res) => {
    const rx = await Prescription.findById(req.params.prescriptionId);
    if (!rx) throw new AppError('Prescription not found', 404);
    if (rx.dispenseStatus === 'DISPENSED') {
      throw new AppError('This prescription has already been dispensed', 400);
    }

    const billItems = [];
    const deducted = [];

    for (const entry of req.body.items) {
      const med = await Medicine.findById(entry.medicineId);
      if (!med) throw new AppError('Selected inventory medicine not found', 404);
      if (med.stockQuantity < entry.quantity) {
        throw new AppError(
          `Insufficient stock for ${med.name} (requested ${entry.quantity}, available ${med.stockQuantity})`,
          400
        );
      }
      med.stockQuantity -= entry.quantity;
      await med.save();
      deducted.push({ name: med.name, quantity: entry.quantity });

      const lineTotal = roundCurrency(med.unitPrice * entry.quantity);
      billItems.push({
        description: `Pharmacy: ${med.name}${med.strength ? ` (${med.strength})` : ''}`,
        quantity: entry.quantity,
        unitPrice: roundCurrency(med.unitPrice),
        total: lineTotal
      });
    }

    if (req.body.dispenseFee > 0) {
      const fee = roundCurrency(req.body.dispenseFee);
      billItems.push({
        description: 'Pharmacy Dispensing Service Fee',
        quantity: 1,
        unitPrice: fee,
        total: fee
      });
    }

    let bill = null;
    if (req.body.createBill && billItems.length > 0) {
      const subtotal = roundCurrency(billItems.reduce((sum, i) => sum + i.total, 0));
      const taxRate = env.TAX_RATE;
      const tax = roundCurrency(subtotal * taxRate);
      const total = roundCurrency(subtotal + tax);

      bill = await Billing.create({
        patientId: rx.patientId,
        ...(rx.appointmentId ? { appointmentId: rx.appointmentId } : {}),
        items: billItems,
        subtotal,
        discount: 0,
        taxRate,
        tax,
        total,
        paidAmount: 0,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      rx.pharmacyBillingId = bill._id;
    }

    rx.dispenseStatus = 'DISPENSED';
    rx.dispensedAt = new Date();
    rx.dispensedByUserId = req.user._id;
    await rx.save();

    await recordAudit({
      req,
      action: 'PHARMACY_DISPENSE',
      resourceType: 'Prescription',
      resourceId: rx._id,
      details: { deducted, billingId: bill?._id || null }
    });

    res.json({
      message: bill
        ? 'Prescription dispensed and pharmacy invoice generated'
        : 'Prescription marked as dispensed',
      prescription: rx,
      billing: bill
    });
  })
);
