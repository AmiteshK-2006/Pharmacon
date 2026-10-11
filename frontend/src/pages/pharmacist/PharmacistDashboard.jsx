import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Package, Pill, RefreshCcw } from 'lucide-react';

export default function PharmacistDashboard() {
  const { profile } = useAuth();

  return (
    <div>
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Pharmacist Dashboard</h1>
          <p className="page-subtitle">Welcome back, {profile?.first_name}.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
        <Link to="/pharmacist/dispensing" className="card card-body hover:border-sky-400/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sky-500/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-12 h-12 bg-sky-500/15 border border-sky-400/30 text-sky-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(56,189,248,0.25)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all">
            <Pill className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-sky-300 transition-colors">Dispensing</h2>
          <p className="text-sm text-surface-500 leading-relaxed">Dispense confirmed prescriptions. Stock is automatically updated.</p>
        </Link>

        <Link to="/pharmacist/inventory" className="card card-body hover:border-emerald-400/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.25)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all">
            <Package className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-emerald-300 transition-colors">Inventory Management</h2>
          <p className="text-sm text-surface-500 leading-relaxed">Manage medicines, restock batches, and view low-stock alerts.</p>
        </Link>

        <Link to="/pharmacist/refills" className="card card-body hover:border-amber-400/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-12 h-12 bg-amber-500/15 border border-amber-400/30 text-amber-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all">
            <RefreshCcw className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-amber-300 transition-colors">Refill Requests</h2>
          <p className="text-sm text-surface-500 leading-relaxed">Review and approve patient refill requests.</p>
        </Link>
      </div>
    </div>
  );
}
