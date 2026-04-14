// Appointment Routes
import express from 'express';
import { 
  Appointment, 
  Doctor, 
  Patient, 
  Billing,
  User 
} from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all appointments
router.get('/', authenticate, async (req, res) => {
  try {
    const { patientId, doctorId, status, date, page = 1, limit = 10 } = req.query;
    const query = {};

    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.dateTime = { $gte: start, $lt: end };
    }

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ dateTime: 1 });

    res.json({ 
      appointments, 
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Fetch appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get today's appointments
router.get('/today', authenticate, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      dateTime: { $gte: start, $lt: end }
    })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .sort({ dateTime: 1 });

    res.json({ appointments, total: appointments.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today\'s appointments' });
  }
});

// Get available slots for a doctor
router.get('/available-slots', async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'Doctor ID and date are required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    let availableSlots = [];
    if (doctor.schedule) {
      availableSlots = typeof doctor.schedule.get === 'function' 
        ? doctor.schedule.get(dayOfWeek) 
        : doctor.schedule[dayOfWeek];
    }
    availableSlots = availableSlots || [];

    // Get booked appointments
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctorId: doctor._id,
      dateTime: { $gte: start, $lt: end },
      status: { $in: ['SCHEDULED', 'CONFIRMED'] }
    });

    const bookedTimes = bookedAppointments.map(a => {
      const time = new Date(a.dateTime);
      return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    });

    const freeSlots = availableSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({ slots: freeSlots, date, doctorId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// Get single appointment
router.get('/:id', authenticate, async (req, res) => {
  try {
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
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Create appointment
router.post('/', authenticate, async (req, res) => {
  try {
    const { patientId, doctorId, dateTime, type, reason } = req.body;

    if (!patientId || !doctorId || !dateTime) {
      return res.status(400).json({ error: 'Patient ID, Doctor ID, and date/time are required' });
    }

    // Resolve patientId if user is a patient
    let finalPatientId = patientId;
    if (req.user.role === 'PATIENT') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) {
        finalPatientId = patient._id;
      }
    }

    // Check for conflicts
    const existingAppointment = await Appointment.findOne({
      doctorId,
      dateTime: new Date(dateTime),
      status: { $in: ['SCHEDULED', 'CONFIRMED'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    const appointment = await Appointment.create({
      patientId: finalPatientId,
      doctorId,
      dateTime: new Date(dateTime),
      type: type || 'CONSULTATION',
      reason: reason || '',
      status: 'SCHEDULED'
    });

    // Create billing
    const doctor = await Doctor.findById(doctorId);
    const fee = doctor?.consultationFee || 150;
    
    await Billing.create({
      patientId: finalPatientId,
      appointmentId: appointment._id,
      items: [{ description: 'Consultation Fee', quantity: 1, unitPrice: fee, total: fee }],
      subtotal: fee,
      tax: fee * 0.08,
      total: fee * 1.08,
      status: 'UNPAID',
      dueDate: new Date(dateTime)
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment
router.put('/:id', authenticate, authorize('ADMIN', 'DOCTOR'), async (req, res) => {
  try {
    const { dateTime, type, reason, notes } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          ...(dateTime && { dateTime: new Date(dateTime) }), 
          type, reason, notes 
        } 
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Update status
router.put('/:id/status', authenticate, authorize('ADMIN', 'DOCTOR'), async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete (Cancel) appointment
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Authorization
    if (req.user.role === 'PATIENT') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient && appointment.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

export { router as appointmentRouter };