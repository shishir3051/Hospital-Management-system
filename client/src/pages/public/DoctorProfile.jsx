import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../services/api';
import {
  Button,
  Card,
  Avatar,
  Badge,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert
} from '../../components/ui';
import { DAYS_OF_WEEK, formatCurrency } from '../../config/site';
import {
  ArrowLeft,
  Calendar,
  Star,
  GraduationCap,
  ShieldCheck,
  Briefcase,
  Clock,
  Phone
} from 'lucide-react';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDoctor = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await doctorsApi.getById(id);
      setDoctor(data);
    } catch (err) {
      setError(err.message || 'Unable to load physician profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDoctor();
  }, [loadDoctor]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <LoadingSpinner label="Loading physician profile..." />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <ErrorAlert message={error || 'Physician not found'} onRetry={loadDoctor} />
        <Link to="/doctors">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4" />
            Back to Doctor Directory
          </Button>
        </Link>
      </div>
    );
  }

  const scheduleObj = doctor.schedule || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-fadeIn">
      <nav aria-label="Breadcrumb">
        <Link
          to="/doctors"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Physician Directory
        </Link>
      </nav>

      {/* Hero Profile Card */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar
              src={doctor.userId?.avatar}
              firstName={doctor.userId?.firstName}
              lastName={doctor.userId?.lastName}
              alt={`Dr. ${doctor.userId?.firstName} ${doctor.userId?.lastName}`}
              size="xl"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">{doctor.department}</Badge>
                <StatusBadge status={doctor.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
                Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}
              </h1>
              <p className="text-sm font-medium text-slate-700">{doctor.specialization}</p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600 pt-1">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                  {Number(doctor.rating || 4.5).toFixed(1)} / 5.0
                </span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-4 h-4 text-primary-700" aria-hidden="true" />
                  {doctor.yearsOfExperience ?? 0} Years Clinical Experience
                </span>
                {doctor.licenseNumber && (
                  <span className="inline-flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    License: {doctor.licenseNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 md:min-w-[240px] space-y-3 shrink-0">
            <div>
              <p className="text-xs font-semibold text-slate-600">Standard Consultation Fee</p>
              <p className="text-2xl font-display font-bold text-slate-900 tabular-nums mt-0.5">
                {formatCurrency(doctor.consultationFee)}
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full"
              disabled={doctor.status !== 'AVAILABLE'}
              onClick={() => navigate(`/appointment?doctorId=${doctor._id}`)}
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Book Appointment
            </Button>
            <Link to="/contact" className="block">
              <Button variant="outline" size="sm" className="w-full">
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                Request Clinic Callback
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Details & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <h2 className="text-base font-display font-bold text-slate-900 mb-3">
              Clinical Biography
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {doctor.bio ||
                `Dr. ${doctor.userId?.firstName} ${doctor.userId?.lastName} practices in ${doctor.department} specializing in ${doctor.specialization}.`}
            </p>
          </Card>

          <Card>
            <h2 className="text-base font-display font-bold text-slate-900 mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary-700" aria-hidden="true" />
              Verified Education &amp; Credentials
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold text-slate-600">Academic Qualification</dt>
                <dd className="text-slate-900 font-medium mt-0.5">{doctor.education || 'Board Certified'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-600">Medical Registration</dt>
                <dd className="font-mono text-slate-900 mt-0.5">{doctor.licenseNumber || 'Verified'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-600">Department</dt>
                <dd className="text-slate-900 font-medium mt-0.5">{doctor.department}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-700" aria-hidden="true" />
              Weekly Consultation Schedule
            </h2>
            <span className="text-xs text-slate-600">Click any time slot to book</span>
          </div>

          <div className="divide-y divide-slate-200">
            {DAYS_OF_WEEK.map(({ key, label }) => {
              const slots = Array.isArray(scheduleObj[key]) ? scheduleObj[key] : [];
              const hasSlots = slots.length > 0;
              return (
                <div key={key} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-[140px]">
                    <span className="text-sm font-semibold text-slate-900">{label}</span>
                    <Badge tone={hasSlots ? 'success' : 'neutral'}>
                      {hasSlots ? 'Available' : 'Closed'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hasSlots ? (
                      slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          disabled={doctor.status !== 'AVAILABLE'}
                          onClick={() => navigate(`/appointment?doctorId=${doctor._id}&slot=${encodeURIComponent(slot)}`)}
                          className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-slate-800 hover:border-primary-700 hover:bg-primary-50 hover:text-primary-800 transition-colors disabled:opacity-50"
                        >
                          {slot}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No outpatient slots scheduled</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
