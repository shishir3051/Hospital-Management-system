import express from 'express';
import { z } from 'zod';
import { Billing, Patient, User } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, requireValidId, objectIdSchema } from '../middleware/validate.js';
import {
  AppError,
  asyncHandler,
  parsePagination,
  isValidObjectId,
  roundCurrency,
  escapeRegex
} from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';
import { sendEmail } from '../utils/emailService.js';
import { env, BILLING_STATUSES, PAYMENT_METHODS } from '../config/env.js';

export const billingRouter = express.Router();

function calculateTotals(rawItems, discountInput = 0, taxRateInput = env.TAX_RATE) {
  const items = rawItems.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = roundCurrency(item.unitPrice);
    const total = roundCurrency(quantity * unitPrice);
    return {
      description: String(item.description).trim(),
      quantity,
      unitPrice,
      total
    };
  });

  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.total, 0));
  const discount = roundCurrency(discountInput);

  if (discount < 0) {
    throw new AppError('Discount cannot be negative', 400);
  }
  if (discount > subtotal) {
    throw new AppError('Discount cannot exceed invoice subtotal', 400);
  }

  const taxRate = Number(taxRateInput);
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
    throw new AppError('Tax rate must be between 0 and 1', 400);
  }

  const taxableBase = roundCurrency(subtotal - discount);
  const tax = roundCurrency(taxableBase * taxRate);
  const total = roundCurrency(taxableBase + tax);

  return { items, subtotal, discount, taxRate, tax, total };
}

const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, 'Item description is required').max(300),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(1000),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative').max(1000000)
});

const createBillingSchema = z.object({
  patientId: objectIdSchema,
  appointmentId: objectIdSchema.optional().nullable().or(z.literal('')).transform((v) => v || undefined),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice line item is required'),
  discount: z.coerce.number().min(0).optional().default(0),
  taxRate: z.coerce.number().min(0).max(1).optional().default(env.TAX_RATE),
  dueDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional().default('')
});

const updateBillingSchema = z.object({
  items: z.array(invoiceItemSchema).min(1).optional(),
  discount: z.coerce.number().min(0).optional(),
  taxRate: z.coerce.number().min(0).max(1).optional(),
  status: z.enum(['UNPAID', 'CANCELLED']).optional(),
  dueDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional()
});

const payBillingSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default('CARD'),
  amount: z.coerce.number().positive('Payment amount must be greater than 0').optional()
});

// Billing summary statistics (Admin/Accountant = hospital-wide, Patient = own bills)
billingRouter.get(
  '/stats/summary',
  authenticate,
  authorize('ADMIN', 'ACCOUNTANT', 'PATIENT'),
  asyncHandler(async (req, res) => {
    const match = {};
    if (req.user.role === 'PATIENT') {
      if (!req.userProfile) {
        return res.json({
          totalRevenue: 0,
          pendingAmount: 0,
          paidCount: 0,
          pendingCount: 0,
          totalBills: 0
        });
      }
      match.patientId = req.userProfile._id;
    }

    const [summary] = await Billing.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'PAID'] },
                '$total',
                {
                  $cond: [
                    { $eq: ['$status', 'PARTIAL'] },
                    { $ifNull: ['$paidAmount', 0] },
                    0
                  ]
                }
              ]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'UNPAID'] },
                '$total',
                {
                  $cond: [
                    { $eq: ['$status', 'PARTIAL'] },
                    { $max: [0, { $subtract: ['$total', { $ifNull: ['$paidAmount', 0] }] }] },
                    0
                  ]
                }
              ]
            }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $in: ['$status', ['UNPAID', 'PARTIAL']] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      totalRevenue: roundCurrency(summary?.totalRevenue || 0),
      pendingAmount: roundCurrency(summary?.pendingAmount || 0),
      paidCount: summary?.paidCount || 0,
      pendingCount: summary?.pendingCount || 0,
      totalBills: summary?.totalBills || 0
    });
  })
);

// Get bills for a specific patient (Admin, Accountant, or owning Patient only)
billingRouter.get(
  '/patient/:patientId',
  authenticate,
  authorize('ADMIN', 'ACCOUNTANT', 'PATIENT'),
  requireValidId('patientId'),
  asyncHandler(async (req, res) => {
    if (req.user.role === 'PATIENT') {
      if (!req.userProfile || req.userProfile._id.toString() !== req.params.patientId) {
        throw new AppError('Insufficient permissions to view these billing records', 403);
      }
    }

    const bills = await Billing.find({ patientId: req.params.patientId })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email phone' }
      })
      .populate({
        path: 'appointmentId',
        select: 'dateTime type status reason'
      })
      .sort({ createdAt: -1 });

    res.json({ bills });
  })
);

