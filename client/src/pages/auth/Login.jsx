// Login Page
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { authApi } from '../../services/api';
import { Eye, EyeOff, Activity, Mail, KeyRound } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // View states: 'login', 'forgot_email', 'forgot_otp'
  const [viewState, setViewState] = useState('login');
  
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      
      const from = location.state?.from || '/dashboard';
      const appointmentData = location.state?.appointmentData;
      
      navigate(from, { state: appointmentData, replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(formData.email);
      setViewState('forgot_otp');
      setSuccess('OTP sent to your email. Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Make sure the email is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(formData.email, formData.otp, formData.newPassword);
      setViewState('login');
      setSuccess('Password reset successfully. You can now log in.');
      setFormData(prev => ({ ...prev, password: '', otp: '', newPassword: '', confirmNewPassword: '' }));
    } catch (err) {
      setError(err.message || 'Failed to reset password. OTP might be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HealthCore HMS</h1>
          <p className="text-gray-500 mt-1">
            {viewState === 'login' ? 'Sign in to your account' : 'Reset your password'}
          </p>
        </div>

        {/* Form Box */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {viewState === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setViewState('forgot_email'); setError(''); setSuccess(''); }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Register
                  </Link>
                </p>
              </div>
            </form>
          )}

          {viewState === 'forgot_email' && (
            <form onSubmit={handleForgotEmailSubmit} className="space-y-5">
              <div className="text-center mb-6">
                 <Mail className="w-10 h-10 text-primary mx-auto mb-2 opacity-80" />
                 <p className="text-sm text-gray-500">Enter your email address and we'll send you an OTP to reset your password.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registered Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <button
                type="button"
                onClick={() => { setViewState('login'); setError(''); setSuccess(''); }}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors mt-3"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {viewState === 'forgot_otp' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
              <div className="text-center mb-6">
                 <KeyRound className="w-10 h-10 text-primary mx-auto mb-2 opacity-80" />
                 <p className="text-sm text-gray-500">Enter the verification code sent to <strong>{formData.email}</strong> and pick a new password.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code (OTP)</label>
                <input
                  type="text"
                  maxLength="6"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-2xl px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Create new password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmNewPassword}
                  onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => { setViewState('forgot_email'); setError(''); setSuccess(''); }}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors mt-3"
              >
                Back to Email
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}