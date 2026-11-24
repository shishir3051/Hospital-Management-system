import express from 'express';
import { z } from 'zod';
import { Appointment, Patient, Doctor, Billing, Prescription, LabOrder } from '../utils/db.js';
import { sendEmail } from '../utils/emailService.js';
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
import { env, APPOINTMENT_STATUSES } from '../config/env.js';

export const appointmentRouter = express.Router();

const WEEKDAYS_UTC = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const ALLOWED_TRANSITIONS = {
  SCHEDULED: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: ['SCHEDULED']
};

function parseCalendarDate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  if (
    utcDate.getUTCFullYear() !== y ||
    utcDate.getUTCMonth() !== m - 1 ||
    utcDate.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d, utcDate, weekday: WEEKDAYS_UTC[utcDate.getUTCDay()] };
}

async function hasScheduleConflict(doctorId, dateTime, duration = 30, excludeId = null) {
  const startMs = new Date(dateTime).getTime();
  const endMs = startMs + duration * 60 * 1000;
  const windowStart = new Date(startMs - 4 * 60 * 60 * 1000);
  const windowEnd = new Date(endMs + 4 * 60 * 60 * 1000);

  const filter = {
    doctorId,
    status: { $nin: ['CANCELLED', 'NO_SHOW'] },
    dateTime: { $gte: windowStart, $lte: windowEnd }
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const nearby = await Appointment.find(filter).select('dateTime duration');
  return nearby.some((apt) => {
    const existingStart = new Date(apt.dateTime).getTime();
    const existingEnd = existingStart + (apt.duration || 30) * 60 * 1000;
    return startMs < existingEnd && existingStart < endMs;
  });
}

const createAppointmentSchema = z.object({
  patientId: z.string().optional(),
  doctorId: objectIdSchema,
  dateTime: z.string().min(1, 'Appointment date and time are required'),
  duration: z.coerce.number().min(10).max(240).optional().default(30),
  type: z.enum(['CONSULTATION', 'FOLLOWUP', 'CHECKUP', 'EMERGENCY']).optional().default('CONSULTATION'),
  reason: z.string().trim().min(3, 'Please describe the reason for visit (at least 3 characters)').max(1000),
  notes: z.string().trim().max(2000).optional().default('')
});

const soapNotesSchema = z
  .object({
    subjective: z.string().trim().max(2000).optional().default(''),
    objective: z.string().trim().max(2000).optional().default(''),
    assessment: z.string().trim().max(1500).optional().default(''),
    plan: z.string().trim().max(2000).optional().default(''),
    icdCode: z.string().trim().max(30).optional().default('')
  })
  .optional();

const updateAppointmentSchema = z.object({
  dateTime: z.string().optional(),
  duration: z.coerce.number().min(10).max(240).optional(),
  type: z.enum(['CONSULTATION', 'FOLLOWUP', 'CHECKUP', 'EMERGENCY']).optional(),
  reason: z.string().trim().min(3).max(1000).optional(),
  notes: z.string().trim().max(2000).optional(),
  soapNotes: soapNotesSchema
});

const updateStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  notes: z.string().trim().max(2000).optional(),
  soapNotes: soapNotesSchema
});

