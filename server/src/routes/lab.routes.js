import express from 'express';
import { z } from 'zod';
import { LabOrder, Patient, Billing } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, requireValidId, objectIdSchema } from '../middleware/validate.js';
import {
  AppError,
  asyncHandler,
  parsePagination,
  isValidObjectId,
  roundCurrency
} from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';
import { sendEmail } from '../utils/emailService.js';
import { env } from '../config/env.js';

export const labRouter = express.Router();

export const LAB_TEST_CATALOG = [
  {
    testName: 'Complete Blood Count (CBC)',
    category: 'HEMATOLOGY',
    price: 45,
    parameters: [
      { parameter: 'Hemoglobin', unit: 'g/dL', referenceRange: '12.0 - 17.5' },
      { parameter: 'WBC Count', unit: 'x10^3/uL', referenceRange: '4.5 - 11.0' },
      { parameter: 'Platelets', unit: 'x10^3/uL', referenceRange: '150 - 450' },
      { parameter: 'Hematocrit', unit: '%', referenceRange: '36.0 - 50.0' }
    ]
  },
  {
    testName: 'Comprehensive Metabolic Panel (CMP)',
    category: 'BIOCHEMISTRY',
    price: 65,
    parameters: [
      { parameter: 'Fasting Glucose', unit: 'mg/dL', referenceRange: '70 - 99' },
      { parameter: 'Creatinine', unit: 'mg/dL', referenceRange: '0.7 - 1.3' },
      { parameter: 'ALT (SGPT)', unit: 'U/L', referenceRange: '7 - 56' },
      { parameter: 'Potassium', unit: 'mEq/L', referenceRange: '3.5 - 5.1' }
    ]
  },
  {
    testName: 'Lipid Panel (Cholesterol & Triglycerides)',
    category: 'BIOCHEMISTRY',
    price: 55,
    parameters: [
      { parameter: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200' },
      { parameter: 'LDL Cholesterol', unit: 'mg/dL', referenceRange: '< 100' },
      { parameter: 'HDL Cholesterol', unit: 'mg/dL', referenceRange: '> 40' },
      { parameter: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150' }
    ]
  },
  {
    testName: 'Hemoglobin A1c (HbA1c)',
    category: 'BIOCHEMISTRY',
    price: 40,
    parameters: [{ parameter: 'HbA1c', unit: '%', referenceRange: '4.0 - 5.6' }]
  },
  {
    testName: 'Thyroid Function Panel (TSH, Free T4)',
    category: 'BIOCHEMISTRY',
    price: 75,
    parameters: [
      { parameter: 'TSH', unit: 'mIU/L', referenceRange: '0.4 - 4.0' },
      { parameter: 'Free T4', unit: 'ng/dL', referenceRange: '0.8 - 1.8' }
    ]
  },
  {
    testName: 'Urinalysis (Routine & Microscopic)',
    category: 'URINALYSIS',
    price: 35,
    parameters: [
      { parameter: 'pH', unit: '', referenceRange: '4.5 - 8.0' },
      { parameter: 'Specific Gravity', unit: '', referenceRange: '1.005 - 1.030' },
      { parameter: 'Protein', unit: '', referenceRange: 'Negative' },
      { parameter: 'Glucose', unit: '', referenceRange: 'Negative' }
    ]
  },
  {
    testName: 'Chest X-Ray (PA & Lateral)',
    category: 'IMAGING',
    price: 120,
    parameters: [
      { parameter: 'Lung Fields', unit: '', referenceRange: 'Clear bilaterally' },
      { parameter: 'Cardiac Silhouette', unit: '', referenceRange: 'Normal size' }
    ]
  },
  {
    testName: '12-Lead Electrocardiogram (ECG)',
    category: 'IMAGING',
    price: 85,
    parameters: [
      { parameter: 'Rhythm', unit: '', referenceRange: 'Normal Sinus Rhythm' },
      { parameter: 'Ventricular Rate', unit: 'bpm', referenceRange: '60 - 100' }
    ]
  }
];

const createLabOrderSchema = z.object({
  patientId: objectIdSchema,
  appointmentId: objectIdSchema.optional().nullable().or(z.literal('')).transform((v) => v || null),
  testName: z.string().trim().min(2, 'Test name is required').max(200),
  category: z.enum(['HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'IMAGING', 'PATHOLOGY', 'URINALYSIS']).default('HEMATOLOGY'),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).default('ROUTINE'),
  price: z.coerce.number().min(0).max(50000),
  clinicalNotes: z.string().trim().max(1000).optional().default('')
});

const updateStatusSchema = z.object({
  status: z.enum(['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
});

const submitResultsSchema = z.object({
  results: z
    .array(
      z.object({
        parameter: z.string().trim().min(1, 'Parameter name is required').max(150),
        value: z.string().trim().min(1, 'Result value is required').max(150),
        unit: z.string().trim().max(40).optional().default(''),
        referenceRange: z.string().trim().max(120).optional().default(''),
        flag: z.enum(['NORMAL', 'LOW', 'HIGH', 'CRITICAL']).default('NORMAL')
      })
    )
    .min(1, 'At least one result parameter is required'),
  summary: z.string().trim().max(2000).optional().default('')
});

// Clinical test catalog
labRouter.get(
  '/catalog',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH'),
  asyncHandler(async (_req, res) => {
    res.json({ catalog: LAB_TEST_CATALOG });
  })
);

// List lab orders (Clinical staff, Lab Techs, or owning Patient)
labRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH', 'PATIENT'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const { status, priority, category, patientId } = req.query;

    const query = {};
    if (req.user.role === 'PATIENT') {
      if (!req.userProfile) {
        return res.json({ orders: [], total: 0, page, totalPages: 1 });
      }
      query.patientId = req.userProfile._id;
    } else if (isValidObjectId(patientId)) {
      query.patientId = patientId;
    }

    if (typeof status === 'string' && ['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      query.status = status;
    }
    if (typeof priority === 'string' && ['ROUTINE', 'URGENT', 'STAT'].includes(priority)) {
      query.priority = priority;
    }
    if (typeof category === 'string' && ['HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'IMAGING', 'PATHOLOGY', 'URINALYSIS'].includes(category)) {
      query.category = category;
    }

    const [total, orders] = await Promise.all([
      LabOrder.countDocuments(query),
      LabOrder.find(query)
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'firstName lastName email phone' }
        })
        .populate({
          path: 'orderedByDoctorId',
          populate: { path: 'userId', select: 'firstName lastName' }
        })
        .populate('orderedByUserId', 'firstName lastName role')
        .populate('completedByUserId', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      orders,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Get single lab order
labRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH', 'PATIENT'),
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const order = await LabOrder.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email phone' }
      })
      .populate({
        path: 'orderedByDoctorId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate('orderedByUserId', 'firstName lastName role')
      .populate('completedByUserId', 'firstName lastName role');

    if (!order) throw new AppError('Lab order not found', 404);

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile || order.patientId?._id.toString() !== req.userProfile._id.toString()) {
        throw new AppError('Insufficient permissions to view this lab report', 403);
      }
    }

    res.json(order);
  })
);

// Create lab order (Doctor & Admin — auto-generates invoice)
labRouter.post(
  '/',
  authenticate,
  authorize('ADMIN', 'DOCTOR'),
  validateBody(createLabOrderSchema),
  asyncHandler(async (req, res) => {
    const { patientId, appointmentId, testName, category, priority, price, clinicalNotes } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) throw new AppError('Selected patient not found', 404);

    const roundedPrice = roundCurrency(price);
    const taxRate = env.TAX_RATE;
    const tax = roundCurrency(roundedPrice * taxRate);
    const total = roundCurrency(roundedPrice + tax);

    const bill = await Billing.create({
      patientId,
      ...(appointmentId ? { appointmentId } : {}),
      items: [
        {
          description: `Diagnostic Lab: ${testName} (${category})`,
          quantity: 1,
          unitPrice: roundedPrice,
          total: roundedPrice
        }
      ],
      subtotal: roundedPrice,
      discount: 0,
      taxRate,
      tax,
      total,
      paidAmount: 0,
      status: 'UNPAID',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    const order = await LabOrder.create({
      patientId,
      orderedByDoctorId: req.user.role === 'DOCTOR' ? req.userProfile?._id || null : null,
      orderedByUserId: req.user._id,
      appointmentId,
      testName,
      category,
      priority,
      status: 'ORDERED',
      price: roundedPrice,
      billingId: bill._id,
      clinicalNotes
    });

    await order.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email phone' } },
      { path: 'orderedByDoctorId', populate: { path: 'userId', select: 'firstName lastName' } },
      { path: 'orderedByUserId', select: 'firstName lastName role' }
    ]);

    await recordAudit({
      req,
      action: 'LAB_ORDER_CREATE',
      resourceType: 'LabOrder',
      resourceId: order._id,
      details: { testName, priority, patientId }
    });

    res.status(201).json({
      message: 'Diagnostic lab order created',
      order,
      billing: bill
    });
  })
);

// Update lab order workflow status (Admin, Lab Tech, Nurse)
labRouter.put(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'LAB_TECH', 'NURSE'),
  requireValidId('id'),
  validateBody(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const order = await LabOrder.findById(req.params.id);
    if (!order) throw new AppError('Lab order not found', 404);

    if (order.status === 'COMPLETED' && req.body.status !== 'COMPLETED') {
      throw new AppError('Completed lab reports cannot be reverted', 400);
    }

    order.status = req.body.status;
    await order.save();

    if (req.body.status === 'CANCELLED' && order.billingId) {
      await Billing.updateOne(
        { _id: order.billingId, status: 'UNPAID' },
        { $set: { status: 'CANCELLED' } }
      );
    }

    await recordAudit({
      req,
      action: 'LAB_ORDER_STATUS',
      resourceType: 'LabOrder',
      resourceId: order._id,
      details: { status: order.status }
    });

    res.json({ message: `Lab order updated to ${order.status.replace('_', ' ').toLowerCase()}`, order });
  })
);

