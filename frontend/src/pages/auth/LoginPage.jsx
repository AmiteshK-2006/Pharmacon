import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Pill, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function LoginPage() {
  const { signIn, signUp, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { show, ToastContainer } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const destinations = {
    admin: '/admin',
    doctor: '/doctor',
    pharmacist: '/pharmacist',
    clinic_staff: '/clinic',
    patient: '/patient',
    researcher: '/researcher',
  };

  const rolePrefix = role === 'clinic_staff' ? '/clinic' : `/${role}`;
  const fromPath = location.state?.from?.pathname;
  const targetDashboard = (fromPath && fromPath.startsWith(rolePrefix))
    ? fromPath
    : (destinations[role] || '/dashboard');

  // Already logged in
  if (isAuthenticated && role) {
    navigate(targetDashboard, { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await signUp(email.trim(), password, firstName.trim(), lastName.trim());
        show('Registration successful! You can now log in.', 'success');
        setIsRegister(false);
        setPassword('');
      } else {
        const authResult = await signIn(email.trim(), password);
        const resolvedRole = authResult?.userRole || role;
        const resolvedPrefix = resolvedRole === 'clinic_staff' ? '/clinic' : `/${resolvedRole}`;
        const finalPath = (fromPath && fromPath.startsWith(resolvedPrefix))
          ? fromPath
          : (destinations[resolvedRole] || '/dashboard');

        navigate(finalPath, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#030712] via-[#060d20] to-[#040816]">
      <div className="absolute inset-0 medical-grid opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[550px] bg-gradient-to-tr from-sky-500/25 via-blue-600/20 to-cyan-400/20 blur-3xl rounded-full pointer-events-none" />
      <ToastContainer />

      <div className="relative z-30 w-full max-w-md">
        {/* Card */}
        <div className="card shadow-[0_0_50px_rgba(14,165,233,0.18),0_20px_40px_rgba(0,0,0,0.8)] border border-sky-500/30 backdrop-blur-2xl bg-[#0c1427]/95">
          <div className="card-header text-center py-6 bg-gradient-to-b from-sky-500/10 to-transparent border-b border-surface-200/60">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-2xl mb-3 shadow-[0_0_25px_rgba(56,189,248,0.4)] ring-4 ring-sky-500/20">
              <Pill className="w-7 h-7 text-slate-950 font-bold" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isRegister ? 'Create an Account' : 'Sign in to Pharmacon'}
            </h1>
            <p className="text-sm text-surface-500 mt-1">
              {isRegister ? 'Enter your details to get started' : 'Enter your credentials to access your dashboard'}
            </p>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error */}
              {error && (
                <div className="alert-danger">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Names - Only for Register */}
              {isRegister && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="form-label">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="John"
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="form-label">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="form-input"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="form-label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input pr-10"
                    disabled={loading}
                    minLength={isRegister ? 6 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isRegister && <p className="text-xs text-surface-500 mt-1">Must be at least 6 characters</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isRegister ? 'Signing up...' : 'Signing in...'}
                  </span>
                ) : (isRegister ? 'Sign up' : 'Sign in')}
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-surface-600">
              {isRegister ? (
                <>
                  Already have an account?{' '}
                  <button onClick={() => { setIsRegister(false); setError(''); }} className="text-brand-600 font-semibold hover:underline">
                    Sign in here
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => { setIsRegister(true); setError(''); }} className="text-brand-600 font-semibold hover:underline">
                    Sign up here
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-surface-400 mt-4">
          <Link to="/" className="hover:text-surface-600">← Back to project website</Link>
        </p>
      </div>
    </div>
  );
}