// Public: Get available time slots for a doctor on a given YYYY-MM-DD date
appointmentRouter.get(
  '/available-slots',
  asyncHandler(async (req, res) => {
    const { doctorId, date } = req.query;
    if (!isValidObjectId(doctorId)) {
      throw new AppError('A valid doctorId is required', 400);
    }

    const parsed = parseCalendarDate(date);
    if (!parsed) {
      throw new AppError('Date must be provided in YYYY-MM-DD format', 400);
    }

    const doctor = await Doctor.findById(doctorId).populate('userId', 'status');
    if (!doctor || doctor.userId?.status !== 'ACTIVE') {
      throw new AppError('Doctor not found', 404);
    }

    if (doctor.status !== 'AVAILABLE') {
      return res.json({ slots: [], message: 'Doctor is currently unavailable' });
    }

    const scheduleMap = doctor.schedule instanceof Map
      ? doctor.schedule
      : new Map(Object.entries(doctor.schedule || {}));
    const daySlots = scheduleMap.get(parsed.weekday) || [];

    if (daySlots.length === 0) {
      return res.json({ slots: [] });
    }

    // Fetch all active appointments within +/-1 day buffer around the target date
    const dayStart = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, 0, 0, 0, 0) - 14 * 3600 * 1000);
    const dayEnd = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, 23, 59, 59, 999) + 14 * 3600 * 1000);

    const booked = await Appointment.find({
      doctorId,
      dateTime: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['CANCELLED', 'NO_SHOW'] }
    }).select('dateTime duration');

    const nowMs = Date.now();
    const availableSlots = daySlots.filter((slot) => {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotStart = new Date(parsed.y, parsed.m - 1, parsed.d, hours, minutes, 0, 0).getTime();
      const slotEnd = slotStart + 30 * 60 * 1000;

      // Filter out already elapsed slots for today
      if (slotStart < nowMs - 5 * 60 * 1000) {
        return false;
      }

      return !booked.some((apt) => {
        const bStart = new Date(apt.dateTime).getTime();
        const bEnd = bStart + (apt.duration || 30) * 60 * 1000;
        return slotStart < bEnd && bStart < slotEnd;
      });
    });

    res.json({ slots: availableSlots });
  })
);

// Get today's appointments (Role-scoped)
appointmentRouter.get(
  '/today',
  authenticate,
  asyncHandler(async (req, res) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const query = { dateTime: { $gte: start, $lte: end } };

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile) return res.json({ appointments: [] });
      query.patientId = req.userProfile._id;
    } else if (req.user.role === 'DOCTOR') {
      if (!req.userProfile) return res.json({ appointments: [] });
      query.doctorId = req.userProfile._id;
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName phone email' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .sort({ dateTime: 1 });

    res.json({ appointments });
  })
);

// List appointments (Role-scoped & validated filters)
appointmentRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const { patientId, doctorId, status, date, type } = req.query;

    const query = {};

    // Enforce role scoping first (prevents IDOR across patients/doctors)
    if (req.user.role === 'PATIENT') {
      if (!req.userProfile) {
        return res.json({ appointments: [], total: 0, page, totalPages: 1 });
      }
      query.patientId = req.userProfile._id;
    } else if (req.user.role === 'DOCTOR') {
      if (!req.userProfile) {
        return res.json({ appointments: [], total: 0, page, totalPages: 1 });
      }
      query.doctorId = req.userProfile._id;
      if (isValidObjectId(patientId)) {
        query.patientId = patientId;
      }
    } else {
      if (isValidObjectId(patientId)) query.patientId = patientId;
      if (isValidObjectId(doctorId)) query.doctorId = doctorId;
    }

    if (typeof status === 'string' && APPOINTMENT_STATUSES.includes(status)) {
      query.status = status;
    }
    if (typeof type === 'string' && ['CONSULTATION', 'FOLLOWUP', 'CHECKUP', 'EMERGENCY'].includes(type)) {
      query.type = type;
    }
    if (typeof date === 'string' && date) {
      const parsed = parseCalendarDate(date);
      if (!parsed) {
        throw new AppError('Invalid date filter (expected YYYY-MM-DD)', 400);
      }
      const start = new Date(parsed.y, parsed.m - 1, parsed.d, 0, 0, 0, 0);
      const end = new Date(parsed.y, parsed.m - 1, parsed.d, 23, 59, 59, 999);
      query.dateTime = { $gte: start, $lte: end };
    }

    const [total, appointments] = await Promise.all([
      Appointment.countDocuments(query),
      Appointment.find(query)
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'firstName lastName phone email' }
        })
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'firstName lastName' }
        })
        .sort({ dateTime: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      appointments,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// Get appointment detail (Ownership-checked)
appointmentRouter.get(
  '/:id',
  authenticate,
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email phone' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName email phone' }
      });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile || appointment.patientId?._id.toString() !== req.userProfile._id.toString()) {
        throw new AppError('Insufficient permissions to view this appointment', 403);
      }
    } else if (req.user.role === 'DOCTOR') {
      if (!req.userProfile || appointment.doctorId?._id.toString() !== req.userProfile._id.toString()) {
        throw new AppError('Insufficient permissions to view this appointment', 403);
      }
    }

    const canViewBilling = ['ADMIN', 'ACCOUNTANT', 'PATIENT'].includes(req.user.role);
    const canViewClinical = ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'].includes(req.user.role);

    const [billing, prescriptions, labOrders] = await Promise.all([
      canViewBilling ? Billing.findOne({ appointmentId: appointment._id }) : Promise.resolve(null),
      canViewClinical
        ? Prescription.find({ appointmentId: appointment._id }).sort({ createdAt: -1 })
        : Promise.resolve([]),
      canViewClinical
        ? LabOrder.find({ appointmentId: appointment._id }).sort({ createdAt: -1 })
        : Promise.resolve([])
    ]);

    const serialized = appointment.toJSON();
    if (!canViewClinical) {
      serialized.notes = '';
      serialized.soapNotes = undefined;
    }

    res.json({
      ...serialized,
      billing,
      prescriptions,
      labOrders
    });
  })
);

