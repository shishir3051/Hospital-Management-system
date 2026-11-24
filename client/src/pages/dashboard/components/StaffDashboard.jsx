import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, appointmentsApi, billingApi, labsApi, pharmacyApi } from '../../../services/api';
import {
  Card,
  StatCard,
  PageHeader,
  Button,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert
} from '../../../components/ui';
import { formatCurrency, formatDateTime, formatShortId } from '../../../config/site';
import {
  Users,
  Calendar,
  DollarSign,
  CreditCard,
  Stethoscope,
  Plus,
  FileText,
  FlaskConical,
  Pill,
  Ticket,
  AlertTriangle
} from 'lucide-react';

const ROLE_META = {
  ACCOUNTANT: {
    title: 'Financial & Billing Operations',
    subtitle: 'Monitor settled revenue, outstanding receivables, and itemized invoicing.'
  },
  NURSE: {
    title: 'Nursing & Clinical Operations',
    subtitle: 'Coordinate today’s outpatient triage, vitals recording, and care delivery.'
  },
  RECEPTIONIST: {
    title: 'Front Desk & Patient Check-In',
    subtitle: 'Manage daily arrivals, assign queue tokens, and register walk-in patients.'
  },
  PHARMACIST: {
    title: 'Hospital Pharmacy Workspace',
    subtitle: 'Verify allergies, dispense pending e-prescriptions, and watch drug inventory alerts.'
  },
  LAB_TECH: {
    title: 'Clinical Laboratory Workspace',
    subtitle: 'Track incoming diagnostic orders, collect samples, and publish verified reports.'
  }
};

