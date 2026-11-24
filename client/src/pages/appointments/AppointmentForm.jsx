import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { appointmentsApi, doctorsApi, patientsApi } from '../../services/api';
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
import { toLocalDateInput, formatCurrency } from '../../config/site';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

export default function AppointmentForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const editId = searchParams.get('edit') || '';
  const isEdit = Boolean(editId);
  const isStaff = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'].includes(user?.role);

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    patientId: searchParams.get('patientId') || '',
    doctorId: searchParams.get('doctorId') || '',
    date: toLocalDateInput(),
    time: '',
    duration: 30,
    type: 'CONSULTATION',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoadingInit(true);
        const calls = [doctorsApi.getAll({ status: 'AVAILABLE', limit: 100 })];
        if (isStaff) calls.push(patientsApi.getAll({ limit: 100 }));
        if (isEdit) calls.push(appointmentsApi.getById(editId));

        const results = await Promise.all(calls);
        setDoctors(results[0]?.doctors || []);
        if (isStaff) {
          setPatients(results[1]?.patients || []);
        }

        const existing = isEdit ? results[isStaff ? 2 : 1] : null;
        if (existing) {
          const dt = new Date(existing.dateTime);
          const hh = String(dt.getHours()).padStart(2, '0');
          const mm = String(dt.getMinutes()).padStart(2, '0');
          setFormData({
            patientId: existing.patientId?._id || '',
            doctorId: existing.doctorId?._id || '',
            date: toLocalDateInput(dt),
            time: `${hh}:${mm}`,
            duration: existing.duration || 30,
            type: existing.type || 'CONSULTATION',
            reason: existing.reason || '',
            notes: existing.notes || ''
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load scheduling options');
      } finally {
        setLoadingInit(false);
      }
    };
    loadInitial();
  }, [editId, isEdit, isStaff]);

  const loadSlots = useCallback(async () => {
    if (!formData.doctorId || !formData.date) {
      setSlots([]);
      return;
    }
    try {
      setLoadingSlots(true);
      const res = await appointmentsApi.getAvailableSlots(formData.doctorId, formData.date);
      const list = res.slots || [];
      setSlots(list);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [formData.doctorId, formData.date]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.time) {
      setError('Please select an available time slot.');
      return;
    }
    if (isStaff && !isEdit && !formData.patientId) {
      setError('Please select a patient.');
      return;
    }

    setSubmitting(true);
    try {
      const [y, m, d] = formData.date.split('-').map(Number);
      const [hh, mm] = formData.time.split(':').map(Number);
      const dateTime = new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();

      if (isEdit) {
        await appointmentsApi.update(editId, {
          dateTime,
          duration: Number(formData.duration),
          type: formData.type,
          reason: formData.reason.trim(),
          ...(isStaff ? { notes: formData.notes.trim() } : {})
        });
        toast.success('Appointment rescheduled successfully.');
        navigate(`/dashboard/appointments/${editId}`);
      } else {
        const res = await appointmentsApi.create({
          ...(isStaff ? { patientId: formData.patientId } : {}),
          doctorId: formData.doctorId,
          dateTime,
          duration: Number(formData.duration),
          type: formData.type,
          reason: formData.reason.trim(),
          notes: formData.notes.trim()
        });
        toast.success('Appointment booked successfully.');
        navigate(`/dashboard/appointments/${res.appointment?._id || ''}`);
      }
    } catch (err) {
      setError(err.message || 'Unable to save appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInit) return <LoadingSpinner label="Preparing appointment scheduler..." />;

  const slotChoices = isEdit && formData.time && !slots.includes(formData.time)
    ? [formData.time, ...slots].sort()
    : slots;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
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
        title={isEdit ? 'Reschedule Appointment' : 'Schedule Appointment'}
        subtitle="Select a physician and live consultation slot with automatic conflict checking."
      />

      {error && <ErrorAlert message={error} />}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {isStaff && (
            <Select
              label="Patient"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              disabled={isEdit}
              required
            >
              <option value="">Select a registered patient</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.userId?.firstName} {p.userId?.lastName} ({p.userId?.email})
                </option>
              ))}
            </Select>
          )}

          <Select
            label="Physician"
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value, time: '' })}
            disabled={isEdit}
            required
          >
            <option value="">Choose an available specialist</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                Dr. {d.userId?.firstName} {d.userId?.lastName} — {d.department} ({formatCurrency(d.consultationFee)})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Appointment Date"
              type="date"
              icon={Calendar}
              min={toLocalDateInput()}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value, time: '' })}
              required
            />
            <Select
              label="Visit Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="CONSULTATION">Consultation</option>
              <option value="FOLLOWUP">Follow-up</option>
              <option value="CHECKUP">Preventive Check-up</option>
              <option value="EMERGENCY">Urgent / Emergency</option>
            </Select>
          </div>

          {formData.doctorId && formData.date && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary-700" aria-hidden="true" />
                Available Time Slots <span className="text-rose-600">*</span>
              </p>
              {loadingSlots ? (
                <p className="text-xs text-slate-600 py-2">Checking doctor availability...</p>
              ) : slotChoices.length === 0 ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900">
                  No open slots available on this date. Try another day.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {slotChoices.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData({ ...formData, time: slot })}
                      className={`h-9 rounded-lg border font-mono text-xs font-semibold transition-colors ${
                        formData.time === slot
                          ? 'bg-primary-700 text-white border-primary-700'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-primary-400 hover:bg-primary-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Textarea
            label="Reason for Visit"
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Describe symptoms, questions, or reason for consultation..."
            required
          />

          {isStaff && (
            <Textarea
              label="Internal Clinical Notes (Optional)"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Pre-visit triage or preparation notes..."
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => navigate('/dashboard/appointments')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting} disabled={!formData.time}>
              {isEdit ? 'Save Changes' : 'Confirm Booking'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
