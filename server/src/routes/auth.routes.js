// Authentication Routes
import express from 'express';
import { 
  User, 
  Patient, 
  Doctor,
  Token,
  findUserByEmail, 
  comparePassword 
} from '../utils/db.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { sendEmail } from '../utils/emailService.js';

const router = express.Router();

// Send Registration OTP
router.post('/send-register-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await Token.deleteMany({ email: email.toLowerCase(), type: 'REGISTER' });
    await Token.create({ email: email.toLowerCase(), token: otp, type: 'REGISTER' });

    await sendEmail({
      to: email,
      subject: 'Your HealthCore Registration OTP',
      text: `Your One-Time Password for registration is: ${otp}. It will expire in 10 minutes.`,
      html: `<h2>Welcome to HealthCore!</h2><p>Your One-Time Password for registration is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Register (now requires OTP)
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'PATIENT', phone, otp } = req.body;

    if (!email || !password || !firstName || !lastName || !otp) {
      return res.status(400).json({ error: 'All fields including OTP are required' });
    }

    const validToken = await Token.findOne({ email: email.toLowerCase(), token: otp, type: 'REGISTER' });
    if (!validToken) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Role-based logic
    const userRole = role.toUpperCase();
    
    const user = await User.create({
      email,
      password, // Password hashing is handled by pre('save') in User.js model
      role: userRole,
      firstName,
      lastName,
      phone: phone || '',
      status: 'ACTIVE'
    });

    // Create additional record based on role
    if (userRole === 'PATIENT') {
      await Patient.create({
        userId: user._id,
        dateOfBirth: new Date(), // Default or placeholder
        gender: 'OTHER',
        bloodGroup: '',
        address: '',
        emergencyContact: '',
        medicalHistory: [],
        medications: []
      });
    } else if (userRole === 'DOCTOR') {
      await Doctor.create({
        userId: user._id,
        specialization: 'General Practice',
        education: 'Default MD',
        yearsOfExperience: 0,
        consultationFee: 100,
        licenseNumber: 'PENDING-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        status: 'AVAILABLE'
      });
    }

    // Clean up OTP
    await Token.deleteMany({ email: email.toLowerCase(), type: 'REGISTER' });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Token.deleteMany({ email: email.toLowerCase(), type: 'RESET_PASSWORD' });
    await Token.create({ email: email.toLowerCase(), token: otp, type: 'RESET_PASSWORD' });

    await sendEmail({
      to: email,
      subject: 'HealthCore Password Reset',
      text: `Your OTP to reset your password is: ${otp}. It will expire in 10 minutes.`,
      html: `<h2>Password Reset Request</h2><p>Your OTP to reset your password is: <strong>${otp}</strong></p><p>If you didn't request this, please ignore this email.</p>`
    });

    res.json({ message: 'Password reset OTP sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset OTP' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields are required' });

    const validToken = await Token.findOne({ email: email.toLowerCase(), token: otp, type: 'RESET_PASSWORD' });
    if (!validToken) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    await Token.deleteMany({ email: email.toLowerCase(), type: 'RESET_PASSWORD' });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    // Get additional info based on role
    let profile = null;
    if (user.role === 'PATIENT') {
      profile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'DOCTOR') {
      profile = await Doctor.findOne({ userId: user._id });
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'PATIENT') {
      profile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'DOCTOR') {
      profile = await Doctor.findOne({ userId: user._id });
    }

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      profile
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Logout
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export { router as authRouter };