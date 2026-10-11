import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { UploadCloud, CheckSquare, Search } from 'lucide-react';

export default function ClinicDashboard() {
  const { profile } = useAuth();

  return (
    <div>
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Clinic Dashboard</h1>
          <p className="page-subtitle">Welcome back, {profile?.first_name}.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl">
        <Link to="/clinic/upload" className="card card-body hover:border-sky-400/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sky-500/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-12 h-12 bg-sky-500/15 border border-sky-400/30 text-sky-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(56,189,248,0.25)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-sky-300 transition-colors">Upload Prescription</h2>
          <p className="text-sm text-surface-500 leading-relaxed">Digitize a new handwritten prescription and send it for AI extraction and review.</p>
        </Link>

        <Link to="/clinic/review" className="card card-body hover:border-amber-400/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-12 h-12 bg-amber-500/15 border border-amber-400/30 text-amber-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-amber-300 transition-colors">Review Queue</h2>
          <p className="text-sm text-surface-500 leading-relaxed">Review and correct prescriptions that failed automated extraction.</p>
        </Link>
      </div>

      <div className="card max-w-4xl mt-8">
        <div className="card-header">
          <h2 className="font-semibold text-surface-900">Patient Search</h2>
        </div>
        <div className="card-body">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input type="text" className="form-input pl-10" placeholder="Search patients by name or ID (Coming Soon)" disabled />
            </div>
            <button className="btn-secondary" disabled>Search</button>
          </div>
        </div>
      </div>
    </div>
  );
}
