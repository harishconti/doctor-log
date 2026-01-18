import React, { useState, useMemo } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, RefreshCw, AlertCircle, Check, CheckCircle } from 'lucide-react';
import { authApi } from '../lib/auth';
import type { AxiosError } from 'axios';

interface ResetPasswordScreenProps {
  onBackToLogin: () => void;
  onSubmit: () => void;
  token?: string; // Reset token from URL
}

interface ApiErrorResponse {
  detail?: string | { msg: string }[];
}

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'digit', label: 'One number', test: (p: string) => /\d/.test(p) },
  { id: 'special', label: 'One special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onBackToLogin, onSubmit, token }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_REQUIREMENTS.filter(req => req.test(password));
    return {
      passed,
      score: passed.length,
      isValid: passed.length === PASSWORD_REQUIREMENTS.length
    };
  }, [password]);

  const strengthColor = useMemo(() => {
    if (passwordStrength.score === 0) return 'bg-gray-200';
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [passwordStrength.score]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (!passwordStrength.isValid) {
      setError('Please create a password that meets all requirements');
      return;
    }

    // Check for token (in production, this would come from URL params)
    const resetToken = token || new URLSearchParams(window.location.search).get('token');
    if (!resetToken) {
      setError('Invalid or missing reset link. Please request a new password reset.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(resetToken, password);
      setIsSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        onSubmit();
      }, 2000);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        if (status === 400 || status === 404) {
          setError('This reset link is invalid or has expired. Please request a new password reset.');
        } else if (status === 429) {
          setError('Too many attempts. Please wait before trying again.');
        } else if (data?.detail) {
          if (typeof data.detail === 'string') {
            setError(data.detail);
          } else if (Array.isArray(data.detail)) {
            setError(data.detail.map(d => d.msg).join(', '));
          }
        } else {
          setError('Failed to reset password. Please try again.');
        }
      } else {
        setError('Unable to connect to server. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* Left Side - Hero Image & Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-brand-900 overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=2665&auto=format&fit=crop" 
            alt="Medical Team" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-900 via-brand-800 to-transparent opacity-90"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand-700 font-bold text-2xl">H</div>
            <span className="text-2xl font-semibold tracking-tight">HealLog</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Focus on patients, not paperwork.
          </h1>
          <p className="text-brand-100 text-lg mb-8 leading-relaxed">
            The intelligent dashboard for modern medical teams. 
            Secure, fast, and designed for clarity.
          </p>

          <div className="flex items-center gap-4 text-sm font-medium text-brand-50 bg-white/10 p-4 rounded-xl backdrop-blur-sm w-fit">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <img 
                  key={i}
                  src={`https://picsum.photos/seed/${i + 10}/100/100`} 
                  alt="User" 
                  className="w-8 h-8 rounded-full border-2 border-brand-900"
                />
              ))}
            </div>
            <div className="flex flex-col">
               <span>Trusted by 10,000+ clinicians</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              H
            </div>
            <span className="text-xl font-semibold text-brand-900">HealLog</span>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 sm:p-10 border border-gray-100">
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-600 border border-blue-100">
              <RefreshCw size={28} />
            </div>
          </div>

          {isSuccess ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 animate-bounce border border-green-100">
                  <CheckCircle size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h2>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                Your password has been reset successfully.<br />
                Redirecting you to login...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create new password</h2>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Your new password must be different from previous used passwords.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {password && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${i <= passwordStrength.score ? strengthColor : 'bg-gray-200'
                              }`}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {PASSWORD_REQUIREMENTS.map((req) => (
                          <div key={req.id} className="flex items-center gap-1.5 text-xs">
                            <Check
                              size={12}
                              className={`flex-shrink-0 ${req.test(password) ? 'text-green-500' : 'text-gray-300'
                                }`}
                            />
                            <span className={req.test(password) ? 'text-gray-600' : 'text-gray-400'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`block w-full px-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm ${
                        confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !passwordStrength.isValid || password !== confirmPassword}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {!isSuccess && (
            <div className="mt-8 text-center">
              <button
                onClick={onBackToLogin}
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to login
              </button>
            </div>
          )}

          <div className="mt-10 text-center text-xs text-gray-400 flex justify-center gap-4">
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-600">Terms</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-600">Help Center</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;