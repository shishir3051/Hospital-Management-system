import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Badge,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  useToast
} from '../../components/ui';
import { formatTime } from '../../config/site';
import {
  Ticket,
  UserPlus,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  RefreshCw,
  Calendar
} from 'lucide-react';

export default function ReceptionQueue() {
  const { user } = useAuth();
  const toast = useToast();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const canCheckIn = ['ADMIN', 'RECEPTIONIST', 'NURSE'].includes(user?.role);

  const loadToday = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await appointmentsApi.getToday();
      setAppointments(res.appointments || []);
    } catch (err) {
      setError(err.message || 'Failed to load today’s check-in queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const handleCheckIn = async (aptId) => {
    setBusyId(aptId);
    try {
      const res = await appointmentsApi.checkIn(aptId);
      toast.success(res.message || 'Patient checked in.');
      loadToday();
    } catch (err) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setBusyId('');
    }
  };

  const handleStatus = async (aptId, nextStatus) => {
    setBusyId(aptId);
    try {
      await appointmentsApi.updateStatus(aptId, nextStatus);
      toast.success(`Queue status updated to ${nextStatus.replace('_', ' ').toLowerCase()}.`);
      loadToday();
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    } finally {
      setBusyId('');
    }
  };

  const active = appointments.filter((a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW');
  const waiting = active.filter((a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status));
  const inRoom = active.filter((a) => a.status === 'IN_PROGRESS');
  const completed = active.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Front Desk & Live Outpatient Queue"
        subtitle="Check in arriving patients, assign daily queue tokens (Q-001), and track consultation rooms."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadToday}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            {canCheckIn && (
              <Link to="/dashboard/patients/new">
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4" />
                  Walk-In Patient
                </Button>
              </Link>
            )}
            <Link to="/dashboard/appointments/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" />
                Book Today
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Today" value={active.length} icon={Calendar} tone="secondary" />
        <StatCard label="Waiting / Checked-In" value={waiting.length} icon={Clock} tone="warning" />
        <StatCard label="In Consultation Room" value={inRoom.length} icon={Play} tone="primary" />
        <StatCard label="Completed Visits" value={completed.length} icon={CheckCircle2} tone="success" />
      </div>

      {error && <ErrorAlert message={error} onRetry={loadToday} />}

      <Card padding="p-0" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-display font-bold text-slate-900">Today&apos;s Live Queue Board</h2>
          <span className="text-xs text-slate-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading live check-in queue..." />
        ) : active.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No appointments scheduled for today"
            description="Walk-in bookings and scheduled visits for today will automatically appear on this check-in board."
            action={
              <Link to="/dashboard/appointments/new">
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4" />
                  Schedule Walk-In Visit
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-slate-200">
            {active.map((apt) => (
              <div
                key={apt._id}
                className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-14 rounded-xl border flex flex-col items-center justify-center shrink-0 font-mono ${
                      apt.queueNumber
                        ? 'bg-primary-50 border-primary-200 text-primary-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide">Token</span>
                    <span className="text-sm font-bold">{apt.queueNumber || '—'}</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {formatTime(apt.dateTime)}
                      </span>
                      <p className="text-sm font-bold text-slate-900">
                        {apt.patientId?.userId?.firstName} {apt.patientId?.userId?.lastName}
                      </p>
                      <StatusBadge status={apt.status} />
                      {apt.type === 'EMERGENCY' && <Badge tone="danger">Urgent</Badge>}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Physician: <strong>Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}</strong>{' '}
                      ({apt.doctorId?.department}) · {apt.reason}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canCheckIn && !apt.queueNumber && ['SCHEDULED', 'CONFIRMED'].includes(apt.status) && (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={busyId === apt._id}
                      onClick={() => handleCheckIn(apt._id)}
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Check In
                    </Button>
                  )}
                  {['SCHEDULED', 'CONFIRMED'].includes(apt.status) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busyId === apt._id}
                      onClick={() => handleStatus(apt._id, 'IN_PROGRESS')}
                    >
                      <Play className="w-3.5 h-3.5" />
                      Call to Room
                    </Button>
                  )}
                  {apt.status === 'IN_PROGRESS' && (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={busyId === apt._id}
                      onClick={() => handleStatus(apt._id, 'COMPLETED')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete
                    </Button>
                  )}
                  <Link to={`/dashboard/appointments/${apt._id}`}>
                    <Button variant="outline" size="sm">Details</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
