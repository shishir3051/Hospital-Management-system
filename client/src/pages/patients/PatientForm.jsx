import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { patientsApi } from '../../services/api';
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
import { BLOOD_GROUPS, toLocalDateInput } from '../../config/site';
import { ArrowLeft, Save } from 'lucide-react';

export default function PatientForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isStaff = user?.role !== 'PATIENT';

  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    gender: 'FEMALE',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
    allergies: '',
    medicalHistory: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    weight: ''
  });

  useEffect(() => {
    if (!isEdit) return;
    setInitialLoading(true);
    patientsApi
      .getById(id)
      .then((p) => {
        setFormData({
          firstName: p.userId?.firstName || '',
          lastName: p.userId?.lastName || '',
          email: p.userId?.email || '',
          phone: p.userId?.phone || '',
          password: '',
          dateOfBirth: p.dateOfBirth ? toLocalDateInput(p.dateOfBirth) : '',
          gender: p.gender || 'OTHER',
          bloodGroup: p.bloodGroup || '',
          address: p.address || '',
          emergencyContact: p.emergencyContact || '',
          allergies: p.allergies || '',
          medicalHistory: Array.isArray(p.medicalHistory) ? p.medicalHistory.join(', ') : '',
          insuranceProvider: p.insuranceProvider || '',
          insurancePolicyNumber: p.insurancePolicyNumber || '',
          bloodPressure: p.vitals?.bloodPressure || '',
          heartRate: p.vitals?.heartRate ?? '',
          temperature: p.vitals?.temperature ?? '',
          oxygenSaturation: p.vitals?.oxygenSaturation ?? '',
          weight: p.vitals?.weight ?? ''
        });
      })
      .catch((err) => setError(err.message || 'Failed to load patient details'))
      .finally(() => setInitialLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        allergies: formData.allergies.trim(),
        insuranceProvider: formData.insuranceProvider.trim(),
        insurancePolicyNumber: formData.insurancePolicyNumber.trim()
      };

      if (!isEdit) {
        payload.email = formData.email.trim();
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
      }

      if (isStaff) {
        payload.medicalHistory = formData.medicalHistory
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const vitals = {};
        if (formData.bloodPressure.trim()) vitals.bloodPressure = formData.bloodPressure.trim();
        if (formData.heartRate !== '') vitals.heartRate = Number(formData.heartRate);
        if (formData.temperature !== '') vitals.temperature = Number(formData.temperature);
        if (formData.oxygenSaturation !== '') vitals.oxygenSaturation = Number(formData.oxygenSaturation);
        if (formData.weight !== '') vitals.weight = Number(formData.weight);
        if (Object.keys(vitals).length > 0) payload.vitals = vitals;
      }

      if (isEdit) {
        await patientsApi.update(id, payload);
        toast.success('Patient record updated successfully.');
        navigate(`/dashboard/patients/${id}`);
      } else {
        const res = await patientsApi.create(payload);
        toast.success('Patient registered successfully.');
        navigate(`/dashboard/patients/${res.patient?._id || ''}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save patient record');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) return <LoadingSpinner label="Loading patient record..." />;

  const backPath = isEdit ? `/dashboard/patients/${id}` : '/dashboard/patients';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <PageHeader
        breadcrumb={
          <Link
            to={backPath}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back
          </Link>
        }
        title={isEdit ? 'Edit Patient Profile' : 'Register New Patient'}
        subtitle={
          isEdit
            ? 'Update demographics, emergency contact, insurance, and clinical intake fields.'
            : 'Create a new electronic health record and patient portal account.'
        }
      />

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-base font-display font-bold text-slate-900">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isEdit}
              required={!isEdit}
            />
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 234-5678"
            />
            {!isEdit && (
              <Input
                label="Initial Password (Optional)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to auto-generate securely"
                hint="Patient can always reset password via email OTP."
              />
            )}
            <Input
              label="Date of Birth"
              type="date"
              max={toLocalDateInput()}
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
            />
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
            >
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="OTHER">Other</option>
            </Select>
            <Select
              label="Blood Group"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
            >
              <option value="">Not recorded</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Residential Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Street address, city, state, postal code"
          />
          <Input
            label="Emergency Contact"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
            placeholder="Name & phone number"
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-display font-bold text-slate-900">Medical &amp; Insurance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Documented Allergies"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="e.g. Penicillin, Latex, or None"
            />
            <Input
              label="Insurance Provider"
              value={formData.insuranceProvider}
              onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
              placeholder="e.g. BlueCross BlueShield"
            />
            <Input
              label="Insurance Policy Number"
              value={formData.insurancePolicyNumber}
              onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
            />
          </div>

          {isStaff && (
            <>
              <Textarea
                label="Medical History (comma-separated conditions)"
                rows={2}
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
              />
              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-800 mb-3">Latest Clinical Vitals (Optional)</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <Input
                    label="BP (mmHg)"
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                    placeholder="120/80"
                  />
                  <Input
                    label="Heart Rate"
                    type="number"
                    min="20"
                    max="260"
                    value={formData.heartRate}
                    onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                    placeholder="72"
                  />
                  <Input
                    label="Temp (°F)"
                    type="number"
                    step="0.1"
                    min="90"
                    max="115"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    placeholder="98.6"
                  />
                  <Input
                    label="SpO2 (%)"
                    type="number"
                    min="50"
                    max="100"
                    value={formData.oxygenSaturation}
                    onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                    placeholder="99"
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    step="0.1"
                    min="1"
                    max="500"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
              </div>
            </>
          )}
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(backPath)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            <Save className="w-4 h-4" />
            {isEdit ? 'Save Changes' : 'Register Patient'}
          </Button>
        </div>
      </form>
    </div>
  );
}
