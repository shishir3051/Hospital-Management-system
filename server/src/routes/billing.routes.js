// Billing Routes
import express from 'express';
import { 
  Billing, 
  Patient, 
  User, 
  Appointment, 
  Doctor 
} from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all billing records
router.get('/', authenticate, authorize('ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { patientId, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (patientId) query.patientId = patientId;
    if (status) query.status = status;

    const total = await Billing.countDocuments(query);
    const bills = await Billing.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate({
        path: 'appointmentId',
        populate: { 
          path: 'doctorId', 
          populate: { path: 'userId', select: 'firstName lastName' } 
        }
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ 
      bills, 
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Fetch billing error:', error);
    res.status(500).json({ error: 'Failed to fetch billing records' });
  }
});

// Get single billing record
router.get('/:id', authenticate, async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate({
        path: 'appointmentId',
        populate: { 
          path: 'doctorId', 
          populate: { path: 'userId', select: 'firstName lastName email' } 
        }
      });

    if (!bill) {
      return res.status(404).json({ error: 'Billing record not found' });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch billing record' });
  }
});

// Create billing record
router.post('/', authenticate, authorize('ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { patientId, appointmentId, items, discount = 0 } = req.body;

    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Patient ID and items are required' });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = (subtotal - discount) * 0.08;
    const total = subtotal - discount + tax;

    const bill = await Billing.create({
      patientId,
      appointmentId: appointmentId || null,
      items,
      subtotal,
      discount,
      tax,
      total,
      status: 'UNPAID',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    res.status(201).json(bill);
  } catch (error) {
    console.error('Create billing error:', error);
    res.status(500).json({ error: 'Failed to create billing record' });
  }
});

// Update billing record
router.put('/:id', authenticate, authorize('ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { items, discount, status } = req.body;
    
    let updateFields = { status };
    
    if (items) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const finalDiscount = discount ?? 0;
      const tax = (subtotal - finalDiscount) * 0.08;
      const total = subtotal - finalDiscount + tax;
      
      updateFields.items = items;
      updateFields.subtotal = subtotal;
      updateFields.discount = finalDiscount;
      updateFields.tax = tax;
      updateFields.total = total;
    }

    const bill = await Billing.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ error: 'Billing record not found' });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update billing record' });
  }
});

// Process payment
router.post('/:id/pay', authenticate, async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Billing record not found' });
    }

    if (bill.status === 'PAID') {
      return res.status(400).json({ error: 'Bill already paid' });
    }

    const { paymentMethod } = req.body;

    bill.status = 'PAID';
    bill.paymentMethod = paymentMethod || 'CASH';
    bill.paymentDate = new Date();
    await bill.save();

    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get billing by patient ID
router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const bills = await Billing.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ bills, total: bills.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch billing records' });
  }
});

// Get billing statistics
router.get('/stats/summary', authenticate, authorize('ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const stats = await Billing.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$total', 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'UNPAID'] }, '$total', 0] }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'UNPAID'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalRevenue: 0,
      pendingAmount: 0,
      paidCount: 0,
      pendingCount: 0
    };

    res.json({
      totalRevenue: Math.round(result.totalRevenue * 100) / 100,
      pendingAmount: Math.round(result.pendingAmount * 100) / 100,
      paidCount: result.paidCount,
      pendingCount: result.pendingCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch billing statistics' });
  }
});

export { router as billingRouter };