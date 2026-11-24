import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { authApi } from '../../services/api';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button, Input, Select, ErrorAlert, useToast } from '../../components/ui';
import { toLocalDateInput } from '../../config/site';
import { User, Mail, Phone, Lock, Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1); // 1: details, 2: OTP verification
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'OTHER',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRules = [
    { label: 'At least 8 characters', ok: formData.password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(formData.password) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(formData.password) },
    { label: 'One number', ok: /[0-9]/.test(formData.password) }
  ];

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!passwordRules.every((r) => r.ok)) {
      setError('Password must meet all security requirements.');
      return;
    }

    setLoading(true);
    try {
      await authApi.sendRegisterOtp({
        email: formData.email.trim(),
        firstName: formData.firstName.trim()
      });
      toast.info(`Verification code sent to ${formData.email.trim()}`);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Unable to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender,
        password: formData.password,
        otp: otp.trim()
      });
      toast.success('Account created! Welcome to HealthCore Medical Center.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await authApi.sendRegisterOtp({
        email: formData.email.trim(),
        firstName: formData.firstName.trim()
      });
      toast.success('A new verification code has been sent.');
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? 'Create a patient account' : 'Verify your email address'}
      subtitle={
        step === 1
          ? 'Register to book specialist visits, view prescriptions, and manage billing.'
          : `Enter the 6-digit code sent to ${formData.email}`
      }
    >
      {error && <ErrorAlert message={error} className="mb-5" />}

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="First Name"
              icon={User}
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Jane"
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jane.doe@example.com"
            autoComplete="email"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Phone Number"
              type="tel"
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 234-5678"
            />
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="OTHER">Other / Prefer not to say</option>
            </Select>
          </div>

          <Input
            label="Date of Birth"
            type="date"
            max={toLocalDateInput()}
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Create a strong password"
              autoComplete="new-password"
              inputClassName="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-[34px] text-slate-500 hover:text-slate-800 p-1 rounded"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {formData.password && (
            <ul className="grid grid-cols-2 gap-1.5 text-xs pt-0.5">
              {passwordRules.map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 ${rule.ok ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${rule.ok ? 'text-emerald-600' : 'text-slate-300'}`} />
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Re-enter password"
            autoComplete="new-password"
            required
          />

          <Button type="submit" loading={loading} size="lg" className="w-full">
            Continue to Email Verification
          </Button>

          <p className="text-center text-sm text-slate-600 pt-1">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-700 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyAndRegister} className="space-y-5">
          <Input
            label="6-Digit Verification Code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            icon={KeyRound}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            inputClassName="font-mono tracking-widest text-center text-base"
            hint="Check your inbox (and spam folder). Code expires in 10 minutes."
            required
          />

          <Button type="submit" loading={loading} size="lg" className="w-full">
            Verify &amp; Complete Registration
          </Button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => {
                setError('');
                setOtp('');
                setStep(1);
              }}
              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Edit details
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="font-semibold text-primary-700 hover:underline"
            >
              Resend code
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
