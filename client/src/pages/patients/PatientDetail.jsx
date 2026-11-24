import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  Avatar,
  Badge,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert
} from '../../components/ui';
import { calculateAge, formatDate, formatDateTime, formatShortId } from '../../config/site';
import {
  ArrowLeft,
  ClipboardList,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canEdit =
    ['ADMIN', 'DOCTOR', 'NURSE'].includes(user?.role) ||
    (user?.role === 'PATIENT' && user?.profile?._id === id);

  const loadPatient = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await patientsApi.getById(id);
      setPatient(data);
    } catch (err) {
      setError(err.message || 'Unable to load patient profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  if (loading) return <LoadingSpinner label="Loading patient profile..." />;

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error || 'Patient not found'} onRetry={loadPatient} />
        <Button variant="outline" onClick={() => navigate('/dashboard/patients')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Patients
        </Button>
      </div>
    );
  }

  const age = calculateAge(patient.dateOfBirth);
  const hasAllergy = patient.allergies && patient.allergies.toLowerCase() !== 'none';

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        breadcrumb={
          user?.role !== 'PATIENT' && (
            <Link
              to="/dashboard/patients"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back to Patient Directory
            </Link>
          )
        }
        title={`${patient.userId?.firstName || ''} ${patient.userId?.lastName || ''}`.trim() || 'Patient Profile'}
        subtitle={`Patient ID ${formatShortId(patient._id, 'PID-')} · Registered ${formatDate(patient.createdAt)}`}
        actions={
          <>
            {user?.role !== 'ACCOUNTANT' && (
              <Link to={`/dashboard/patients/${patient._id}/records`}>
                <Button variant="primary" size="sm">
                  <ClipboardList className="w-4 h-4" aria-hidden="true" />
                  Open Full EHR
                </Button>
              </Link>
            )}
            {canEdit && (
              <Link to={`/dashboard/patients/${patient._id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                  Edit Profile
                </Button>
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Identity Card */}
        <Card className="lg:col-span-4 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar
              src={patient.userId?.avatar}
              firstName={patient.userId?.firstName}
              lastName={patient.userId?.lastName}
              size="lg"
            />
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">
                {patient.userId?.firstName} {patient.userId?.lastName}
              </h2>
              <p className="text-xs text-slate-600 capitalize">
                {patient.gender?.toLowerCase()} {age !== null ? `· ${age} years` : ''}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Badge tone={patient.bloodGroup ? 'primary' : 'neutral'}>
                  Blood: {patient.bloodGroup || 'Unrecorded'}
                </Badge>
                <StatusBadge status={patient.userId?.status || 'ACTIVE'} />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200 text-sm">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span className="truncate">{patient.userId?.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <Phone className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>{patient.userId?.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{patient.address || 'No residential address recorded'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
              <p className="text-xl font-display font-bold text-slate-900 tabular-nums">
                {patient.appointmentsCount ?? 0}
              </p>
              <p className="text-xs text-slate-600">Appointments</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
              <p className="text-xl font-display font-bold text-slate-900 tabular-nums">
                {patient.prescriptionsCount ?? 0}
              </p>
              <p className="text-xs text-slate-600">Prescriptions</p>
            </div>
          </div>
        </Card>

        {/* Clinical Summary & Recent Appointments */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="space-y-5">
            <h2 className="text-base font-display font-bold text-slate-900">Clinical &amp; Insurance Overview</h2>

            {hasAllergy && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 flex items-center gap-2.5 text-sm text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                <span>
                  <strong>Documented Allergies:</strong> {patient.allergies}
                </span>
              </div>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs font-semibold text-slate-600">Date of Birth</dt>
                <dd className="font-medium text-slate-900 mt-0.5">{formatDate(patient.dateOfBirth)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-600">Emergency Contact</dt>
                <dd className="font-medium text-slate-900 mt-0.5">{patient.emergencyContact || 'Not recorded'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-primary-700" aria-hidden="true" />
                  Insurance Provider
                </dt>
                <dd className="font-medium text-slate-900 mt-0.5">{patient.insuranceProvider || 'Self-pay / None'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-600">Policy Number</dt>
                <dd className="font-mono text-slate-900 mt-0.5">{patient.insurancePolicyNumber || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-slate-600">Documented Medical History</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {Array.isArray(patient.medicalHistory) && patient.medicalHistory.length > 0 ? (
                    patient.medicalHistory.map((item) => (
                      <Badge key={item} tone="neutral">
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-600">No medical history entries recorded.</span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          <Card padding="p-0">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-700" aria-hidden="true" />
                Recent Visits
              </h2>
              <Link to="/dashboard/appointments" className="text-xs font-semibold text-primary-700 hover:underline">
                View appointments
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(patient.recentAppointments || []).length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-500">
                  No appointments recorded for this patient yet.
                </p>
              ) : (
                patient.recentAppointments.map((apt) => (
                  <Link
                    key={apt._id}
                    to={`/dashboard/appointments/${apt._id}`}
                    className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}
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

          {['ADMIN', 'DOCTOR'].includes(user?.role) && (
            <div className="flex justify-end">
              <Link to={`/dashboard/prescriptions/new?patientId=${patient._id}`}>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4" />
                  Issue New Prescription
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
