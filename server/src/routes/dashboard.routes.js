import express from 'express';
import {
  User,
  Patient,
  Doctor,
  Appointment,
  Billing,
  Prescription,
  AuditLog,
  ContactMessage
} from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, parsePagination, roundCurrency } from '../utils/errors.js';

export const dashboardRouter = express.Router();

function formatPersonName(userDoc, fallback = 'Unknown') {
  if (!userDoc) return fallback;
  const full = `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim();
  return full || fallback;
}

// Role-aware dashboard stats (uses MongoDB aggregations + null-safe mapping)
dashboardRouter.get(
  '/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Patient-scoped dashboard stats
    if (req.user.role === 'PATIENT') {
      if (!req.userProfile) {
        return res.json({
          upcomingCount: 0,
          completedVisits: 0,
          activePrescriptions: 0,
          pendingBalance: 0,
          unpaidBillsCount: 0
        });
      }
      const pid = req.userProfile._id;
      const [upcomingCount, completedVisits, activePrescriptions, billAgg] = await Promise.all([
        Appointment.countDocuments({
          patientId: pid,
          dateTime: { $gte: now },
          status: { $in: ['SCHEDULED', 'CONFIRMED'] }
        }),
        Appointment.countDocuments({ patientId: pid, status: 'COMPLETED' }),
        Prescription.countDocuments({ patientId: pid, status: 'ACTIVE' }),
        Billing.aggregate([
          { $match: { patientId: pid, status: { $in: ['UNPAID', 'PARTIAL'] } } },
          {
            $group: {
              _id: null,
              pendingBalance: {
                $sum: { $max: [0, { $subtract: ['$total', { $ifNull: ['$paidAmount', 0] }] }] }
              },
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      return res.json({
        upcomingCount,
        completedVisits,
        activePrescriptions,
        pendingBalance: roundCurrency(billAgg[0]?.pendingBalance || 0),
        unpaidBillsCount: billAgg[0]?.count || 0
      });
    }

    // Doctor-scoped dashboard stats
    if (req.user.role === 'DOCTOR') {
      if (!req.userProfile) {
        return res.json({
          todayAppointments: 0,
          totalAppointments: 0,
          completedAppointments: 0,
          uniquePatients: 0,
          completionRate: 0,
          rating: 0
        });
      }
      const did = req.userProfile._id;
      const [todayAppointments, totalAppointments, completedAppointments, distinctPatients, activeRxCount] =
        await Promise.all([
          Appointment.countDocuments({
            doctorId: did,
            dateTime: { $gte: todayStart, $lte: todayEnd },
            status: { $ne: 'CANCELLED' }
          }),
          Appointment.countDocuments({ doctorId: did }),
          Appointment.countDocuments({ doctorId: did, status: 'COMPLETED' }),
          Appointment.distinct('patientId', { doctorId: did }),
          Prescription.countDocuments({ doctorId: did, status: 'ACTIVE' })
        ]);

      return res.json({
        todayAppointments,
        totalAppointments,
        completedAppointments,
        uniquePatients: distinctPatients.length,
        activePrescriptions: activeRxCount,
        completionRate:
          totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
        rating: Number((req.userProfile.rating || 0).toFixed(1))
      });
    }

    // Staff / Admin / Accountant / Nurse hospital-wide stats
    const [activePatientUsers, activeDoctorUsers] = await Promise.all([
      User.find({ role: 'PATIENT', status: 'ACTIVE' }).distinct('_id'),
      User.find({ role: 'DOCTOR', status: 'ACTIVE' }).distinct('_id')
    ]);

    const [
      totalPatients,
      totalDoctors,
      availableDoctors,
      todayAppointments,
      scheduledCount,
      completedAppointments,
      openInquiries,
      recentAppointments
    ] = await Promise.all([
      Patient.countDocuments({ userId: { $in: activePatientUsers } }),
      Doctor.countDocuments({ userId: { $in: activeDoctorUsers } }),
      Doctor.countDocuments({ userId: { $in: activeDoctorUsers }, status: 'AVAILABLE' }),
      Appointment.countDocuments({
        dateTime: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: 'CANCELLED' }
      }),
      Appointment.countDocuments({ status: { $in: ['SCHEDULED', 'CONFIRMED'] } }),
      Appointment.countDocuments({ status: 'COMPLETED' }),
      req.user.role === 'ADMIN' ? ContactMessage.countDocuments({ status: 'NEW' }) : Promise.resolve(0),
      Appointment.find()
        .populate({ path: 'patientId', populate: { path: 'userId', select: 'firstName lastName' } })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
        .sort({ createdAt: -1 })
        .limit(6)
    ]);

    // Financial aggregates only for ADMIN & ACCOUNTANT
    let revenueStats = { monthRevenue: 0, totalRevenue: 0, pendingAmount: 0, pendingBills: 0 };
    if (['ADMIN', 'ACCOUNTANT'].includes(req.user.role)) {
      const [monthAgg, totalAgg] = await Promise.all([
        Billing.aggregate([
          { $match: { status: 'PAID', paymentDate: { $gte: monthStart } } },
          { $group: { _id: null, sum: { $sum: '$total' } } }
        ]),
        Billing.aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', 'PAID'] },
                    '$total',
                    { $cond: [{ $eq: ['$status', 'PARTIAL'] }, { $ifNull: ['$paidAmount', 0] }, 0] }
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
              pendingBills: {
                $sum: { $cond: [{ $in: ['$status', ['UNPAID', 'PARTIAL']] }, 1, 0] }
              }
            }
          }
        ])
      ]);

      revenueStats = {
        monthRevenue: roundCurrency(monthAgg[0]?.sum || 0),
        totalRevenue: roundCurrency(totalAgg[0]?.totalRevenue || 0),
        pendingAmount: roundCurrency(totalAgg[0]?.pendingAmount || 0),
        pendingBills: totalAgg[0]?.pendingBills || 0
      };
    }

    res.json({
      totalPatients,
      totalDoctors,
      availableDoctors,
      todayAppointments,
      scheduledAppointments: scheduledCount,
      completedAppointments,
      openInquiries,
      ...revenueStats,
      recentAppointments: recentAppointments.map((a) => ({
        id: a._id.toString(),
        _id: a._id.toString(),
        dateTime: a.dateTime,
        type: a.type,
        status: a.status,
        reason: a.reason,
        patientName: formatPersonName(a.patientId?.userId, 'Patient'),
        doctorName: `Dr. ${formatPersonName(a.doctorId?.userId, 'Physician')}`
      }))
    });
  })
);

// Charts analytics (Admin & Accountant — aggregation pipelines, respects ?period)
dashboardRouter.get(
  '/charts',
  authenticate,
  authorize('ADMIN', 'ACCOUNTANT'),
  asyncHandler(async (req, res) => {
    const period = typeof req.query.period === 'string' ? req.query.period : '6months';
    const monthsBack = period === 'year' ? 12 : period === 'month' ? 1 : 6;
    const now = new Date();
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

    const [revenueAgg, statusAgg, topDoctorsAgg] = await Promise.all([
      Billing.aggregate([
        { $match: { status: 'PAID', paymentDate: { $gte: rangeStart } } },
        {
          $group: {
            _id: {
              year: { $year: '$paymentDate' },
              month: { $month: '$paymentDate' }
            },
            revenue: { $sum: '$total' }
          }
        }
      ]),
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Appointment.aggregate([
        { $group: { _id: '$doctorId', appointments: { $sum: 1 } } },
        { $sort: { appointments: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'doctors',
            localField: '_id',
            foreignField: '_id',
            as: 'doctor'
          }
        },
        { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: 'users',
            localField: 'doctor.userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
        {
          $project: {
            _id: 0,
            doctorId: '$_id',
            name: { $concat: ['Dr. ', '$user.firstName', ' ', '$user.lastName'] },
            department: '$doctor.department',
            appointments: 1
          }
        }
      ])
    ]);

    const revMap = new Map(
      revenueAgg.map((r) => [`${r._id.year}-${r._id.month}`, roundCurrency(r.revenue)])
    );

    const revenueByMonth = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      revenueByMonth.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        revenue: revMap.get(key) || 0
      });
    }

    const statusCounts = {
      SCHEDULED: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0
    };
    for (const row of statusAgg) {
      if (row._id in statusCounts) {
        statusCounts[row._id] = row.count;
      }
    }

    res.json({
      period,
      revenueByMonth,
      statusCounts,
      topDoctors: topDoctorsAgg
    });
  })
);

// Recent activities (Role-scoped & null-safe)
dashboardRouter.get(
  '/activities',
  authenticate,
  asyncHandler(async (req, res) => {
    const query = {};
    if (req.user.role === 'PATIENT') {
      if (!req.userProfile) return res.json({ activities: [] });
      query.patientId = req.userProfile._id;
    } else if (req.user.role === 'DOCTOR') {
      if (!req.userProfile) return res.json({ activities: [] });
      query.doctorId = req.userProfile._id;
    }

    const recentAppointments = await Appointment.find(query)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'firstName lastName' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'firstName lastName' } })
      .sort({ updatedAt: -1 })
      .limit(10);

    const activities = recentAppointments.map((a) => ({
      id: a._id.toString(),
      type: 'appointment',
      title: `${a.type} — ${a.status}`,
      description: `${formatPersonName(a.patientId?.userId)} with Dr. ${formatPersonName(a.doctorId?.userId)}`,
      status: a.status,
      timestamp: a.updatedAt || a.createdAt
    }));

    res.json({ activities });
  })
);

// Audit logs (Admin only)
dashboardRouter.get(
  '/audit-logs',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 25, maxLimit: 100 });
    const resourceType = typeof req.query.resourceType === 'string' ? req.query.resourceType.trim() : '';
    const query = {};
    if (resourceType) {
      query.resourceType = resourceType;
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);
