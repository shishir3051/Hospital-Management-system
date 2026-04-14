// Prescription Routes
import express from 'express';
import { 
  Prescription, 
  Appointment, 
  Patient, 
  Doctor 
} from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all prescriptions (Filterable)
router.get('/', authenticate, async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId } = req.query;
    const query = {};

    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (appointmentId) query.appointmentId = appointmentId;

    const prescriptions = await Prescription.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .sort({ createdAt: -1 });

    res.json({ prescriptions, total: prescriptions.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get single prescription
router.get('/:id', authenticate, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName specialization' }
      });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// Create prescription (Doctor only)
router.post('/', authenticate, authorize('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { patientId, appointmentId, medications, diagnosis, notes } = req.body;

    if (!patientId || !medications || medications.length === 0) {
      return res.status(400).json({ error: 'Patient ID and medications are required' });
    }

    // Resolve doctorId from user session if they are a doctor
    let doctorId = req.body.doctorId;
    if (req.user.role === 'DOCTOR') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) doctorId = doctor._id;
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      medications,
      diagnosis: diagnosis || '',
      notes: notes || '',
      issuedDate: new Date()
    });

    res.status(201).json(prescription);
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Update prescription (Doctor only)
router.put('/:id', authenticate, authorize('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { medications, diagnosis, notes } = req.body;

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { $set: { medications, diagnosis, notes } },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prescription' });
  }
});

// Delete prescription (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await Prescription.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prescription' });
  }
});

export { router as prescriptionRouter };
