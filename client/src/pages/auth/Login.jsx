import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { authApi } from '../../services/api';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button, Input, ErrorAlert, useToast } from '../../components/ui';
import { Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [view, setView] = useState('login'); // 'login' | 'forgot_email' | 'forgot_otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back to HealthCore Medical Center');
      const from = location.state?.from;
      const appointmentData = location.state?.appointmentData;
      if (from === '/appointment' && appointmentData) {
        navigate('/appointment', { state: { appointmentData }, replace: true });
      } else if (from && typeof from === 'string' && from.startsWith('/')) {
        navigate(from, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setInfoMsg(res.message || 'Verification code sent.');
      setView('forgot_otp');
    } catch (err) {
      setError(err.message || 'Unable to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resetPassword(email.trim(), otp.trim(), newPassword);
      toast.success(res.message || 'Password updated. Please sign in.');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setInfoMsg('Password reset complete. Sign in with your new password.');
      setView('login');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: {
      title: 'Sign in to your portal',
      subtitle: 'Access appointments, medical records, prescriptions, and billing.'
    },
    forgot_email: {
      title: 'Reset your password',
      subtitle: 'Enter your registered email address to receive a 6-digit verification code.'
    },
    forgot_otp: {
      title: 'Verify code & set new password',
      subtitle: `Enter the 6-digit code sent to ${email} and choose a strong password.`
    }
  };

  return (
    <AuthLayout title={titles[view].title} subtitle={titles[view].subtitle}>
      {error && <ErrorAlert message={error} className="mb-5" />}

      {infoMsg && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-2.5 text-sm text-emerald-800"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
          <span>{infoMsg}</span>
        </div>
      )}

      {view === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
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
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setInfoMsg('');
                  setView('forgot_email');
                }}
                className="text-xs font-semibold text-primary-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading} size="lg" className="w-full">
            Sign In
          </Button>

          <p className="text-center text-sm text-slate-600 pt-2">
            New patient?{' '}
            <Link to="/register" className="font-semibold text-primary-700 hover:underline">
              Create a patient account
            </Link>
          </p>
        </form>
      )}

      {view === 'forgot_email' && (
        <form onSubmit={handleRequestResetOtp} className="space-y-4">
          <Input
            label="Registered Email Address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Button type="submit" loading={loading} size="lg" className="w-full">
            Send Verification Code
          </Button>
          <button
            type="button"
            onClick={() => {
              setError('');
              setView('login');
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 pt-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
        </form>
      )}

      {view === 'forgot_otp' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="6-Digit Verification Code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            icon={KeyRound}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            inputClassName="font-mono tracking-widest"
            required
          />

          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 chars (A-z, 0-9)"
              hint="Must include at least 8 characters, one uppercase, one lowercase, and one number."
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

          <Button type="submit" loading={loading} size="lg" className="w-full">
            Update Password
          </Button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => {
                setError('');
                setView('forgot_email');
              }}
              className="font-medium text-slate-600 hover:text-slate-900"
            >
              Change email
            </button>
            <button
              type="button"
              onClick={handleRequestResetOtp}
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
