import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  StatusBadge,
  Input,
  Textarea,
  LoadingSpinner,
  ErrorAlert,
  PrintablePrescriptionModal,
  useToast,
  useConfirm
} from '../../components/ui';
import { formatCurrency, formatDateTime, formatShortId } from '../../config/site';
import {
  ArrowLeft,
  Calendar,
  User,
  Stethoscope,
  CreditCard,
  FileText,
  FlaskConical,
  CheckCircle2,
  Play,
  XCircle,
  Edit3,
  Plus,
  Save
} from 'lucide-react';

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [apt, setApt] = useState(null);
  const [notes, setNotes] = useState('');
  const [soap, setSoap] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    icdCode: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [selectedRx, setSelectedRx] = useState(null);

  const canManageStatus = ['ADMIN', 'DOCTOR', 'NURSE'].includes(user?.role);
  const canPrescribe = ['ADMIN', 'DOCTOR'].includes(user?.role);
  const canViewBilling = ['ADMIN', 'ACCOUNTANT', 'PATIENT'].includes(user?.role);
  const canViewClinical = ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'].includes(user?.role);

  const loadAppointment = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await appointmentsApi.getById(id);
      setApt(data);
      setNotes(data.notes || '');
      setSoap({
        subjective: data.soapNotes?.subjective || '',
        objective: data.soapNotes?.objective || '',
        assessment: data.soapNotes?.assessment || '',
        plan: data.soapNotes?.plan || '',
        icdCode: data.soapNotes?.icdCode || ''
      });
    } catch (err) {
      setError(err.message || 'Unable to load appointment details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const handleTransition = async (nextStatus) => {
    setUpdating(true);
    try {
      await appointmentsApi.updateStatus(id, nextStatus, notes, soap);
      toast.success(`Appointment marked as ${nextStatus.replace('_', ' ').toLowerCase()}.`);
      loadAppointment();
    } catch (err) {
      toast.error(err.message || 'Status transition failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveSoap = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await appointmentsApi.update(id, { notes, soapNotes: soap });
      toast.success('SOAP clinical documentation saved.');
      loadAppointment();
    } catch (err) {
      toast.error(err.message || 'Failed to save clinical notes');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    const accepted = await confirm({
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment? Any unpaid invoice for this visit will be voided.',
      confirmLabel: 'Cancel Visit',
      variant: 'danger'
    });
    if (!accepted) return;

    setUpdating(true);
    try {
      await appointmentsApi.delete(id);
      toast.success('Appointment cancelled.');
      loadAppointment();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading clinical encounter..." />;

  if (error || !apt) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error || 'Appointment not found'} onRetry={loadAppointment} />
        <Button variant="outline" onClick={() => navigate('/dashboard/appointments')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Appointments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        breadcrumb={
          <Link
            to="/dashboard/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Appointments
          </Link>
        }
        title={`Appointment ${formatShortId(apt._id, 'APT-')}${apt.queueNumber ? ` · Token ${apt.queueNumber}` : ''}`}
        subtitle={`${formatDateTime(apt.dateTime)} · ${apt.duration || 30} min · ${apt.type}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={apt.status} />
            {['SCHEDULED', 'CONFIRMED'].includes(apt.status) && (
              <Link to={`/dashboard/appointments/new?edit=${apt._id}`}>
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4" />
                  Reschedule
                </Button>
              </Link>
            )}
            {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
              <Button variant="danger-outline" size="sm" loading={updating} onClick={handleCancel}>
                <XCircle className="w-4 h-4" />
                Cancel
              </Button>
            )}
          </div>
        }
      />

      {canManageStatus && ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(apt.status) && (
        <Card className="bg-primary-50/60 border-primary-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm font-semibold text-primary-900">Clinical Visit Workflow</p>
          <div className="flex flex-wrap items-center gap-2">
            {apt.status === 'SCHEDULED' && (
              <Button size="sm" variant="secondary" loading={updating} onClick={() => handleTransition('CONFIRMED')}>
                <CheckCircle2 className="w-4 h-4" />
                Confirm Visit
              </Button>
            )}
            {['SCHEDULED', 'CONFIRMED'].includes(apt.status) && (
              <Button size="sm" variant="outline" loading={updating} onClick={() => handleTransition('IN_PROGRESS')}>
                <Play className="w-4 h-4" />
                Start Consultation
              </Button>
            )}
            <Button size="sm" variant="primary" loading={updating} onClick={() => handleTransition('COMPLETED')}>
              <CheckCircle2 className="w-4 h-4" />
              Complete Visit
            </Button>
            {['SCHEDULED', 'CONFIRMED'].includes(apt.status) && (
              <Button size="sm" variant="ghost" loading={updating} onClick={() => handleTransition('NO_SHOW')}>
                Mark No-Show
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary-700" aria-hidden="true" />
                Patient
              </p>
              <p className="text-base font-display font-bold text-slate-900">
                {apt.patientId?.userId?.firstName} {apt.patientId?.userId?.lastName}
              </p>
              <p className="text-xs text-slate-600">{apt.patientId?.userId?.email}</p>
              {canViewClinical && apt.patientId?._id && (
                <Link
                  to={`/dashboard/patients/${apt.patientId._id}/records`}
                  className="inline-block text-xs font-semibold text-primary-700 hover:underline pt-1"
                >
                  Open Patient EHR →
                </Link>
              )}
            </Card>

            <Card className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-secondary-800" aria-hidden="true" />
                Attending Physician
              </p>
              <p className="text-base font-display font-bold text-slate-900">
                Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}
              </p>
              <p className="text-xs text-slate-600">{apt.doctorId?.department}</p>
              <p className="text-xs text-slate-600">{apt.doctorId?.specialization}</p>
            </Card>
          </div>

          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-700" aria-hidden="true" />
                Chief Complaint / Reason for Visit
              </h2>
              <p className="mt-2 text-sm text-slate-800 leading-relaxed">{apt.reason}</p>
            </div>

            {canViewClinical && (
              <div className="pt-4 border-t border-slate-100">
                {canManageStatus ? (
                  <form onSubmit={handleSaveSoap} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-display font-bold text-slate-900">
                        SOAP Clinical Documentation
                      </h3>
                      <Badge tone="primary">Structured EHR</Badge>
                    </div>
                    <Textarea
                      label="S — Subjective (Patient symptoms & history)"
                      rows={2}
                      value={soap.subjective}
                      onChange={(e) => setSoap({ ...soap, subjective: e.target.value })}
                      placeholder="Patient reports intermittent chest tightness on exertion for 3 days..."
                    />
                    <Textarea
                      label="O — Objective (Physical exam & findings)"
                      rows={2}
                      value={soap.objective}
                      onChange={(e) => setSoap({ ...soap, objective: e.target.value })}
                      placeholder="Lungs clear to auscultation bilaterally; regular heart rate and rhythm..."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="A — Assessment / Working Diagnosis"
                        value={soap.assessment}
                        onChange={(e) => setSoap({ ...soap, assessment: e.target.value })}
                        placeholder="Primary clinical impression"
                        className="sm:col-span-2"
                      />
                      <Input
                        label="ICD-10 Code"
                        value={soap.icdCode}
                        onChange={(e) => setSoap({ ...soap, icdCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. I10"
                        inputClassName="font-mono"
                      />
                    </div>
                    <Textarea
                      label="P — Treatment & Follow-Up Plan"
                      rows={2}
                      value={soap.plan}
                      onChange={(e) => setSoap({ ...soap, plan: e.target.value })}
                      placeholder="Order lipid panel + ECG, start Lisinopril 10mg daily, return in 4 weeks..."
                    />
                    <Textarea
                      label="Additional Encounter Notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button type="submit" variant="primary" size="sm" loading={updating}>
                      <Save className="w-4 h-4" />
                      Save SOAP Documentation
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-3 text-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Visit Summary &amp; Care Plan
                    </h3>
                    {soap.assessment || soap.plan || notes ? (
                      <div className="space-y-2 rounded-xl bg-slate-50 border border-slate-200 p-4">
                        {soap.assessment && (
                          <p>
                            <strong>Assessment{soap.icdCode ? ` (${soap.icdCode})` : ''}:</strong> {soap.assessment}
                          </p>
                        )}
                        {soap.plan && (
                          <p>
                            <strong>Plan:</strong> {soap.plan}
                          </p>
                        )}
                        {notes && (
                          <p>
                            <strong>Notes:</strong> {notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-600">No clinical summary recorded for this visit yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar: Billing, Prescriptions, Lab Orders */}
        <div className="lg:col-span-5 space-y-6">
          {canViewBilling && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary-700" aria-hidden="true" />
                  Linked Invoice
                </h2>
                {apt.billing && <StatusBadge status={apt.billing.status} />}
              </div>
              {apt.billing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-slate-600">
                      {formatShortId(apt.billing._id, 'INV-')}
                    </span>
                    <span className="text-lg font-display font-bold text-slate-900 tabular-nums">
                      {formatCurrency(apt.billing.total)}
                    </span>
                  </div>
                  <Link to={`/dashboard/billing/${apt.billing._id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Open Invoice &amp; Payment
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No invoice linked to this visit.</p>
              )}
            </Card>
          )}

          {canViewClinical && (
            <>
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-700" aria-hidden="true" />
                    Prescriptions
                  </h2>
                  {canPrescribe && apt.patientId?._id && (
                    <Link to={`/dashboard/prescriptions/new?patientId=${apt.patientId._id}&appointmentId=${apt._id}`}>
                      <Button variant="primary" size="sm">
                        <Plus className="w-3.5 h-3.5" />
                        Issue Rx
                      </Button>
                    </Link>
                  )}
                </div>
                {(apt.prescriptions || []).length === 0 ? (
                  <p className="text-sm text-slate-600">No prescriptions issued for this appointment.</p>
                ) : (
                  <div className="space-y-2.5">
                    {apt.prescriptions.map((rx) => (
                      <div
                        key={rx._id}
                        className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{rx.diagnosis}</p>
                          <Badge tone="primary" className="mt-1">
                            {(rx.medications || []).length} medications
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedRx(rx)}>
                          View Rx
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-primary-700" aria-hidden="true" />
                    Diagnostic Lab Orders
                  </h2>
                  {canPrescribe && (
                    <Link to="/dashboard/labs">
                      <Button variant="outline" size="sm">
                        <Plus className="w-3.5 h-3.5" />
                        Order Lab
                      </Button>
                    </Link>
                  )}
                </div>
                {(apt.labOrders || []).length === 0 ? (
                  <p className="text-sm text-slate-600">No diagnostic tests linked to this visit.</p>
                ) : (
                  <div className="space-y-2">
                    {apt.labOrders.map((lab) => (
                      <div
                        key={lab._id}
                        className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-2"
                      >
                        <span className="text-sm font-semibold text-slate-900 truncate">{lab.testName}</span>
                        <StatusBadge status={lab.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>

      <PrintablePrescriptionModal
        prescription={selectedRx}
        open={Boolean(selectedRx)}
        onClose={() => setSelectedRx(null)}
      />
    </div>
  );
}