// Submit lab results & mark completed (Admin, Lab Tech, Doctor)
labRouter.put(
  '/:id/results',
  authenticate,
  authorize('ADMIN', 'LAB_TECH', 'DOCTOR'),
  requireValidId('id'),
  validateBody(submitResultsSchema),
  asyncHandler(async (req, res) => {
    const order = await LabOrder.findById(req.params.id).populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'firstName lastName email' }
    });
    if (!order) throw new AppError('Lab order not found', 404);
    if (order.status === 'CANCELLED') {
      throw new AppError('Cannot enter results on a cancelled lab order', 400);
    }

    order.results = req.body.results;
    order.summary = req.body.summary;
    order.status = 'COMPLETED';
    order.completedByUserId = req.user._id;
    order.completedAt = new Date();
    await order.save();

    await recordAudit({
      req,
      action: 'LAB_RESULTS_PUBLISHED',
      resourceType: 'LabOrder',
      resourceId: order._id,
      details: { testName: order.testName, parameterCount: order.results.length }
    });

    // Non-blocking notification email to patient
    const patientEmail = order.patientId?.userId?.email;
    if (patientEmail && !env.isTest) {
      const patientName = order.patientId?.userId?.firstName || 'Patient';
      sendEmail({
        to: patientEmail,
        subject: `Lab Results Ready: ${order.testName} — HealthCore Medical Center`,
        text: `Hello ${patientName}, your diagnostic report for "${order.testName}" is now available in your HealthCore Patient Portal.`,
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
            <h2 style="color: #0F766E; margin: 0 0 12px;">Diagnostic Report Ready</h2>
            <p style="color: #334155;">Hello ${patientName},</p>
            <p style="color: #334155;">Your laboratory results for <strong>${order.testName}</strong> have been reviewed and published to your patient portal.</p>
            <p style="color: #64748B; font-size: 13px;">Sign in to your HealthCore Medical Center account to view or print your official report.</p>
          </div>
        `
      }).catch(() => {});
    }

    res.json({ message: 'Lab results published successfully', order });
  })
);
