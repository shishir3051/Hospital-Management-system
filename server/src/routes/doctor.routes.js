// Doctor Routes
import express from 'express';
import { 
  User, 
  Doctor, 
  Appointment 
} from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const { search, specialization, status, department, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingUsers = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex }
        ]
      }).select('_id');
      query.userId = { $in: matchingUsers.map(u => u._id) };
    }

    if (specialization) query.specialization = specialization;
    if (department) query.department = department;
    if (status) query.status = status;

    const total = await Doctor.countDocuments(query);
    const doctors = await Doctor.find(query)
      .populate('userId', 'firstName lastName email phone avatar status')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    res.json({ 
      doctors, 
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Fetch doctors error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get single doctor
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone avatar status');
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const appointmentCount = await Appointment.countDocuments({ doctorId: doctor._id });

    res.json({
      ...doctor.toObject(),
      appointmentCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

// Create doctor (Admin only)
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { 
      firstName, lastName, email, phone, 
      specialization, department, education, 
      yearsOfExperience, consultationFee 
    } = req.body;

    if (!firstName || !lastName || !email || !specialization) {
      return res.status(400).json({ error: 'First name, last name, email, and specialization are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user
    const user = await User.create({
      email,
      password: 'doctor123', // Default password
      role: 'DOCTOR',
      firstName,
      lastName,
      phone: phone || '',
      status: 'ACTIVE'
    });

    // Create doctor record
    const doctor = await Doctor.create({
      userId: user._id,
      specialization,
      department: department || 'GENERAL',
      licenseNumber: 'MD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      education: education || '',
      yearsOfExperience: yearsOfExperience || 0,
      consultationFee: consultationFee || 150,
      status: 'AVAILABLE'
    });

    res.status(201).json({ ...doctor.toObject(), userId: user });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ error: 'Failed to create doctor' });
  }
});

// Update doctor
router.put('/:id', authenticate, authorize('ADMIN', 'DOCTOR'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Authorization check
    if (req.user.role === 'DOCTOR' && doctor.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { 
      specialization, department, education, 
      yearsOfExperience, consultationFee, schedule, status 
    } = req.body;

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          specialization, department, education,
          yearsOfExperience, consultationFee, schedule, status
        }
      },
      { new: true }
    ).populate('userId', 'firstName lastName email phone avatar');

    res.json(updatedDoctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

// Delete (Deactivate) doctor
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Deactivate user
    await User.findByIdAndUpdate(doctor.userId, { status: 'INACTIVE' });
    
    // Update doctor status
    doctor.status = 'ON_LEAVE';
    await doctor.save();

    res.json({ message: 'Doctor account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

export { router as doctorRouter };