// List billing records (Admin/Accountant = all with search; Patient = own only)
billingRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'ACCOUNTANT', 'PATIENT'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 15, maxLimit: 100 });
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const patientId = typeof req.query.patientId === 'string' ? req.query.patientId.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const query = {};

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile) {
        return res.json({ bills: [], total: 0, page, totalPages: 1 });
      }
      query.patientId = req.userProfile._id;
    } else if (patientId && isValidObjectId(patientId)) {
      query.patientId = patientId;
    }

    if (status && BILLING_STATUSES.includes(status)) {
      query.status = status;
    }

    if (search && req.user.role !== 'PATIENT') {
      const safe = escapeRegex(search);
      const regex = new RegExp(safe, 'i');
      const matchedUsers = await User.find({
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }]
      }).distinct('_id');
      const matchedPatients = await Patient.find({ userId: { $in: matchedUsers } }).distinct('_id');

      const orClauses = [{ patientId: { $in: matchedPatients } }];
      if (isValidObjectId(search)) {
        orClauses.push({ _id: search });
      } else if (/^[a-fA-F0-9]{4,24}$/.test(search.replace(/^#/, ''))) {
        const cleanHex = search.replace(/^#/, '').toLowerCase();
        const allIds = await Billing.find(query).select('_id');
        const matchedBillIds = allIds
          .filter((b) => b._id.toString().toLowerCase().includes(cleanHex))
          .map((b) => b._id);
        if (matchedBillIds.length > 0) {
          orClauses.push({ _id: { $in: matchedBillIds } });
        }
      }
      query.$or = orClauses;
    }

    const [total, bills] = await Promise.all([
      Billing.countDocuments(query),
      Billing.find(query)
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'firstName lastName email phone' }
        })
        .populate({
          path: 'appointmentId',
          select: 'dateTime type status reason'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      bills,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Get single invoice by ID (Admin, Accountant, or owning Patient only)
billingRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'ACCOUNTANT', 'PATIENT'),
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const bill = await Billing.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email phone' }
      })
      .populate({
        path: 'appointmentId',
        populate: {
          path: 'doctorId',
          populate: { path: 'userId', select: 'firstName lastName' }
        }
      });

    if (!bill) {
      throw new AppError('Invoice not found', 404);
    }

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile || bill.patientId?._id.toString() !== req.userProfile._id.toString()) {
        throw new AppError('Insufficient permissions to view this invoice', 403);
      }
    }

    res.json(bill);
  })
);

// Create invoice (Admin & Accountant)
billingRouter.post(
  '/',
  authenticate,
  authorize('ADMIN', 'ACCOUNTANT'),
  validateBody(createBillingSchema),
  asyncHandler(async (req, res) => {
    const { patientId, appointmentId, items, discount, taxRate, dueDate, notes } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new AppError('Selected patient not found', 404);
    }

    const totals = calculateTotals(items, discount, taxRate);
    const parsedDue =
      dueDate && !Number.isNaN(Date.parse(dueDate))
        ? new Date(dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const bill = await Billing.create({
      patientId,
      ...(appointmentId ? { appointmentId } : {}),
      ...totals,
      paidAmount: 0,
      status: 'UNPAID',
      dueDate: parsedDue,
      notes
    });

    await bill.populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'firstName lastName email phone' }
    });

    await recordAudit({
      req,
      action: 'BILLING_CREATE',
      resourceType: 'Billing',
      resourceId: bill._id,
      details: { patientId, total: bill.total }
    });

    res.status(201).json({
      message: 'Invoice created successfully',
      bill
    });
  })
);

