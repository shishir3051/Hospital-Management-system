// Patient Routes
import express from 'express';
import { 
  User, 
  Patient, 
  Appointment, 
  Billing 
} from '../models/index.js'; // I'll create an index.js for models
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all patients
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingUsers = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');
      
      const userIds = matchingUsers.map(u => u._id);
      query.$or = [
        { userId: { $in: userIds } },
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : undefined }
      ].filter(q => q._id !== undefined || q.userId !== undefined);
    }

    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate('userId', 'firstName lastName email phone avatar status')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      patients,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Fetch patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get single patient
router.get('/:id', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('userId', 'firstName lastName email phone avatar');
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const appointmentsCount = await Appointment.countDocuments({ patientId: patient._id });
    const billingCount = await Billing.countDocuments({ patientId: patient._id });

    res.json({
      ...patient.toObject(),
      appointmentsCount,
      billingCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create patient (Manually by Admin/Doctor)
router.post('/', authenticate, authorize('ADMIN', 'DOCTOR'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, gender, bloodGroup, address } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user first
    const user = await User.create({
      email,
      password: 'patient123', // Default password for manual creation
      role: 'PATIENT',
      firstName,
      lastName,
      phone: phone || '',
      status: 'ACTIVE'
    });

    // Create patient record
    const patient = await Patient.create({
      userId: user._id,
      dateOfBirth: dateOfBirth || new Date(),
      gender: gender || 'OTHER',
      bloodGroup: bloodGroup || '',
      address: address || '',
      emergencyContact: '',
      medicalHistory: [],
      medications: []
    });

    res.status(201).json({ ...patient.toObject(), userId: user });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
router.put('/:id', authenticate, authorize('ADMIN', 'DOCTOR', 'PATIENT'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Authorization check
    if (req.user.role === 'PATIENT' && patient.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { 
      dateOfBirth, gender, bloodGroup, address, 
      emergencyContact, allergies, medicalHistory, 
      medications, insuranceProvider, insurancePolicyNumber 
    } = req.body;

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          dateOfBirth, gender, bloodGroup, address,
          emergencyContact, allergies, medicalHistory,
          medications, insuranceProvider, insurancePolicyNumber
        }
      },
      { new: true }
    ).populate('userId', 'firstName lastName email phone');

    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete (Deactivate) patient
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Soft delete: deactivate the associated user
    await User.findByIdAndUpdate(patient.userId, { status: 'INACTIVE' });

    res.json({ message: 'Patient account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

export { router as patientRouter };