// Create appointment (Resolves patientId for PATIENT BEFORE validation)
appointmentRouter.post(
  '/',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'),
  validateBody(createAppointmentSchema),
  asyncHandler(async (req, res) => {
    const { patientId, doctorId, dateTime, duration, type, reason, notes } = req.body;

    let finalPatientId;
    if (req.user.role === 'PATIENT') {
      if (!req.userProfile) {
        throw new AppError('Patient profile not found for your account', 400);
      }
      finalPatientId = req.userProfile._id.toString();
    } else {
      if (!isValidObjectId(patientId)) {
        throw new AppError('Please select a valid patient', 400);
      }
      finalPatientId = patientId;
    }

    const parsedDate = new Date(dateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError('Invalid appointment date/time', 400);
    }
    if (parsedDate.getTime() < Date.now() - 5 * 60 * 1000) {
      throw new AppError('Appointments cannot be booked in the past', 400);
    }

    const [patient, doctor] = await Promise.all([
      Patient.findById(finalPatientId),
      Doctor.findById(doctorId).populate('userId', 'firstName lastName status')
    ]);

    if (!patient) {
      throw new AppError('Selected patient was not found', 404);
    }
    if (!doctor || doctor.userId?.status !== 'ACTIVE') {
      throw new AppError('Selected doctor was not found', 404);
    }
    if (doctor.status !== 'AVAILABLE') {
      throw new AppError('Selected doctor is currently not accepting appointments', 400);
    }

    const conflict = await hasScheduleConflict(doctorId, parsedDate, duration);
    if (conflict) {
      throw new AppError('This time slot overlaps with an existing appointment for this doctor', 409);
    }

    const appointment = await Appointment.create({
      patientId: finalPatientId,
      doctorId,
      dateTime: parsedDate,
      duration,
      type,
      status: 'SCHEDULED',
      reason,
      notes
    });

    // Auto-generate consultation invoice with consistent tax rate & rounding
    const fee = roundCurrency(doctor.consultationFee ?? 150);
    const taxRate = env.TAX_RATE;
    const tax = roundCurrency(fee * taxRate);
    const total = roundCurrency(fee + tax);

    let bill = null;
    try {
      bill = await Billing.create({
        patientId: finalPatientId,
        appointmentId: appointment._id,
        items: [
          {
            description: `${type.charAt(0) + type.slice(1).toLowerCase()} — Dr. ${doctor.userId.firstName} ${doctor.userId.lastName} (${doctor.department})`,
            quantity: 1,
            unitPrice: fee,
            total: fee
          }
        ],
        subtotal: fee,
        discount: 0,
        taxRate,
        tax,
        total,
        paidAmount: 0,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } catch (billErr) {
      await Appointment.deleteOne({ _id: appointment._id });
      throw billErr;
    }

    await appointment.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email phone' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } }
    ]);

    await recordAudit({
      req,
      action: 'APPOINTMENT_CREATE',
      resourceType: 'Appointment',
      resourceId: appointment._id,
      details: { doctorId, patientId: finalPatientId, billingId: bill._id }
    });

    // Non-blocking booking confirmation email
    const patientEmail = appointment.patientId?.userId?.email;
    if (patientEmail && !env.isTest) {
      const pName = appointment.patientId?.userId?.firstName || 'Patient';
      const dName = `Dr. ${doctor.userId.firstName} ${doctor.userId.lastName}`;
      sendEmail({
        to: patientEmail,
        subject: `Appointment Confirmed — ${dName} (${doctor.department})`,
        text: `Hello ${pName}, your ${type} appointment with ${dName} is scheduled for ${parsedDate.toLocaleString('en-US')}.`,
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
            <h2 style="color: #0F766E; margin: 0 0 12px;">Appointment Confirmation</h2>
            <p style="color: #334155;">Hello ${pName},</p>
            <p style="color: #334155;">Your consultation has been scheduled at <strong>HealthCore Medical Center</strong>:</p>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 14px;">
              <p style="margin: 4px 0;"><strong>Physician:</strong> ${dName} (${doctor.department})</p>
              <p style="margin: 4px 0;"><strong>Date &amp; Time:</strong> ${parsedDate.toLocaleString('en-US')}</p>
              <p style="margin: 4px 0;"><strong>Estimated Fee:</strong> $${total.toFixed(2)} (incl. tax)</p>
            </div>
            <p style="color: #64748B; font-size: 13px;">Please arrive 15 minutes early for front-desk check-in.</p>
          </div>
        `
      }).catch(() => {});
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
      billing: bill
    });
  })
);

// Update / Reschedule appointment (Ownership + conflict check)
appointmentRouter.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'),
  requireValidId('id'),
  validateBody(updateAppointmentSchema),
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile || appointment.patientId.toString() !== req.userProfile._id.toString()) {
        throw new AppError('You can only reschedule your own appointments', 403);
      }
      if (!['SCHEDULED', 'CONFIRMED'].includes(appointment.status)) {
        throw new AppError('Only scheduled or confirmed appointments can be rescheduled', 400);
      }
    } else if (req.user.role === 'DOCTOR') {
      if (!req.userProfile || appointment.doctorId.toString() !== req.userProfile._id.toString()) {
        throw new AppError('You can only update your own assigned appointments', 403);
      }
    }

    const { dateTime, duration, type, reason, notes, soapNotes } = req.body;
    const nextDate = dateTime ? new Date(dateTime) : appointment.dateTime;
    const nextDuration = duration ?? appointment.duration;

    if (dateTime) {
      if (Number.isNaN(nextDate.getTime())) {
        throw new AppError('Invalid appointment date/time', 400);
      }
      if (nextDate.getTime() < Date.now() - 5 * 60 * 1000) {
        throw new AppError('Cannot reschedule an appointment into the past', 400);
      }
    }

    if (dateTime || duration) {
      const conflict = await hasScheduleConflict(
        appointment.doctorId,
        nextDate,
        nextDuration,
        appointment._id
      );
      if (conflict) {
        throw new AppError('The requested time slot conflicts with another appointment', 409);
      }
    }

    const update = {};
    if (dateTime !== undefined) update.dateTime = nextDate;
    if (duration !== undefined) update.duration = nextDuration;
    if (type !== undefined) update.type = type;
    if (reason !== undefined) update.reason = reason;
    if (notes !== undefined && req.user.role !== 'PATIENT') update.notes = notes;
    if (soapNotes !== undefined && ['ADMIN', 'DOCTOR', 'NURSE'].includes(req.user.role)) {
      update.soapNotes = soapNotes;
    }

    const updated = await Appointment.findByIdAndUpdate(appointment._id, update, {
      new: true,
      runValidators: true
    })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'firstName lastName phone email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } });

    await recordAudit({
      req,
      action: 'APPOINTMENT_UPDATE',
      resourceType: 'Appointment',
      resourceId: appointment._id
    });

    res.json({
      message: 'Appointment updated successfully',
      appointment: updated
    });
  })
);

// Front-Desk Check-In & Sequential Daily Queue Token (Admin, Receptionist, Nurse)
appointmentRouter.post(
  '/:id/check-in',
  authenticate,
  authorize('ADMIN', 'RECEPTIONIST', 'NURSE'),
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) throw new AppError('Appointment not found', 404);
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      throw new AppError(`Cannot check in a ${appointment.status.toLowerCase()} appointment`, 400);
    }

    if (!appointment.queueNumber) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const checkedInToday = await Appointment.countDocuments({
        checkedInAt: { $gte: todayStart, $lte: todayEnd }
      });
      appointment.queueNumber = `Q-${String(checkedInToday + 1).padStart(3, '0')}`;
      appointment.checkedInAt = new Date();
    }

    if (appointment.status === 'SCHEDULED') {
      appointment.status = 'CONFIRMED';
    }
    await appointment.save();

    await appointment.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'firstName lastName phone email' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } }
    ]);

    await recordAudit({
      req,
      action: 'APPOINTMENT_CHECK_IN',
      resourceType: 'Appointment',
      resourceId: appointment._id,
      details: { queueNumber: appointment.queueNumber }
    });

    res.json({
      message: `Patient checked in — Queue Token ${appointment.queueNumber}`,
      appointment
    });
  })
);

// Update appointment status (Validated state machine)
appointmentRouter.put(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'),
  requireValidId('id'),
  validateBody(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (req.user.role === 'DOCTOR') {
      if (!req.userProfile || appointment.doctorId.toString() !== req.userProfile._id.toString()) {
        throw new AppError('You can only update status for your own appointments', 403);
      }
    }

    const { status, notes, soapNotes } = req.body;
    if (appointment.status !== status) {
      const allowed = ALLOWED_TRANSITIONS[appointment.status] || [];
      if (!allowed.includes(status)) {
        throw new AppError(
          `Cannot transition appointment from ${appointment.status} to ${status}`,
          400
        );
      }
    }

    appointment.status = status;
    if (notes !== undefined) appointment.notes = notes;
    if (soapNotes !== undefined) appointment.soapNotes = soapNotes;
    await appointment.save();

    if (status === 'CANCELLED') {
      await Billing.updateMany(
        { appointmentId: appointment._id, status: 'UNPAID' },
        { $set: { status: 'CANCELLED' } }
      );
    }

    await appointment.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'firstName lastName phone email' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } }
    ]);

    await recordAudit({
      req,
      action: 'APPOINTMENT_STATUS_CHANGE',
      resourceType: 'Appointment',
      resourceId: appointment._id,
      details: { status }
    });

    res.json({
      message: `Appointment marked as ${status.replace('_', ' ').toLowerCase()}`,
      appointment
    });
  })
);

// Cancel appointment (Ownership-checked, fails closed, voids unpaid billing)
appointmentRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'),
  requireValidId('id'),
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (req.user.role === 'PATIENT') {
      if (!req.userProfile || appointment.patientId.toString() !== req.userProfile._id.toString()) {
        throw new AppError('Insufficient permissions to cancel this appointment', 403);
      }
    } else if (req.user.role === 'DOCTOR') {
      if (!req.userProfile || appointment.doctorId.toString() !== req.userProfile._id.toString()) {
        throw new AppError('Insufficient permissions to cancel this appointment', 403);
      }
    }

    if (appointment.status === 'COMPLETED') {
      throw new AppError('Completed appointments cannot be cancelled', 400);
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    await Billing.updateMany(
      { appointmentId: appointment._id, status: 'UNPAID' },
      { $set: { status: 'CANCELLED' } }
    );

    await recordAudit({
      req,
      action: 'APPOINTMENT_CANCEL',
      resourceType: 'Appointment',
      resourceId: appointment._id
    });

    res.json({ message: 'Appointment cancelled successfully' });
  })
);
