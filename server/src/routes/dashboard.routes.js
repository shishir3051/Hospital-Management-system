// Dashboard Routes
import express from 'express';
import { 
  Patient, 
  Doctor, 
  Appointment, 
  Billing, 
  User 
} from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticate, authorize('ADMIN', 'DOCTOR'), async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    // Today's appointments
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayAppointmentsCount = await Appointment.countDocuments({
      dateTime: { $gte: startOfDay, $lt: endOfDay }
    });

    // Revenue stats
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const bills = await Billing.find({
      status: 'PAID',
      paymentDate: { $gte: monthStart }
    });

    const monthRevenue = bills.reduce((sum, b) => sum + b.total, 0);
    
    const todayRevenueBills = bills.filter(b => {
      const pDate = new Date(b.paymentDate);
      return pDate >= startOfDay && pDate <= endOfDay;
    });
    const todayRevenue = todayRevenueBills.reduce((sum, b) => sum + b.total, 0);

    // Appointment stats
    const scheduledCount = await Appointment.countDocuments({ status: { $in: ['SCHEDULED', 'CONFIRMED'] } });
    const completedCount = await Appointment.countDocuments({ status: 'COMPLETED' });

    // Doctor availability
    const availableDoctors = await Doctor.countDocuments({ status: 'AVAILABLE' });

    // Recent activity (Last 5 appointments)
    const recentAppointments = await Appointment.find()
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedRecent = recentAppointments.map(a => ({
      ...a.toObject(),
      patientName: `${a.patientId.userId.firstName} ${a.patientId.userId.lastName}`,
      doctorName: `Dr. ${a.doctorId.userId.firstName} ${a.doctorId.userId.lastName}`
    }));

    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments: todayAppointmentsCount,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      scheduledCount,
      completedCount,
      availableDoctors,
      recentAppointments: formattedRecent
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get chart data
router.get('/charts', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const today = new Date();
    
    // Revenue by month (Last 6 months)
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const bills = await Billing.find({
        status: 'PAID',
        paymentDate: { $gte: month, $lt: nextMonth }
      });
      
      const revenue = bills.reduce((sum, b) => sum + b.total, 0);
      revenueByMonth.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: Math.round(revenue * 100) / 100
      });
    }

    // Appointments by status
    const statuses = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const statusCounts = {};
    for (const status of statuses) {
      statusCounts[status] = await Appointment.countDocuments({ status });
    }

    // Doctor performance (Top 5 by completed appointments)
    const doctors = await Doctor.find()
      .populate('userId', 'firstName lastName')
      .limit(10); // Check a decent pool

    const doctorPerformance = [];
    for (const d of doctors) {
      const count = await Appointment.countDocuments({ doctorId: d._id, status: 'COMPLETED' });
      doctorPerformance.push({
        name: d.userId ? `${d.userId.firstName} ${d.userId.lastName}` : 'Unknown',
        specialization: d.specialization,
        appointments: count,
        rating: d.rating
      });
    }
    doctorPerformance.sort((a, b) => b.appointments - a.appointments);

    res.json({
      revenueByMonth,
      statusCounts,
      doctorPerformance: doctorPerformance.slice(0, 5)
    });
  } catch (error) {
    console.error('Dashboard charts error:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Get recent activities
router.get('/activities', authenticate, authorize('ADMIN', 'DOCTOR'), async (req, res) => {
  try {
    const recentAppointments = await Appointment.find()
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .sort({ createdAt: -1 })
      .limit(10);

    const activities = recentAppointments.map(a => ({
      id: a._id,
      type: 'appointment',
      action: a.status === 'COMPLETED' ? 'completed' : a.status === 'CANCELLED' ? 'cancelled' : 'created',
      title: `Appointment ${a.status.toLowerCase()}`,
      description: `${a.patientId.userId.firstName} ${a.patientId.userId.lastName} with Dr. ${a.doctorId.userId.firstName} ${a.doctorId.userId.lastName}`,
      timestamp: a.createdAt,
      status: a.status
    }));

    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export { router as dashboardRouter };