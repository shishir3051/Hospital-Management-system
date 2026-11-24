import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { doctorsApi, appointmentsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  Button,
  Card,
  Avatar,
  Badge,
  Select,
  Textarea,
  LoadingSpinner,
  ErrorAlert,
  useToast
} from '../../components/ui';
import {
  DEPARTMENTS,
  formatCurrency,
  formatCalendarDate,
  toLocalDateInput
} from '../../config/site';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Stethoscope,
  LogIn
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Select Specialist' },
  { id: 2, label: 'Date & Time' },
  { id: 3, label: 'Visit Details' },
  { id: 4, label: 'Confirm' }
];

export default function PublicAppointment() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const restored = location.state?.appointmentData;
  const queryDept = searchParams.get('department') || searchParams.get('specialization') || '';
  const queryDoctorId = searchParams.get('doctorId') || location.state?.doctorId || '';
  const querySlot = searchParams.get('slot') || '';

  const [step, setStep] = useState(restored ? 4 : queryDoctorId ? 2 : 1);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(restored?.selectedDepartment || queryDept || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(restored?.selectedDoctorId || queryDoctorId || '');
  const [selectedDate, setSelectedDate] = useState(restored?.selectedDate || toLocalDateInput());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(restored?.selectedSlot || querySlot || '');
  const [appointmentType, setAppointmentType] = useState(restored?.appointmentType || 'CONSULTATION');
  const [reason, setReason] = useState(restored?.reason || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  useEffect(() => {
    doctorsApi
      .getAll({ status: 'AVAILABLE', limit: 100 })
      .then((res) => {
        const list = res.doctors || [];
        setDoctors(list);
        if (queryDoctorId) {
          const found = list.find((d) => d._id === queryDoctorId);
          if (found) setSelectedDepartment(found.department);
        }
      })
      .catch((err) => setError(err.message || 'Unable to load available doctors'))
      .finally(() => setLoadingDoctors(false));
  }, [queryDoctorId]);

  const loadSlots = useCallback(async () => {
    if (!selectedDoctorId || !selectedDate) return;
    try {
      setLoadingSlots(true);
      const res = await appointmentsApi.getAvailableSlots(selectedDoctorId, selectedDate);
      const slots = res.slots || [];
      setAvailableSlots(slots);
      setSelectedSlot((prev) => (prev && slots.includes(prev) ? prev : ''));
    } catch {
      setAvailableSlots([]);
      setSelectedSlot('');
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDoctorId, selectedDate]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId) || null;
  const filteredDoctors = selectedDepartment
    ? doctors.filter((d) => d.department === selectedDepartment)
    : doctors;

  const upcomingDates = Array.from({ length: 14 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    return toLocalDateInput(d);
  });

  const handleContinueFromDetails = (e) => {
    e.preventDefault();
    setError('');
    if (reason.trim().length < 3) {
      setError('Please describe your reason for visiting (at least 3 characters).');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: '/appointment',
          appointmentData: {
            selectedDepartment,
            selectedDoctorId,
            selectedDate,
            selectedSlot,
            appointmentType,
            reason: reason.trim()
          }
        }
      });
      return;
    }

    setStep(4);
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: '/appointment',
          appointmentData: {
            selectedDepartment,
            selectedDoctorId,
            selectedDate,
            selectedSlot,
            appointmentType,
            reason: reason.trim()
          }
        }
      });
      return;
    }

    if (user?.role !== 'PATIENT') {
      setError(
        `You are signed in as ${user?.role}. Staff members should schedule patient appointments from the Portal Appointments page.`
      );
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const [hh, mm] = selectedSlot.split(':').map(Number);
      const localDateTime = new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();

      const res = await appointmentsApi.create({
        doctorId: selectedDoctorId,
        dateTime: localDateTime,
        type: appointmentType,
        reason: reason.trim()
      });

      setConfirmedAppointment(res.appointment);
      toast.success('Appointment booked successfully!');
    } catch (err) {
      setError(err.message || 'Unable to complete booking. Please try another slot.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedAppointment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-14 animate-fadeIn">
        <Card className="p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Appointment Confirmed</h1>
            <p className="text-sm text-slate-600 mt-1">
              Your visit has been scheduled and added to your patient portal.
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Specialist</span>
              <span className="font-semibold text-slate-900">
                Dr. {selectedDoctor?.userId?.firstName} {selectedDoctor?.userId?.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Department</span>
              <span className="font-medium text-slate-900">{selectedDoctor?.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Date &amp; Time</span>
              <span className="font-semibold text-primary-800">
                {formatCalendarDate(selectedDate)} at {selectedSlot}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Consultation Fee</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatCurrency(selectedDoctor?.consultationFee)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/dashboard/appointments">
              <Button variant="primary">View My Appointments</Button>
            </Link>
            <Link to="/dashboard/billing">
              <Button variant="outline">View Invoice</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-fadeIn">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
          Online Scheduling
        </p>
        <h1 className="mt-1 text-3xl font-display font-bold text-slate-900">
          Book a Clinical Appointment
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose an available specialist, pick a live slot, and confirm your visit.
        </p>
      </div>

      {/* Stepper */}
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label="Booking progress">
        {STEPS.map((s) => {
          const active = step === s.id;
          const completed = step > s.id;
          return (
            <li
              key={s.id}
              className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-semibold ${
                active
                  ? 'bg-primary-50 border-primary-300 text-primary-900'
                  : completed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  active
                    ? 'bg-primary-700 text-white'
                    : completed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {s.id}
              </span>
              <span className="truncate">{s.label}</span>
            </li>
          );
        })}
      </ol>

      {error && <ErrorAlert message={error} />}

      {/* Step 1: Select Department & Doctor */}
      {step === 1 && (
        <Card className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-display font-bold text-slate-900">
              Choose Your Specialist
            </h2>
            <Select
              aria-label="Filter by department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="sm:w-72"
            >
              <option value="">All Clinical Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
          </div>

          {loadingDoctors ? (
            <LoadingSpinner label="Loading available specialists..." />
          ) : filteredDoctors.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-900">
                No available physicians in this department right now.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSelectedDepartment('')}>
                Show All Available Physicians
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doc) => {
                const isSelected = doc._id === selectedDoctorId;
                return (
                  <button
                    key={doc._id}
                    type="button"
                    onClick={() => {
                      setSelectedDoctorId(doc._id);
                      setSelectedDepartment(doc.department);
                      setSelectedSlot('');
                    }}
                    className={`text-left rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-primary-700 bg-primary-50/50 ring-2 ring-primary-700/20'
                        : 'border-slate-200 bg-white hover:border-primary-300'
                    }`}
                  >
                    <Avatar
                      src={doc.userId?.avatar}
                      firstName={doc.userId?.firstName}
                      lastName={doc.userId?.lastName}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-display font-bold text-slate-900">
                        Dr. {doc.userId?.firstName} {doc.userId?.lastName}
                      </p>
                      <p className="text-xs font-semibold text-primary-700">{doc.department}</p>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">{doc.specialization}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-700">
                        <span>{doc.yearsOfExperience} yrs exp</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {formatCurrency(doc.consultationFee)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              variant="primary"
              disabled={!selectedDoctorId}
              onClick={() => setStep(2)}
            >
              Continue to Date &amp; Time
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <Card className="space-y-6">
          {selectedDoctor && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedDoctor.userId?.avatar}
                  firstName={selectedDoctor.userId?.firstName}
                  lastName={selectedDoctor.userId?.lastName}
                />
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Dr. {selectedDoctor.userId?.firstName} {selectedDoctor.userId?.lastName}
                  </p>
                  <p className="text-xs text-slate-600">
                    {selectedDoctor.department} · {formatCurrency(selectedDoctor.consultationFee)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Change
              </Button>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary-700" aria-hidden="true" />
              Select Date
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {upcomingDates.map((d) => {
                const active = d === selectedDate;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedSlot('');
                    }}
                    className={`rounded-lg border px-2.5 py-2 text-center text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300'
                    }`}
                  >
                    {formatCalendarDate(d).replace(/, \d{4}$/, '')}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-700" aria-hidden="true" />
              Available Time Slots ({formatCalendarDate(selectedDate)})
            </p>
            {loadingSlots ? (
              <LoadingSpinner label="Checking live availability..." />
            ) : availableSlots.length === 0 ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
                No open time slots on this date. Please select another day above.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`h-10 rounded-lg border font-mono text-sm font-semibold transition-colors ${
                      selectedSlot === slot
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

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button variant="primary" disabled={!selectedSlot} onClick={() => setStep(3)}>
              Continue to Visit Details
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Visit Details */}
      {step === 3 && (
        <Card>
          <form onSubmit={handleContinueFromDetails} className="space-y-5">
            <h2 className="text-lg font-display font-bold text-slate-900">Visit Details</h2>

            <Select
              label="Appointment Type"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
            >
              <option value="CONSULTATION">Initial Consultation</option>
              <option value="FOLLOWUP">Follow-up Visit</option>
              <option value="CHECKUP">Preventive Check-up</option>
              <option value="EMERGENCY">Urgent Evaluation</option>
            </Select>

            <Textarea
              label="Reason for Visit"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your symptoms, questions, or follow-up needs..."
              required
            />

            {!isAuthenticated && (
              <div className="rounded-xl bg-secondary-50 border border-secondary-200 p-4 flex items-center gap-3 text-sm text-secondary-900">
                <LogIn className="w-5 h-5 shrink-0 text-secondary-800" aria-hidden="true" />
                <span>
                  You will be prompted to sign in on the next step — your selected doctor, date, and time will be saved automatically.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button type="submit" variant="primary">
                {isAuthenticated ? 'Review & Confirm' : 'Sign In to Confirm'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Step 4: Final Confirmation */}
      {step === 4 && (
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-slate-900">Review &amp; Confirm Booking</h2>
            <Badge tone="primary">Ready to Book</Badge>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl border border-slate-200 p-5 text-sm">
            <div>
              <dt className="text-xs font-semibold text-slate-600">Specialist</dt>
              <dd className="font-bold text-slate-900 mt-0.5">
                {selectedDoctor
                  ? `Dr. ${selectedDoctor.userId?.firstName} ${selectedDoctor.userId?.lastName}`
                  : 'Loading...'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-600">Department</dt>
              <dd className="font-medium text-slate-900 mt-0.5">{selectedDoctor?.department || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-600">Date &amp; Time</dt>
              <dd className="font-semibold text-primary-800 mt-0.5">
                {formatCalendarDate(selectedDate)} at {selectedSlot}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-600">Estimated Fee (before tax)</dt>
              <dd className="font-bold text-slate-900 tabular-nums mt-0.5">
                {formatCurrency(selectedDoctor?.consultationFee)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-600">Visit Type &amp; Reason</dt>
              <dd className="text-slate-800 mt-0.5">
                <span className="font-semibold">{appointmentType}</span> — {reason}
              </dd>
            </div>
          </dl>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4" />
              Edit Details
            </Button>
            <Button
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={!selectedDoctor || !selectedSlot}
              onClick={handleConfirmBooking}
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Appointment
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
