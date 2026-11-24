import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientsApi, appointmentsApi, prescriptionsApi, billingApi, labsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  Avatar,
  Badge,
  StatusBadge,
  Input,
  Modal,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  PrintablePrescriptionModal,
  useToast
} from '../../components/ui';
import {
  calculateAge,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatShortId
} from '../../config/site';
import {
  ArrowLeft,
  Printer,
  Plus,
  Activity,
  AlertTriangle,
  Calendar,
  Pill,
  CreditCard,
  FileText,
  HeartPulse,
  ShieldCheck,
  FlaskConical
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function PatientRecords() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedRx, setSelectedRx] = useState(null);

  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    weight: ''
  });

  const canPrescribe = ['ADMIN', 'DOCTOR'].includes(user?.role);
  const canRecordVitals = ['ADMIN', 'DOCTOR', 'NURSE'].includes(user?.role);
  const canViewBilling = ['ADMIN', 'ACCOUNTANT', 'PATIENT'].includes(user?.role);

  const loadEHR = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [patRes, aptRes, rxRes, labRes, billRes] = await Promise.allSettled([
        patientsApi.getById(id),
        appointmentsApi.getAll({ patientId: id, limit: 50 }),
        prescriptionsApi.getAll({ patientId: id, limit: 50 }),
        labsApi.getAll({ patientId: id, limit: 50 }),
        canViewBilling ? billingApi.getByPatient(id) : Promise.resolve({ bills: [] })
      ]);

      if (patRes.status !== 'fulfilled') {
        throw patRes.reason || new Error('Failed to load patient EHR');
      }

      const p = patRes.value;
      setPatient(p);
      setVitalsForm({
        bloodPressure: p.vitals?.bloodPressure || '',
        heartRate: p.vitals?.heartRate ?? '',
        temperature: p.vitals?.temperature ?? '',
        oxygenSaturation: p.vitals?.oxygenSaturation ?? '',
        weight: p.vitals?.weight ?? ''
      });
      setAppointments(aptRes.status === 'fulfilled' ? aptRes.value.appointments || [] : []);
      setPrescriptions(rxRes.status === 'fulfilled' ? rxRes.value.prescriptions || [] : []);
      setLabOrders(labRes.status === 'fulfilled' ? labRes.value.orders || [] : []);
      setBills(billRes.status === 'fulfilled' ? billRes.value.bills || [] : []);
    } catch (err) {
      setError(err.message || 'Unable to load electronic health record');
    } finally {
      setLoading(false);
    }
  }, [id, canViewBilling]);

  useEffect(() => {
    loadEHR();
  }, [loadEHR]);

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    setSavingVitals(true);
    try {
      const vitals = {};
      if (vitalsForm.bloodPressure.trim()) vitals.bloodPressure = vitalsForm.bloodPressure.trim();
      if (vitalsForm.heartRate !== '') vitals.heartRate = Number(vitalsForm.heartRate);
      if (vitalsForm.temperature !== '') vitals.temperature = Number(vitalsForm.temperature);
      if (vitalsForm.oxygenSaturation !== '') vitals.oxygenSaturation = Number(vitalsForm.oxygenSaturation);
      if (vitalsForm.weight !== '') vitals.weight = Number(vitalsForm.weight);

      const res = await patientsApi.update(id, { vitals });
      setPatient((prev) => ({
        ...prev,
        vitals: res.patient?.vitals,
        vitalsHistory: res.patient?.vitalsHistory || prev.vitalsHistory
      }));
      toast.success('Clinical vitals logged to EHR history.');
      setVitalsModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update vitals');
    } finally {
      setSavingVitals(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading electronic health record..." />;

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error || 'Patient record not found'} onRetry={loadEHR} />
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const age = calculateAge(patient.dateOfBirth);
  const hasAllergy = patient.allergies && patient.allergies.toLowerCase() !== 'none';
  const vitals = patient.vitals;
  const vitalsHistory = Array.isArray(patient.vitalsHistory) ? patient.vitalsHistory : [];

  const vitalsTrendData = {
    labels: vitalsHistory.map((v) => formatDate(v.updatedAt, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Heart Rate (bpm)',
        data: vitalsHistory.map((v) => v.heartRate ?? null),
        borderColor: '#0F766E',
        backgroundColor: 'rgba(15, 118, 110, 0.15)',
        tension: 0.3,
        spanGaps: true
      },
      {
        label: 'Systolic BP (mmHg)',
        data: vitalsHistory.map((v) => v.systolic ?? null),
        borderColor: '#1E3A8A',
        backgroundColor: 'rgba(30, 58, 138, 0.12)',
        tension: 0.3,
        spanGaps: true
      },
      {
        label: 'Diastolic BP (mmHg)',
        data: vitalsHistory.map((v) => v.diastolic ?? null),
        borderColor: '#0284C7',
        backgroundColor: 'rgba(2, 132, 199, 0.12)',
        tension: 0.3,
        spanGaps: true
      }
    ]
  };

  const tabs = [
    { id: 'summary', label: 'Clinical Summary & Vitals', icon: Activity },
    { id: 'visits', label: `Visits (${appointments.length})`, icon: Calendar },
    { id: 'medications', label: `Prescriptions (${prescriptions.length})`, icon: Pill },
    { id: 'labs', label: `Lab Reports (${labOrders.length})`, icon: FlaskConical },
    ...(canViewBilling ? [{ id: 'billing', label: `Billing (${bills.length})`, icon: CreditCard }] : [])
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        breadcrumb={
          user?.role !== 'PATIENT' && (
            <Link
              to={`/dashboard/patients/${patient._id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary-700 no-print"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back to Patient Profile
            </Link>
          )
        }
        title={`Electronic Health Record — ${patient.userId?.firstName} ${patient.userId?.lastName}`}
        subtitle={`PID ${formatShortId(patient._id, '')} · ${patient.gender} ${age !== null ? `· ${age} yrs` : ''} · Blood Group: ${patient.bloodGroup || 'Unrecorded'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4" aria-hidden="true" />
              Print EHR
            </Button>
            {canRecordVitals && (
              <Button variant="outline" size="sm" onClick={() => setVitalsModalOpen(true)}>
                <HeartPulse className="w-4 h-4" aria-hidden="true" />
                Record Vitals
              </Button>
            )}
            {canPrescribe && (
              <Link to={`/dashboard/prescriptions/new?patientId=${patient._id}`}>
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Write Prescription
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Clinical Header Banner */}
      <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <p className="text-xs text-slate-600">
              DOB: {formatDate(patient.dateOfBirth)} · Phone: {patient.userId?.phone || 'Not provided'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={patient.bloodGroup ? 'primary' : 'neutral'}>
                Blood: {patient.bloodGroup || 'Unrecorded'}
              </Badge>
              {hasAllergy ? (
                <Badge tone="danger">
                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  Allergy: {patient.allergies}
                </Badge>
              ) : (
                <Badge tone="success">
                  <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                  No Known Allergies
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-600 md:text-right">
          <p className="font-semibold text-slate-800">Emergency Contact</p>
          <p>{patient.emergencyContact || 'Not recorded'}</p>
          <p className="mt-1">Insurance: {patient.insuranceProvider || 'Self-pay'}</p>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 no-print" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Clinical Summary & Vitals Trends */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-display font-bold text-slate-900">Latest Clinical Vitals</h3>
                {vitals?.updatedAt && (
                  <span className="text-xs text-slate-600">Updated {formatDate(vitals.updatedAt)}</span>
                )}
              </div>
              {vitals && (vitals.bloodPressure || vitals.heartRate || vitals.temperature || vitals.oxygenSaturation || vitals.weight) ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-xs text-slate-600">Blood Pressure</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5 tabular-nums">
                      {vitals.bloodPressure || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-xs text-slate-600">Heart Rate</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5 tabular-nums">
                      {vitals.heartRate ? `${vitals.heartRate} bpm` : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-xs text-slate-600">Temperature</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5 tabular-nums">
                      {vitals.temperature ? `${vitals.temperature} °F` : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-xs text-slate-600">Oxygen (SpO2)</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5 tabular-nums">
                      {vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-xs text-slate-600">Weight</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5 tabular-nums">
                      {vitals.weight ? `${vitals.weight} kg` : '—'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No vitals have been recorded yet.</p>
              )}
            </Card>

            <Card className="lg:col-span-6 space-y-4">
              <h3 className="text-base font-display font-bold text-slate-900">Medical History &amp; Latest Rx</h3>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Documented Conditions
                </p>
                {Array.isArray(patient.medicalHistory) && patient.medicalHistory.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {patient.medicalHistory.map((item) => (
                      <Badge key={item} tone="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No chronic conditions documented.</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Latest Prescription
                </p>
                {prescriptions[0] ? (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{prescriptions[0].diagnosis}</p>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRx(prescriptions[0])}>
                        View Rx
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600">
                      {(prescriptions[0].medications || []).map((m) => `${m.name} (${m.dosage})`).join(', ') ||
                        'No medications listed'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No prescriptions issued yet.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Vitals Longitudinal Trend Chart & Log */}
          {vitalsHistory.length > 0 && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-display font-bold text-slate-900">
                    Vitals History &amp; Longitudinal Trend
                  </h3>
                  <p className="text-xs text-slate-600">
                    {vitalsHistory.length} clinical reading{vitalsHistory.length === 1 ? '' : 's'} logged
                  </p>
                </div>
              </div>

              {vitalsHistory.length >= 2 && (
                <div className="h-64">
                  <Line
                    data={vitalsTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' } },
                      scales: {
                        y: { grid: { color: '#F1F5F9' } },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold text-slate-600">Date</th>
                      <th className="px-4 py-2.5 font-semibold text-slate-600">BP</th>
                      <th className="px-4 py-2.5 font-semibold text-slate-600">HR</th>
                      <th className="px-4 py-2.5 font-semibold text-slate-600">Temp</th>
                      <th className="px-4 py-2.5 font-semibold text-slate-600">SpO2</th>
                      <th className="px-4 py-2.5 font-semibold text-slate-600">Weight</th>
                      <th className="px-4 py-2.5 font-semibold text-slate-600">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[...vitalsHistory].reverse().slice(0, 10).map((entry, idx) => (
                      <tr key={`${entry.updatedAt}-${idx}`}>
                        <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                          {formatDateTime(entry.updatedAt)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-900">{entry.bloodPressure || '—'}</td>
                        <td className="px-4 py-2.5 tabular-nums">{entry.heartRate ? `${entry.heartRate} bpm` : '—'}</td>
                        <td className="px-4 py-2.5 tabular-nums">{entry.temperature ? `${entry.temperature} °F` : '—'}</td>
                        <td className="px-4 py-2.5 tabular-nums">{entry.oxygenSaturation ? `${entry.oxygenSaturation}%` : '—'}</td>
                        <td className="px-4 py-2.5 tabular-nums">{entry.weight ? `${entry.weight} kg` : '—'}</td>
                        <td className="px-4 py-2.5 text-slate-600">{entry.recordedBy || 'Staff'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Visits */}
      {activeTab === 'visits' && (
        <Card padding="p-0">
          {appointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No visit history"
              description="Clinical visits and SOAP encounter summaries will appear here once scheduled."
            />
          ) : (
            <div className="divide-y divide-slate-200">
              {appointments.map((apt) => (
                <div key={apt._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}{' '}
                      <span className="text-slate-500 font-normal">({apt.doctorId?.department || apt.type})</span>
                    </p>
                    <p className="text-xs text-slate-600">{formatDateTime(apt.dateTime)}</p>
                    <p className="text-sm text-slate-700">{apt.reason}</p>
                    {apt.soapNotes?.assessment && (
                      <p className="text-xs text-primary-900 bg-primary-50/70 rounded px-2.5 py-1.5 border border-primary-100">
                        <strong>Assessment{apt.soapNotes.icdCode ? ` (${apt.soapNotes.icdCode})` : ''}:</strong>{' '}
                        {apt.soapNotes.assessment}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={apt.status} />
                    <Link to={`/dashboard/appointments/${apt._id}`} className="no-print">
                      <Button variant="outline" size="sm">Details</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Prescriptions */}
      {activeTab === 'medications' && (
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <Card>
              <EmptyState
                icon={Pill}
                title="No prescriptions on file"
                description="Issued digital prescriptions and dosage schedules will appear here."
                action={
                  canPrescribe && (
                    <Link to={`/dashboard/prescriptions/new?patientId=${patient._id}`}>
                      <Button variant="primary" size="sm">
                        <Plus className="w-4 h-4" />
                        Write Prescription
                      </Button>
                    </Link>
                  )
                }
              />
            </Card>
          ) : (
            prescriptions.map((rx) => (
              <Card key={rx._id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary-800">
                        {formatShortId(rx._id, 'RX-')}
                      </span>
                      <StatusBadge status={rx.status || 'ACTIVE'} />
                      {rx.dispenseStatus && <StatusBadge status={rx.dispenseStatus} />}
                    </div>
                    <h3 className="text-base font-display font-bold text-slate-900 mt-1">{rx.diagnosis}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Prescribed by Dr. {rx.doctorId?.userId?.firstName} {rx.doctorId?.userId?.lastName} on{' '}
                      {formatDate(rx.issuedDate || rx.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 no-print">
                    <Button variant="outline" size="sm" onClick={() => setSelectedRx(rx)}>
                      <FileText className="w-4 h-4" />
                      View / Print Rx
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(rx.medications || []).map((med, idx) => (
                    <div
                      key={`${rx._id}-${med.name}-${idx}`}
                      className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-sm"
                    >
                      <p className="font-semibold text-slate-900">
                        {med.name} <span className="font-mono text-xs text-primary-800">{med.dosage}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {med.frequency} · {med.duration}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Lab Reports */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          {labOrders.length === 0 ? (
            <Card>
              <EmptyState
                icon={FlaskConical}
                title="No lab reports on file"
                description="Diagnostic panels and verified laboratory reports for this patient will appear here."
                action={
                  canPrescribe && (
                    <Link to="/dashboard/labs">
                      <Button variant="primary" size="sm">
                        <Plus className="w-4 h-4" />
                        Open Laboratory Module
                      </Button>
                    </Link>
                  )
                }
              />
            </Card>
          ) : (
            labOrders.map((order) => (
              <Card key={order._id} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary-800">
                        {formatShortId(order._id, 'LAB-')}
                      </span>
                      <StatusBadge status={order.status} />
                      <Badge tone="secondary">{order.category}</Badge>
                    </div>
                    <h3 className="text-base font-display font-bold text-slate-900 mt-1">{order.testName}</h3>
                    <p className="text-xs text-slate-600">Ordered {formatDateTime(order.createdAt)}</p>
                  </div>
                  <Link to="/dashboard/labs" className="no-print">
                    <Button variant="outline" size="sm">Open in Lab</Button>
                  </Link>
                </div>
                {(order.results || []).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {order.results.map((r, i) => (
                      <div key={`${order._id}-${r.parameter}-${i}`} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">{r.parameter}</span>
                          <Badge tone={r.flag === 'NORMAL' ? 'success' : r.flag === 'CRITICAL' ? 'danger' : 'warning'}>
                            {r.flag}
                          </Badge>
                        </div>
                        <p className="font-mono text-sm font-bold text-slate-900 mt-1">
                          {r.value} {r.unit}
                        </p>
                        {r.referenceRange && <p className="text-slate-600 mt-0.5">Ref: {r.referenceRange}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 5: Billing */}
      {activeTab === 'billing' && canViewBilling && (
        <Card padding="p-0">
          {bills.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No billing records"
              description="Invoices generated for consultations, lab diagnostics, and pharmacy orders appear here."
            />
          ) : (
            <div className="divide-y divide-slate-200">
              {bills.map((bill) => (
                <div key={bill._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono font-semibold text-slate-700">
                      {formatShortId(bill._id, 'INV-')}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {bill.items?.[0]?.description || 'Clinical Services'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">Issued {formatDate(bill.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-display font-bold text-slate-900 tabular-nums">
                      {formatCurrency(bill.total)}
                    </span>
                    <StatusBadge status={bill.status} />
                    <Link to={`/dashboard/billing/${bill._id}`} className="no-print">
                      <Button variant="outline" size="sm">View Invoice</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <PrintablePrescriptionModal
        prescription={selectedRx}
        open={Boolean(selectedRx)}
        onClose={() => setSelectedRx(null)}
      />

      <Modal
        open={vitalsModalOpen}
        onClose={() => setVitalsModalOpen(false)}
        title="Record Clinical Vitals"
        subtitle={`Logged to longitudinal vitals history for ${patient.userId?.firstName} ${patient.userId?.lastName}`}
      >
        <form onSubmit={handleSaveVitals} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Blood Pressure (mmHg)"
              value={vitalsForm.bloodPressure}
              onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })}
              placeholder="120/80"
            />
            <Input
              label="Heart Rate (bpm)"
              type="number"
              min="20"
              max="260"
              value={vitalsForm.heartRate}
              onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
              placeholder="72"
            />
            <Input
              label="Temperature (°F)"
              type="number"
              step="0.1"
              min="90"
              max="115"
              value={vitalsForm.temperature}
              onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
              placeholder="98.6"
            />
            <Input
              label="Oxygen Saturation SpO2 (%)"
              type="number"
              min="50"
              max="100"
              value={vitalsForm.oxygenSaturation}
              onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenSaturation: e.target.value })}
              placeholder="99"
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              min="1"
              max="500"
              value={vitalsForm.weight}
              onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
              placeholder="70.0"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setVitalsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingVitals}>
              Log Vitals Reading
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
