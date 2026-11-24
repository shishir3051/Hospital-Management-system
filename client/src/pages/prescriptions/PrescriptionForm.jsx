import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { prescriptionsApi, patientsApi, doctorsApi, appointmentsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Textarea,
  LoadingSpinner,
  ErrorAlert,
  useToast
} from '../../components/ui';
import { formatDate, toLocalDateInput } from '../../config/site';
import { ArrowLeft, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';

function createMedicationRow(initial = {}) {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: initial.name || '',
    dosage: initial.dosage || '',
    frequency: initial.frequency || 'Twice daily',
    duration: initial.duration || '7 days',
    instructions: initial.instructions || ''
  };
}

export default function PrescriptionForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const isAdmin = user?.role === 'ADMIN';
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    patientId: searchParams.get('patientId') || '',
    doctorId: '',
    appointmentId: searchParams.get('appointmentId') || '',
    diagnosis: '',
    notes: '',
    followUpDate: '',
    status: 'ACTIVE',
    medications: [createMedicationRow()]
  });

  useEffect(() => {
    const loadInit = async () => {
      try {
        setLoadingInit(true);
        const calls = [patientsApi.getAll({ limit: 100 })];
        if (isAdmin) calls.push(doctorsApi.getAll({ limit: 100 }));
        if (isEdit) calls.push(prescriptionsApi.getById(id));

        const results = await Promise.all(calls);
        setPatients(results[0]?.patients || []);
        if (isAdmin) setDoctors(results[1]?.doctors || []);

        const existing = isEdit ? results[isAdmin ? 2 : 1] : null;
        if (existing) {
          const meds = Array.isArray(existing.medications) && existing.medications.length > 0
            ? existing.medications.map((m) => createMedicationRow(m))
            : [createMedicationRow()];
          setFormData({
            patientId: existing.patientId?._id || '',
            doctorId: existing.doctorId?._id || '',
            appointmentId: existing.appointmentId?._id || '',
            diagnosis: existing.diagnosis || '',
            notes: existing.notes || '',
            followUpDate: existing.followUpDate ? toLocalDateInput(existing.followUpDate) : '',
            status: existing.status || 'ACTIVE',
            medications: meds
          });
        }
      } catch (err) {
        setError(err.message || 'Unable to load prescription form');
      } finally {
        setLoadingInit(false);
      }
    };
    loadInit();
  }, [id, isEdit, isAdmin]);

  useEffect(() => {
    if (!formData.patientId) {
      setPatientAppointments([]);
      return;
    }
    appointmentsApi
      .getAll({ patientId: formData.patientId, limit: 20 })
      .then((res) => setPatientAppointments(res.appointments || []))
      .catch(() => setPatientAppointments([]));
  }, [formData.patientId]);

  const updateMed = (rowId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.map((m) =>
        m.rowId === rowId ? { ...m, [field]: value } : m
      )
    }));
  };

  const removeMed = (rowId) => {
    if (formData.medications.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((m) => m.rowId !== rowId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.patientId) {
      setError('Please select a patient.');
      return;
    }
    if (isAdmin && !isEdit && !formData.doctorId) {
      setError('Please select the prescribing physician.');
      return;
    }
    if (formData.medications.length === 0) {
      setError('Add at least one medication.');
      return;
    }

    setSubmitting(true);
    try {
      const medicationsPayload = formData.medications.map(({ rowId: _r, ...rest }) => ({
        name: rest.name.trim(),
        dosage: rest.dosage.trim(),
        frequency: rest.frequency.trim(),
        duration: rest.duration.trim(),
        instructions: rest.instructions.trim()
      }));

      if (isEdit) {
        await prescriptionsApi.update(id, {
          diagnosis: formData.diagnosis.trim(),
          medications: medicationsPayload,
          notes: formData.notes.trim(),
          followUpDate: formData.followUpDate || null,
          status: formData.status
        });
        toast.success('Prescription updated successfully.');
      } else {
        await prescriptionsApi.create({
          patientId: formData.patientId,
          ...(isAdmin ? { doctorId: formData.doctorId } : {}),
          ...(formData.appointmentId ? { appointmentId: formData.appointmentId } : {}),
          diagnosis: formData.diagnosis.trim(),
          medications: medicationsPayload,
          notes: formData.notes.trim(),
          followUpDate: formData.followUpDate || null
        });
        toast.success('Prescription issued successfully.');
      }

      navigate('/dashboard/prescriptions');
    } catch (err) {
      setError(err.message || 'Failed to save prescription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInit) return <LoadingSpinner label="Loading clinical prescription editor..." />;

  const selectedPatientObj = patients.find((p) => p._id === formData.patientId);
  const patientAllergies = selectedPatientObj?.allergies;
  const showAllergyAlert = patientAllergies && patientAllergies.toLowerCase() !== 'none';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <PageHeader
        breadcrumb={
          <Link
            to="/dashboard/prescriptions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Prescriptions
          </Link>
        }
        title={isEdit ? 'Edit Prescription' : 'Issue Digital Prescription (Rx)'}
        subtitle="Record clinical diagnosis, structured medication dosages, and patient instructions."
      />

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-base font-display font-bold text-slate-900">Patient &amp; Clinical Context</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Patient"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value, appointmentId: '' })}
              disabled={isEdit}
              required
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.userId?.firstName} {p.userId?.lastName} ({p.userId?.email})
                </option>
              ))}
            </Select>

            {isAdmin && (
              <Select
                label="Prescribing Physician"
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                disabled={isEdit}
                required
              >
                <option value="">Select physician</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    Dr. {d.userId?.firstName} {d.userId?.lastName} ({d.department})
                  </option>
                ))}
              </Select>
            )}

            <Select
              label="Linked Appointment (Optional)"
              value={formData.appointmentId}
              onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
              disabled={isEdit || !formData.patientId}
            >
              <option value="">Standalone prescription (no linked visit)</option>
              {patientAppointments.map((apt) => (
                <option key={apt._id} value={apt._id}>
                  {formatDate(apt.dateTime)} — {apt.reason?.slice(0, 50)}
                </option>
              ))}
            </Select>

            <Input
              label="Follow-up Date (Optional)"
              type="date"
              min={toLocalDateInput()}
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
            />

            {isEdit && (
              <Select
                label="Prescription Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            )}
          </div>

          <Input
            label="Primary Clinical Diagnosis"
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            placeholder="e.g. Acute Bacterial Sinusitis, Stage 1 Essential Hypertension"
            required
          />

          {showAllergyAlert && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-center gap-2.5 text-sm font-semibold text-rose-900"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
              <span>
                CLINICAL SAFETY ALERT — Documented Patient Allergies: {patientAllergies}
              </span>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-slate-900">
              Medications ({formData.medications.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  medications: [...prev.medications, createMedicationRow()]
                }))
              }
            >
              <Plus className="w-4 h-4" />
              Add Medication
            </Button>
          </div>

          <div className="space-y-4">
            {formData.medications.map((med, idx) => (
              <div
                key={med.rowId}
                className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Medication #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMed(med.rowId)}
                    disabled={formData.medications.length <= 1}
                    aria-label={`Remove medication ${idx + 1}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Input
                    label="Medication Name"
                    value={med.name}
                    onChange={(e) => updateMed(med.rowId, 'name', e.target.value)}
                    placeholder="e.g. Amoxicillin"
                    required
                  />
                  <Input
                    label="Dosage"
                    value={med.dosage}
                    onChange={(e) => updateMed(med.rowId, 'dosage', e.target.value)}
                    placeholder="e.g. 500 mg"
                    required
                  />
                  <Input
                    label="Frequency"
                    value={med.frequency}
                    onChange={(e) => updateMed(med.rowId, 'frequency', e.target.value)}
                    placeholder="e.g. Twice daily"
                    required
                  />
                  <Input
                    label="Duration"
                    value={med.duration}
                    onChange={(e) => updateMed(med.rowId, 'duration', e.target.value)}
                    placeholder="e.g. 7 days"
                    required
                  />
                </div>

                <Input
                  label="Patient Instructions (Optional)"
                  value={med.instructions}
                  onChange={(e) => updateMed(med.rowId, 'instructions', e.target.value)}
                  placeholder="e.g. Take with food; complete full course"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Textarea
            label="Additional Clinical Notes & Advice"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Diet, lifestyle advice, warning signs, or lab follow-up..."
          />
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/dashboard/prescriptions')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            <Save className="w-4 h-4" />
            {isEdit ? 'Save Changes' : 'Issue Prescription'}
          </Button>
        </div>
      </form>
    </div>
  );
}