export default function StaffDashboard({ role }) {
  const [stats, setStats] = useState(null);
  const [todayVisits, setTodayVisits] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [pharmacyData, setPharmacyData] = useState({ queue: [], alerts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (role === 'LAB_TECH') {
        const labRes = await labsApi.getAll({ limit: 15 });
        setLabOrders(labRes.orders || []);
      } else if (role === 'PHARMACIST') {
        const [qRes, mRes] = await Promise.all([
          pharmacyApi.getQueue({ dispenseStatus: 'PENDING', limit: 10 }),
          pharmacyApi.getMedicines({ limit: 10 })
        ]);
        setPharmacyData({ queue: qRes.prescriptions || [], alerts: mRes.alerts || {} });
      } else {
        const calls = [dashboardApi.getStats(), appointmentsApi.getToday()];
        if (role === 'ACCOUNTANT') {
          calls.push(billingApi.getAll({ status: 'UNPAID', limit: 8 }));
        }
        const [statsRes, todayRes, billRes] = await Promise.all(calls);
        setStats(statsRes);
        setTodayVisits(todayRes.appointments || []);
        setUnpaidBills(billRes?.bills || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingSpinner label="Loading workspace..." />;

  const meta = ROLE_META[role] || ROLE_META.NURSE;

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          role === 'ACCOUNTANT' ? (
            <Link to="/dashboard/billing/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            </Link>
          ) : role === 'PHARMACIST' ? (
            <Link to="/dashboard/pharmacy">
              <Button variant="primary" size="sm">
                <Pill className="w-4 h-4" />
                Open Pharmacy
              </Button>
            </Link>
          ) : role === 'LAB_TECH' ? (
            <Link to="/dashboard/labs">
              <Button variant="primary" size="sm">
                <FlaskConical className="w-4 h-4" />
                Open Lab Queue
              </Button>
            </Link>
          ) : role === 'RECEPTIONIST' ? (
            <Link to="/dashboard/queue">
              <Button variant="primary" size="sm">
                <Ticket className="w-4 h-4" />
                Open Check-In Board
              </Button>
            </Link>
          ) : (
            <Link to="/dashboard/patients/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" />
                Register Patient
              </Button>
            </Link>
          )
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {role === 'LAB_TECH' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Pending Lab Orders"
              value={labOrders.filter((o) => ['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'].includes(o.status)).length}
              icon={FlaskConical}
              tone="warning"
            />
            <StatCard
              label="Urgent / STAT"
              value={labOrders.filter((o) => ['URGENT', 'STAT'].includes(o.priority) && o.status !== 'COMPLETED').length}
              icon={AlertTriangle}
              tone="danger"
            />
            <StatCard
              label="Completed Reports"
              value={labOrders.filter((o) => o.status === 'COMPLETED').length}
              icon={FileText}
              tone="success"
            />
          </div>
          <Card padding="p-0">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900">Recent Diagnostic Queue</h2>
              <Link to="/dashboard/labs" className="text-xs font-semibold text-primary-700 hover:underline">
                Manage All Lab Orders
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {labOrders.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">No lab orders in queue.</p>
              ) : (
                labOrders.slice(0, 8).map((o) => (
                  <Link key={o._id} to="/dashboard/labs" className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{o.testName}</p>
                      <p className="text-xs text-slate-600">
                        {o.patientId?.userId?.firstName} {o.patientId?.userId?.lastName} · {o.category} ({o.priority})
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                  </Link>
                ))
              )}
            </div>
          </Card>
        </>
      )}

      {role === 'PHARMACIST' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Pending Prescriptions" value={pharmacyData.queue.length} icon={Pill} tone="primary" />
            <StatCard label="Low Stock Medicines" value={pharmacyData.alerts.lowStockCount || 0} icon={AlertTriangle} tone="warning" />
            <StatCard label="Out of Stock" value={pharmacyData.alerts.outOfStockCount || 0} icon={AlertTriangle} tone="danger" />
          </div>
          <Card padding="p-0">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900">Prescriptions Awaiting Dispense</h2>
              <Link to="/dashboard/pharmacy" className="text-xs font-semibold text-primary-700 hover:underline">
                Open Pharmacy Console
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {pharmacyData.queue.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">All prescriptions have been dispensed.</p>
              ) : (
                pharmacyData.queue.map((rx) => (
                  <Link key={rx._id} to="/dashboard/pharmacy" className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {rx.patientId?.userId?.firstName} {rx.patientId?.userId?.lastName} — {rx.diagnosis}
                      </p>
                      <p className="text-xs text-slate-600">
                        {(rx.medications || []).length} medications · Dr. {rx.doctorId?.userId?.firstName} {rx.doctorId?.userId?.lastName}
                      </p>
                    </div>
                    <StatusBadge status={rx.dispenseStatus || 'PENDING'} />
                  </Link>
                ))
              )}
            </div>
          </Card>
        </>
      )}

      {role === 'ACCOUNTANT' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Settled Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={DollarSign} tone="success" />
            <StatCard label="This Month" value={formatCurrency(stats?.monthRevenue ?? 0)} icon={CreditCard} tone="primary" />
            <StatCard label="Outstanding Receivables" value={formatCurrency(stats?.pendingAmount ?? 0)} subtitle={`${stats?.pendingBills ?? 0} unpaid/partial`} icon={FileText} tone="warning" />
            <StatCard label="Active Patients" value={stats?.totalPatients ?? 0} icon={Users} tone="secondary" />
          </div>
          <Card padding="p-0">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900">Unpaid Invoices Requiring Follow-Up</h2>
              <Link to="/dashboard/billing" className="text-xs font-semibold text-primary-700 hover:underline">
                Open Billing Ledger
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {unpaidBills.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">All invoices are settled.</p>
              ) : (
                unpaidBills.map((bill) => (
                  <Link key={bill._id} to={`/dashboard/billing/${bill._id}`} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {bill.patientId?.userId?.firstName} {bill.patientId?.userId?.lastName}
                      </p>
                      <p className="text-xs font-mono text-slate-600">{formatShortId(bill._id, 'INV-')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(bill.total)}</span>
                      <StatusBadge status={bill.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </>
      )}

      {(role === 'NURSE' || role === 'RECEPTIONIST') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Today's Visits" value={stats?.todayAppointments ?? 0} icon={Calendar} tone="primary" />
            <StatCard label="Active Patients" value={stats?.totalPatients ?? 0} icon={Users} tone="secondary" />
            <StatCard label="Doctors Available" value={`${stats?.availableDoctors ?? 0} / ${stats?.totalDoctors ?? 0}`} icon={Stethoscope} tone="success" />
            <StatCard label="Upcoming Queue" value={stats?.scheduledAppointments ?? 0} icon={Ticket} tone="warning" />
          </div>
          <Card padding="p-0">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900">Today&apos;s Outpatient Queue</h2>
              <Link to="/dashboard/queue" className="text-xs font-semibold text-primary-700 hover:underline">
                Open Live Check-In Board
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {todayVisits.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">No outpatient visits scheduled today.</p>
              ) : (
                todayVisits.map((apt) => (
                  <Link key={apt._id} to={`/dashboard/appointments/${apt._id}`} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {apt.queueNumber && <span className="font-mono text-primary-700 mr-2">[{apt.queueNumber}]</span>}
                        {apt.patientId?.userId?.firstName} {apt.patientId?.userId?.lastName}{' '}
                        <span className="font-normal text-slate-500">→</span> Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">{formatDateTime(apt.dateTime)}</p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </Link>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
