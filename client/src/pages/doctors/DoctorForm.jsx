import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doctorsApi } from '../../services/api';
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
import { DEPARTMENTS } from '../../config/site';
import { ArrowLeft, Save } from 'lucide-react';

export default function DoctorForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    department: DEPARTMENTS[0],
    specialization: '',
    licenseNumber: '',
    education: '',
    yearsOfExperience: 5,
    consultationFee: 175,
    status: 'AVAILABLE',
    bio: ''
  });

  useEffect(() => {
    if (!isEdit) return;
    setInitialLoading(true);
    doctorsApi
      .getById(id)
      .then((d) => {
        setFormData({
          firstName: d.userId?.firstName || '',
          lastName: d.userId?.lastName || '',
          email: d.userId?.email || '',
          phone: d.userId?.phone || '',
          password: '',
          department: d.department || DEPARTMENTS[0],
          specialization: d.specialization || '',
          licenseNumber: d.licenseNumber || '',
          education: d.education || '',
          yearsOfExperience: d.yearsOfExperience ?? 0,
          consultationFee: d.consultationFee ?? 0,
          status: d.status || 'AVAILABLE',
          bio: d.bio || ''
        });
      })
      .catch((err) => setError(err.message || 'Unable to load doctor profile'))
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
        department: formData.department,
        specialization: formData.specialization.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        education: formData.education.trim(),
        yearsOfExperience: Number(formData.yearsOfExperience),
        consultationFee: Number(formData.consultationFee),
        status: formData.status,
        bio: formData.bio.trim()
      };

      if (!isEdit) {
        payload.email = formData.email.trim();
        if (formData.password.trim()) payload.password = formData.password.trim();
      }

      if (isEdit) {
        await doctorsApi.update(id, payload);
        toast.success('Physician profile updated.');
        navigate(`/dashboard/doctors/${id}`);
      } else {
        const res = await doctorsApi.create(payload);
        toast.success('Physician onboarded successfully.');
        navigate(`/dashboard/doctors/${res.doctor?._id || ''}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save physician profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) return <LoadingSpinner label="Loading physician profile..." />;

  const backPath = isEdit ? `/dashboard/doctors/${id}` : '/dashboard/doctors';

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
        title={isEdit ? 'Edit Physician Profile' : 'Onboard New Physician'}
        subtitle="Maintain accurate department assignment, board credentials, and USD consultation fees."
      />

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-base font-display font-bold text-slate-900">Account &amp; Contact</h2>
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
              placeholder="+1 (555) 201-0200"
            />
            {!isEdit && (
              <Input
                label="Initial Password (Optional)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to auto-generate"
                className="sm:col-span-2"
              />
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-display font-bold text-slate-900">Clinical Credentials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Clinical Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
            <Input
              label="Specialization"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g. Interventional Cardiology"
              required
            />
            <Input
              label="Medical License Number"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder="e.g. MC-CARD-2040"
              required
            />
            <Select
              label="Availability Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">Busy</option>
              <option value="ON_LEAVE">On Leave</option>
            </Select>
            <Input
              label="Years of Experience"
              type="number"
              min="0"
              max="80"
              value={formData.yearsOfExperience}
              onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
              required
            />
            <Input
              label="Consultation Fee (USD $)"
              type="number"
              min="0"
              step="0.01"
              value={formData.consultationFee}
              onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
              required
            />
            <Input
              label="Education & Board Certifications"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              placeholder="e.g. MD, Johns Hopkins University; FACC"
              className="sm:col-span-2"
              required
            />
          </div>
          <Textarea
            label="Clinical Biography"
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Summarize clinical focus areas, fellowships, and patient care philosophy..."
          />
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(backPath)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            <Save className="w-4 h-4" />
            {isEdit ? 'Save Profile' : 'Onboard Physician'}
          </Button>
        </div>
      </form>
    </div>
  );
}
