import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Link } from 'react-router-dom';
import { FileText, ShieldCheck, Database, ArrowRight, Lock, EyeOff, Sparkles } from 'lucide-react';

export default function ResearcherDashboard() {
  const { profile, session } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['researcher-prescriptions'],
    queryFn: () => apiRequest('/api/prescriptions', {}, session),
  });

  const prescriptions = data?.data || [];
  const totalCount = prescriptions.length;

  return (
    <div className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            Anonymized Research Portal
          </div>
          <h1 className="page-title text-3xl font-extrabold text-white tracking-tight">
            Research &amp; Analytics Dashboard
          </h1>
          <p className="page-subtitle text-surface-400 text-sm mt-1">
            Welcome back, {profile?.first_name || 'Researcher'}. Access compliant, de-identified clinical prescription datasets for research analysis.
          </p>
        </div>
      </div>

      {/* ─── Metric Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card card-body relative overflow-hidden bg-[#0c1427]/90 border border-sky-500/20 shadow-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/15 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-400 flex items-center justify-center mb-3">
            <Database className="w-5 h-5" />
          </div>
          <p className="text-xs uppercase font-semibold tracking-wider text-surface-400">Available Prescriptions</p>
          <p className="text-3xl font-extrabold text-white mt-1">
            {isLoading ? '...' : totalCount}
          </p>
          <p className="text-xs text-sky-400 mt-2 font-medium">100% De-identified &amp; Verified</p>
        </div>

        <div className="card card-body relative overflow-hidden bg-[#0c1427]/90 border border-purple-500/20 shadow-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/15 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-400 flex items-center justify-center mb-3">
            <EyeOff className="w-5 h-5" />
          </div>
          <p className="text-xs uppercase font-semibold tracking-wider text-surface-400">Privacy Safeguard</p>
          <p className="text-3xl font-extrabold text-purple-300 mt-1">Zero PII</p>
          <p className="text-xs text-purple-400 mt-2 font-medium">Names, IDs &amp; Phones Masked</p>
        </div>

        <div className="card card-body relative overflow-hidden bg-[#0c1427]/90 border border-emerald-500/20 shadow-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/15 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-xs uppercase font-semibold tracking-wider text-surface-400">Regulatory Framework</p>
          <p className="text-xl font-bold text-emerald-300 mt-2">HIPAA &amp; DPDP</p>
          <p className="text-xs text-emerald-400 mt-2 font-medium">Safe Harbor De-identification</p>
        </div>
      </div>

      {/* ─── Main Portal Action Card ─────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/researcher/prescriptions"
          className="card card-body hover:border-sky-400/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer block relative overflow-hidden bg-[#0c1427]/90"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sky-500/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-12 h-12 bg-sky-500/15 border border-sky-400/30 text-sky-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(56,189,248,0.25)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-sky-300 transition-colors flex items-center gap-2">
            View Prescriptions <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </h2>
          <p className="text-sm text-surface-400 leading-relaxed">
            Browse and inspect all clinic-uploaded medical prescriptions in their sanitized, anonymized format. Patient and doctor PII have been completely redacted while clinical pharmacology remains intact.
          </p>
        </Link>

        <div className="card card-body bg-[#070d1e]/90 border border-surface-200/60 relative overflow-hidden">
          <div className="w-12 h-12 bg-purple-500/15 border border-purple-400/30 text-purple-400 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight">
            Security &amp; Ethical Boundaries
          </h2>
          <p className="text-sm text-surface-400 leading-relaxed">
            As a designated researcher, your access token is strictly scoped to de-identified documents. Requests for original scans or patient profile records are automatically rejected at the database and gateway levels.
          </p>
        </div>
      </div>
    </div>
  );
}
