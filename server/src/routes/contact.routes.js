import express from 'express';
import { z } from 'zod';
import { ContactMessage } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, requireValidId } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimiter.js';
import { sendEmail } from '../utils/emailService.js';
import { AppError, asyncHandler, parsePagination } from '../utils/errors.js';
import { env } from '../config/env.js';

export const contactRouter = express.Router();

const createContactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(120),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().max(40).optional().default(''),
  subject: z.string().trim().min(2, 'Please provide a subject').max(200),
  message: z.string().trim().min(10, 'Please enter a message (at least 10 characters)').max(3000)
});

// Public: Submit contact inquiry
contactRouter.post(
  '/',
  contactLimiter,
  validateBody(createContactSchema),
  asyncHandler(async (req, res) => {
    const inquiry = await ContactMessage.create(req.body);

    // Non-blocking notification to hospital inbox if SMTP is configured
    if (env.SMTP_USER && !env.isTest) {
      sendEmail({
        to: env.SMTP_USER,
        subject: `[HealthCore Inquiry] ${inquiry.subject}`,
        text: `From: ${inquiry.name} (${inquiry.email}, ${inquiry.phone || 'N/A'})\n\n${inquiry.message}`,
        html: `
          <h3>New Contact Inquiry — HealthCore Medical Center</h3>
          <p><strong>Name:</strong> ${inquiry.name}</p>
          <p><strong>Email:</strong> ${inquiry.email}</p>
          <p><strong>Phone:</strong> ${inquiry.phone || 'N/A'}</p>
          <p><strong>Subject:</strong> ${inquiry.subject}</p>
          <p>${inquiry.message}</p>
        `
      }).catch((err) => console.warn('Contact email notify failed:', err.message));
    }

    res.status(201).json({
      message: 'Thank you for contacting HealthCore Medical Center. Our care team will respond shortly.',
      inquiry
    });
  })
);

// Admin: List inquiries
contactRouter.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const query = {};
    if (['NEW', 'REVIEWED', 'RESOLVED'].includes(status)) {
      query.status = status;
    }

    const [total, inquiries] = await Promise.all([
      ContactMessage.countDocuments(query),
      ContactMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    res.json({
      inquiries,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Admin: Update inquiry status
contactRouter.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  requireValidId('id'),
  validateBody(z.object({ status: z.enum(['NEW', 'REVIEWED', 'RESOLVED']) })),
  asyncHandler(async (req, res) => {
    const inquiry = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!inquiry) {
      throw new AppError('Inquiry not found', 404);
    }
    res.json({ message: 'Inquiry status updated', inquiry });
  })
);
