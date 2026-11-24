import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import { dashboardApi, appointmentsApi, billingApi } from '../../../services/api';
import {
  Card,
  StatCard,
  PageHeader,
  Button,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert,
  EmptyState
} from '../../../components/ui';
import { formatCurrency, formatDateTime, formatShortId } from '../../../config/site';
import {
  Calendar,
  FileText,
  CreditCard,
  HeartPulse,
  Plus,
  Clock,
  ArrowRight,
  PhoneCall
} from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, aptRes, billRes] = await Promise.all([
        dashboardApi.getStats(),
        appointmentsApi.getAll({ limit: 6 }),
        billingApi.getAll({ limit: 5 })
      ]);
      setStats(statsRes);
      setAppointments(aptRes.appointments || []);
      setBills(billRes.bills || []);
    } catch (err) {
      setError(err.message || 'Unable to load your patient overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !stats) return <LoadingSpinner label="Loading your health portal..." />;

  const profile = user?.profile;
  const vitals = profile?.vitals;

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Patient'}`}
        subtitle="Track upcoming visits, official prescriptions, clinical vitals, and billing statements."
        actions={
          <>
            {profile?._id && (
              <Link to={`/dashboard/patients/${profile._id}/records`}>
                <Button variant="outline" size="sm">
                  <HeartPulse className="w-4 h-4" aria-hidden="true" />
                  My Health Records
                </Button>
              </Link>
            )}
            <Link to="/appointment">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Book Appointment
              </Button>
            </Link>
          </>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Upcoming Visits"
          value={stats?.upcomingCount ?? 0}
          subtitle={`${stats?.completedVisits ?? 0} completed visits`}
          icon={Calendar}
          tone="primary"
        />
        <StatCard
          label="Active Prescriptions"
          value={stats?.activePrescriptions ?? 0}
          subtitle="Issued by your care team"
          icon={FileText}
          tone="secondary"
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(stats?.pendingBalance ?? 0)}
          subtitle={`${stats?.unpaidBillsCount ?? 0} open invoice(s)`}
          icon={CreditCard}
          tone={stats?.pendingBalance > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Blood Group"
          value={profile?.bloodGroup || 'Not set'}
          subtitle={profile?.allergies ? `Allergies: ${profile.allergies}` : 'Update in Settings'}
          icon={HeartPulse}
          tone="danger"
        />
      </div>

      {/* Recorded Vitals (Only real values — never fabricated) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">Latest Recorded Clinical Vitals</h2>
            <p className="text-xs text-slate-600">Updated by your care team during outpatient visits</p>
          </div>
          {profile?._id && (
            <Link to={`/dashboard/patients/${profile._id}/records`} className="text-xs font-semibold text-primary-700 hover:underline">
              Full EHR
            </Link>
          )}
        </div>
        {vitals && (vitals.bloodPressure || vitals.heartRate || vitals.temperature || vitals.oxygenSaturation) ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5">
              <p className="text-xs font-medium text-slate-600">Blood Pressure</p>
              <p className="text-lg font-display font-bold text-slate-900 mt-1 tabular-nums">
                {vitals.bloodPressure || '—'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5">
              <p className="text-xs font-medium text-slate-600">Heart Rate</p>
              <p className="text-lg font-display font-bold text-slate-900 mt-1 tabular-nums">
                {vitals.heartRate ? `${vitals.heartRate} bpm` : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5">
              <p className="text-xs font-medium text-slate-600">Temperature</p>
              <p className="text-lg font-display font-bold text-slate-900 mt-1 tabular-nums">
                {vitals.temperature ? `${vitals.temperature} °F` : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5">
              <p className="text-xs font-medium text-slate-600">SpO2</p>
              <p className="text-lg font-display font-bold text-slate-900 mt-1 tabular-nums">
                {vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : '—'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            No clinical vitals have been recorded yet. Your nurse or physician will update these at your next visit.
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Appointments */}
        <Card className="lg:col-span-7" padding="p-0">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-slate-900">Your Appointments</h2>
            <Link to="/dashboard/appointments" className="text-xs font-semibold text-primary-700 hover:underline inline-flex items-center gap-1">
              Manage all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {appointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No appointments booked"
              description="Schedule an outpatient consultation with any available specialist."
              action={
                <Link to="/appointment">
                  <Button variant="primary" size="sm">Book First Visit</Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <div key={apt._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      {formatDateTime(apt.dateTime)} · {apt.doctorId?.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={apt.status} />
                    <Link to={`/dashboard/appointments/${apt._id}`}>
                      <Button variant="outline" size="sm">Details</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Invoices & Support */}
        <div className="lg:col-span-5 space-y-6">
          <Card padding="p-0">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900">Recent Invoices</h2>
              <Link to="/dashboard/billing" className="text-xs font-semibold text-primary-700 hover:underline">
                View all
              </Link>
            </div>
            {bills.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">No invoices on file.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {bills.map((bill) => (
                  <div key={bill._id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono font-semibold text-slate-700">
                        {formatShortId(bill._id, 'INV-')}
                      </p>
                      <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                        {formatCurrency(bill.total)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={bill.status} />
                      <Link to={`/dashboard/billing/${bill._id}`}>
                        <Button
                          variant={['UNPAID', 'PARTIAL'].includes(bill.status) ? 'primary' : 'outline'}
                          size="sm"
                        >
                          {['UNPAID', 'PARTIAL'].includes(bill.status) ? 'Pay Now' : 'View'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="bg-secondary-900 text-white border-secondary-900">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5 text-primary-300" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-display font-bold text-white">Need Care Assistance?</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Reach our patient navigation desk for help with rescheduling, medical records, or billing questions.
                </p>
                <Link to="/contact" className="inline-block pt-1">
                  <Button variant="primary" size="sm" className="!bg-primary-600 hover:!bg-primary-500">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
