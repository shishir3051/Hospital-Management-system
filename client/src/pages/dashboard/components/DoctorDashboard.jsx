import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import { dashboardApi, appointmentsApi } from '../../../services/api';
import {
  Card,
  StatCard,
  PageHeader,
  Button,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  useToast
} from '../../../components/ui';
import { formatTime, formatDateTime } from '../../../config/site';
import {
  Calendar,
  Users,
  CheckCircle2,
  Star,
  FileText,
  ClipboardList,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [todayQueue, setTodayQueue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, todayRes, allRes] = await Promise.all([
        dashboardApi.getStats(),
        appointmentsApi.getToday(),
        appointmentsApi.getAll({ limit: 8 })
      ]);
      setStats(statsRes);
      setTodayQueue(todayRes.appointments || []);
      setUpcoming(allRes.appointments || []);
    } catch (err) {
      setError(err.message || 'Failed to load physician dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuickStatus = async (aptId, status) => {
    try {
      await appointmentsApi.updateStatus(aptId, status);
      toast.success(`Appointment marked as ${status.replace('_', ' ').toLowerCase()}`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  if (loading && !stats) return <LoadingSpinner label="Loading clinical schedule..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={`Good day, Dr. ${user?.firstName || ''} ${user?.lastName || ''}`}
        subtitle={`${user?.profile?.department || 'Clinical Practice'} · ${user?.profile?.specialization || 'Attending Physician'}`}
        actions={
          <>
            <Link to="/dashboard/prescriptions/new">
              <Button variant="primary" size="sm">
                <FileText className="w-4 h-4" aria-hidden="true" />
                Write Prescription
              </Button>
            </Link>
            {user?.profile?._id && (
              <Link to={`/dashboard/doctors/${user.profile._id}`}>
                <Button variant="outline" size="sm">
                  My Schedule
                </Button>
              </Link>
            )}
          </>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Queue"
          value={stats?.todayAppointments ?? 0}
          subtitle="Active visits today"
          icon={Calendar}
          tone="primary"
        />
        <StatCard
          label="Patients Treated"
          value={stats?.uniquePatients ?? 0}
          subtitle={`${stats?.totalAppointments ?? 0} total visits`}
          icon={Users}
          tone="secondary"
        />
        <StatCard
          label="Completion Rate"
          value={`${stats?.completionRate ?? 0}%`}
          subtitle={`${stats?.completedAppointments ?? 0} completed`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Clinical Rating"
          value={stats?.rating ? `${Number(stats.rating).toFixed(1)} / 5.0` : '—'}
          subtitle={`${stats?.activePrescriptions ?? 0} active prescriptions`}
          icon={Star}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Queue */}
        <Card className="lg:col-span-7" padding="p-0">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-slate-900">Today&apos;s Consultation Queue</h2>
            <Link to="/dashboard/appointments" className="text-xs font-semibold text-primary-700 hover:underline">
              Full schedule
            </Link>
          </div>

          {todayQueue.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No appointments scheduled today"
              description="Your outpatient schedule for today is currently clear."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {todayQueue.map((apt) => (
                <div key={apt._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary-800 bg-primary-50 px-2 py-0.5 rounded">
                        {formatTime(apt.dateTime)}
                      </span>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {apt.patientId?.userId?.firstName} {apt.patientId?.userId?.lastName}
                      </p>
                      <StatusBadge status={apt.status} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{apt.reason}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {apt.patientId?._id && (
                      <Link to={`/dashboard/patients/${apt.patientId._id}/records`}>
                        <Button variant="outline" size="sm">
                          <ClipboardList className="w-3.5 h-3.5" />
                          EHR
                        </Button>
                      </Link>
                    )}
                    {['SCHEDULED', 'CONFIRMED'].includes(apt.status) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleQuickStatus(apt._id, 'COMPLETED')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent / Upcoming Visits */}
        <Card className="lg:col-span-5" padding="p-0">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-slate-900">Recent Patient Visits</h2>
            <Link
              to="/dashboard/patients"
              className="text-xs font-semibold text-primary-700 hover:underline inline-flex items-center gap-1"
            >
              Patient directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {upcoming.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">No visits recorded yet.</p>
            ) : (
              upcoming.slice(0, 6).map((apt) => (
                <Link
                  key={apt._id}
                  to={`/dashboard/appointments/${apt._id}`}
                  className="px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {apt.patientId?.userId?.firstName} {apt.patientId?.userId?.lastName}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      {formatDateTime(apt.dateTime)}
                    </p>
                  </div>
                  <StatusBadge status={apt.status} />
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
