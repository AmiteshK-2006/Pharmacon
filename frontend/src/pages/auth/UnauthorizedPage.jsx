import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const { role, isAuthenticated } = useAuth();

  const destination = {
    admin: '/admin',
    doctor: '/doctor',
    pharmacist: '/pharmacist',
    clinic_staff: '/clinic',
    patient: '/patient',
    researcher: '/researcher',
  }[role] || (isAuthenticated ? '/dashboard' : '/login');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#030712] via-[#060d20] to-[#040816]">
      <div className="absolute inset-0 medical-grid opacity-50 pointer-events-none" />
      <div className="card max-w-md w-full p-8 text-center relative z-10 border border-rose-500/30 bg-[#0c1427]/95 shadow-[0_0_50px_rgba(244,63,94,0.15)]">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-sm text-surface-400 mb-6 leading-relaxed">
          You do not have the required role permissions to access this clinical module. Your session is protected by role-based access control (RBAC).
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={destination}
            className="btn-primary inline-flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-5 shadow-lg shadow-sky-500/20"
          >
            <span>Go to My Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            className="btn-secondary inline-flex items-center justify-center gap-2 text-sm py-2.5 px-4"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
