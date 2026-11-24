import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { authApi } from '../../services/api';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Avatar,
  RoleBadge,
  ErrorAlert,
  useToast
} from '../../components/ui';
import { BLOOD_GROUPS } from '../../config/site';
import { Save, Lock, User, Stethoscope } from 'lucide-react';

export default function Settings() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatar: '',
    address: '',
    emergencyContact: '',
    bloodGroup: '',
    allergies: '',
    insuranceProvider: '',
    insurancePolicyNumber: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      address: user.profile?.address || '',
      emergencyContact: user.profile?.emergencyContact || '',
      bloodGroup: user.profile?.bloodGroup || '',
      allergies: user.profile?.allergies || '',
      insuranceProvider: user.profile?.insuranceProvider || '',
      insurancePolicyNumber: user.profile?.insurancePolicyNumber || ''
    });
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setSavingProfile(true);
    try {
      const payload = {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.trim(),
        avatar: profileForm.avatar.trim() || null
      };

      if (user?.role === 'PATIENT') {
        payload.address = profileForm.address.trim();
        payload.emergencyContact = profileForm.emergencyContact.trim();
        payload.bloodGroup = profileForm.bloodGroup;
        payload.allergies = profileForm.allergies.trim();
        payload.insuranceProvider = profileForm.insuranceProvider.trim();
        payload.insurancePolicyNumber = profileForm.insurancePolicyNumber.trim();
      }

      const res = await authApi.updateProfile(payload);
      setUser(res.user);
      toast.success('Account profile updated.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setSavingPw(true);
    try {
      await authApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password updated successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.message || 'Failed to update password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <PageHeader
        title="Profile & Security Settings"
        subtitle="Manage your personal information, emergency details, and account password."
        actions={
          user?.role === 'DOCTOR' && user?.profile?._id && (
            <Link to={`/dashboard/doctors/${user.profile._id}`}>
              <Button variant="outline" size="sm">
                <Stethoscope className="w-4 h-4" />
                Manage Physician Schedule
              </Button>
            </Link>
          )
        }
      />

      {/* Account Overview Banner */}
      <Card className="p-5 flex items-center gap-4">
        <Avatar
          src={user?.avatar}
          firstName={user?.firstName}
          lastName={user?.lastName}
          size="lg"
        />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-display font-bold text-slate-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <RoleBadge role={user?.role} />
          </div>
          <p className="text-sm text-slate-600">{user?.email}</p>
        </div>
      </Card>

      {/* Profile Form */}
      <Card>
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-700" aria-hidden="true" />
            Personal &amp; Contact Details
          </h2>

          {profileError && <ErrorAlert message={profileError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={profileForm.firstName}
              onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={profileForm.lastName}
              onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="+1 (555) 234-5678"
            />
            <Input
              label="Profile Photo URL (Optional)"
              type="url"
              value={profileForm.avatar}
              onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {user?.role === 'PATIENT' && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-display font-bold text-slate-900">
                Patient Emergency &amp; Insurance Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Blood Group"
                  value={profileForm.bloodGroup}
                  onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                >
                  <option value="">Not specified</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Documented Allergies"
                  value={profileForm.allergies}
                  onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Peanuts, or None"
                />
                <Input
                  label="Emergency Contact"
                  value={profileForm.emergencyContact}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                  placeholder="Name & phone number"
                />
                <Input
                  label="Residential Address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
                <Input
                  label="Insurance Provider"
                  value={profileForm.insuranceProvider}
                  onChange={(e) => setProfileForm({ ...profileForm, insuranceProvider: e.target.value })}
                />
                <Input
                  label="Policy Number"
                  value={profileForm.insurancePolicyNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, insurancePolicyNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={savingProfile}>
              <Save className="w-4 h-4" />
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary-700" aria-hidden="true" />
            Change Password
          </h2>

          {pwError && <ErrorAlert message={pwError} />}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Current Password"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              hint="8+ chars, upper, lower, number"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" loading={savingPw}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