// Update invoice (Admin & Accountant — blocks modifying PAID/CANCELLED)
billingRouter.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'ACCOUNTANT'),
  requireValidId('id'),
  validateBody(updateBillingSchema),
  asyncHandler(async (req, res) => {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      throw new AppError('Invoice not found', 404);
    }

    if (bill.status === 'PAID') {
      throw new AppError('Paid invoices are finalized and cannot be modified', 400);
    }
    if (bill.status === 'CANCELLED') {
      throw new AppError('Cancelled invoices cannot be modified', 400);
    }

    const nextItems = req.body.items ?? bill.items;
    const nextDiscount = req.body.discount ?? bill.discount;
    const nextTaxRate = req.body.taxRate ?? bill.taxRate ?? env.TAX_RATE;

    const totals = calculateTotals(nextItems, nextDiscount, nextTaxRate);

    bill.items = totals.items;
    bill.subtotal = totals.subtotal;
    bill.discount = totals.discount;
    bill.taxRate = totals.taxRate;
    bill.tax = totals.tax;
    bill.total = totals.total;

    if (req.body.status === 'CANCELLED') {
      bill.status = 'CANCELLED';
    }
    if (req.body.dueDate && !Number.isNaN(Date.parse(req.body.dueDate))) {
      bill.dueDate = new Date(req.body.dueDate);
    }
    if (req.body.notes !== undefined) {
      bill.notes = req.body.notes;
    }

    await bill.save();
    await bill.populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'firstName lastName email phone' }
    });

    await recordAudit({
      req,
      action: 'BILLING_UPDATE',
      resourceType: 'Billing',
      resourceId: bill._id,
      details: { total: bill.total, status: bill.status }
    });

    res.json({
      message: 'Invoice updated successfully',
      bill
    });
  })
);

// Process payment (Admin/Accountant any bill & method; Patient own bill via CARD/ONLINE)
billingRouter.post(
  '/:id/pay',
  authenticate,
  authorize('ADMIN', 'ACCOUNTANT', 'PATIENT'),
  requireValidId('id'),
  validateBody(payBillingSchema),
  asyncHandler(async (req, res) => {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      throw new AppError('Invoice not found', 404);
    }

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile || bill.patientId.toString() !== req.userProfile._id.toString()) {
        throw new AppError('Insufficient permissions to pay this invoice', 403);
      }
      if (!['CARD', 'ONLINE'].includes(req.body.paymentMethod)) {
        throw new AppError('Patients can only settle invoices via Card or Online payment', 400);
      }
    }

    if (bill.status === 'PAID') {
      throw new AppError('This invoice has already been paid in full', 400);
    }
    if (bill.status === 'CANCELLED') {
      throw new AppError('Cancelled invoices cannot be paid', 400);
    }

    const alreadyPaid = roundCurrency(bill.paidAmount || 0);
    const remaining = roundCurrency(Math.max(0, bill.total - alreadyPaid));
    const paymentAmount = req.body.amount ? roundCurrency(req.body.amount) : remaining;

    if (paymentAmount > remaining + 0.01) {
      throw new AppError(`Payment amount exceeds remaining balance ($${remaining.toFixed(2)})`, 400);
    }

    const newPaidAmount = roundCurrency(alreadyPaid + paymentAmount);
    const isFullyPaid = newPaidAmount >= roundCurrency(bill.total) - 0.01;

    bill.paidAmount = isFullyPaid ? bill.total : newPaidAmount;
    bill.status = isFullyPaid ? 'PAID' : 'PARTIAL';
    bill.paymentMethod = req.body.paymentMethod;
    bill.paymentDate = new Date();

    await bill.save();
    await bill.populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'firstName lastName email phone' }
    });

    await recordAudit({
      req,
      action: 'BILLING_PAYMENT',
      resourceType: 'Billing',
      resourceId: bill._id,
      details: {
        amount: paymentAmount,
        paymentMethod: bill.paymentMethod,
        status: bill.status
      }
    });

    // Non-blocking payment receipt email
    const patientEmail = bill.patientId?.userId?.email;
    if (patientEmail && !env.isTest) {
      const pName = bill.patientId?.userId?.firstName || 'Patient';
      sendEmail({
        to: patientEmail,
        subject: `Payment Receipt — Invoice #${bill._id.toString().slice(-8).toUpperCase()}`,
        text: `Hello ${pName}, we received your payment of $${paymentAmount.toFixed(2)} via ${bill.paymentMethod}. Invoice status: ${bill.status}.`,
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
            <h2 style="color: #0F766E; margin: 0 0 12px;">Payment Receipt</h2>
            <p style="color: #334155;">Hello ${pName},</p>
            <p style="color: #334155;">Thank you for your payment of <strong>$${paymentAmount.toFixed(2)}</strong> via <strong>${bill.paymentMethod}</strong>.</p>
            <p style="color: #334155;">Invoice <code>INV-${bill._id.toString().slice(-8).toUpperCase()}</code> is now marked <strong>${bill.status}</strong>.</p>
          </div>
        `
      }).catch(() => {});
    }

    res.json({
      message: isFullyPaid ? 'Payment processed in full' : 'Partial payment recorded',
      bill
    });
  })
);
