import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  Avatar,
  Badge,
  StatusBadge,
  Modal,
  LoadingSpinner,
  ErrorAlert,
  useToast
} from '../../components/ui';
import { DAYS_OF_WEEK, formatCurrency, formatDateTime } from '../../config/site';
import {
  ArrowLeft,
  Edit3,
  Clock,
  Calendar,
  Star,
  Briefcase,
  Mail,
  Phone,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

const STANDARD_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [draftSchedule, setDraftSchedule] = useState({});

  const canEdit =
    user?.role === 'ADMIN' ||
    (user?.role === 'DOCTOR' && user?.profile?._id === id);

  const loadDoctor = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await doctorsApi.getById(id);
      setDoctor(data);
      const normalized = {};
      for (const { key } of DAYS_OF_WEEK) {
        normalized[key] = Array.isArray(data.schedule?.[key]) ? [...data.schedule[key]] : [];
      }
      setDraftSchedule(normalized);
    } catch (err) {
      setError(err.message || 'Unable to load doctor profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDoctor();
  }, [loadDoctor]);

  const toggleSlot = (dayKey, slot) => {
    setDraftSchedule((prev) => {
      const current = prev[dayKey] || [];
      const next = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot].sort();
      return { ...prev, [dayKey]: next };
    });
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await doctorsApi.updateSchedule(id, draftSchedule);
      toast.success('Weekly consultation schedule updated.');
      setScheduleOpen(false);
      loadDoctor();
    } catch (err) {
      toast.error(err.message || 'Failed to update schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading physician profile..." />;

  if (error || !doctor) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error || 'Doctor not found'} onRetry={loadDoctor} />
        <Button variant="outline" onClick={() => navigate('/dashboard/doctors')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Medical Staff
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        breadcrumb={
          <Link
            to="/dashboard/doctors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Medical Staff
          </Link>
        }
        title={`Dr. ${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim()}
        subtitle={`${doctor.department} · ${doctor.specialization}`}
        actions={
          canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={() => setScheduleOpen(true)}>
                <Clock className="w-4 h-4" aria-hidden="true" />
                Edit Schedule
              </Button>
              <Link to={`/dashboard/doctors/${doctor._id}/edit`}>
                <Button variant="primary" size="sm">
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                  Edit Profile
                </Button>
              </Link>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar
              src={doctor.userId?.avatar}
              firstName={doctor.userId?.firstName}
              lastName={doctor.userId?.lastName}
              size="lg"
            />
            <div>
              <StatusBadge status={doctor.status} />
              <p className="text-lg font-display font-bold text-slate-900 mt-1">
                Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}
              </p>
              <p className="text-xs font-semibold text-primary-700">{doctor.department}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
              <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Rating
              </p>
              <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                {Number(doctor.rating || 4.5).toFixed(1)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
              <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-primary-700" />
                Exp
              </p>
              <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                {doctor.yearsOfExperience ?? 0} yrs
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
              <p className="text-xs text-slate-600">Fee</p>
              <p className="text-sm font-bold text-primary-800 tabular-nums mt-0.5">
                {formatCurrency(doctor.consultationFee)}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-100 text-sm text-slate-700">
            {doctor.userId?.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">{doctor.userId.email}</span>
              </div>
            )}
            {doctor.userId?.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{doctor.userId.phone}</span>
              </div>
            )}
            <div className="flex items-start gap-2.5">
              <GraduationCap className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>{doctor.education}</span>
            </div>
            <div className="flex items-center gap-2.5 font-mono text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>License: {doctor.licenseNumber}</span>
            </div>
          </div>

          {doctor.bio && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600 mb-1">Clinical Bio</p>
              <p className="text-sm text-slate-700 leading-relaxed">{doctor.bio}</p>
            </div>
          )}
        </Card>

        <div className="lg:col-span-8 space-y-6">
          {/* 7-Day Weekly Schedule */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-bold text-slate-900">Weekly Consultation Hours</h2>
              {canEdit && (
                <Button variant="ghost" size="sm" onClick={() => setScheduleOpen(true)}>
                  Modify Slots
                </Button>
              )}
            </div>
            <div className="divide-y divide-slate-200">
              {DAYS_OF_WEEK.map(({ key, label }) => {
                const slots = Array.isArray(doctor.schedule?.[key]) ? doctor.schedule[key] : [];
                return (
                  <div key={key} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <span className="text-sm font-semibold text-slate-900">{label}</span>
                      <Badge tone={slots.length > 0 ? 'success' : 'neutral'}>
                        {slots.length > 0 ? `${slots.length} slots` : 'Closed'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {slots.length > 0 ? (
                        slots.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-medium"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No clinic hours</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Upcoming Appointments */}
          <Card padding="p-0">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-700" aria-hidden="true" />
                Upcoming Assigned Visits
              </h2>
              <span className="text-xs text-slate-600 tabular-nums">
                {doctor.completedAppointmentsCount ?? 0} completed total
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {(doctor.upcomingAppointments || []).length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-500">
                  No upcoming appointments assigned.
                </p>
              ) : (
                doctor.upcomingAppointments.map((apt) => (
                  <Link
                    key={apt._id}
                    to={`/dashboard/appointments/${apt._id}`}
                    className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {apt.patientId?.userId?.firstName} {apt.patientId?.userId?.lastName}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {formatDateTime(apt.dateTime)} · {apt.reason}
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

      {/* Weekly Schedule Editor Modal */}
      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Edit Weekly Consultation Schedule"
        subtitle="Toggle available 1-hour consultation slots for each day of the week."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={savingSchedule} onClick={handleSaveSchedule}>
              Save Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const selected = draftSchedule[key] || [];
            return (
              <div key={key} className="pb-3 border-b border-slate-100 last:border-0">
                <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_SLOTS.map((slot) => {
                    const active = selected.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleSlot(key, slot)}
                        className={`px-2.5 py-1 rounded-md border font-mono text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-primary-700 text-white border-primary-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
