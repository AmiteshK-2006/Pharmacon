import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ClipboardList, Pill, Calendar } from 'lucide-react';

export default function PatientDashboard() {
  const { profile } = useAuth();

  return (
    <div>
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Patient Dashboard</h1>
          <p className="page-subtitle">Welcome back, {profile?.first_name}. Manage your health records securely.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        <Link to="/patient/prescriptions" className="card card-body hover:border-sky-400/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sky-500/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-12 h-12 bg-sky-500/15 border border-sky-400/30 text-sky-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(56,189,248,0.25)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-sky-300 transition-colors">My Prescriptions</h2>
          <p className="text-sm text-surface-500 leading-relaxed">View your digitized prescriptions and dispensing history.</p>
        </Link>

        <Link to="/patient/refills" className="card card-body hover:border-emerald-400/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.25)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all">
            <Pill className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-emerald-300 transition-colors">Request Refills</h2>
          <p className="text-sm text-surface-500 leading-relaxed">Request a refill for your ongoing medications from the pharmacy.</p>
        </Link>

        <div className="card card-body border-dashed border-surface-200/60 bg-surface-100/40 cursor-not-allowed">
          <div className="w-12 h-12 bg-surface-200/60 text-surface-400 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-surface-500 mb-2">Medication Schedule</h2>
          <p className="text-sm text-surface-500">Coming in Phase 5: Get reminders for when to take your medicine.</p>
        </div>
      </div>
    </div>
  );
}
