import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Link } from 'react-router-dom';
import { ClipboardList, Brain, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export default function DoctorDashboard() {
  const { profile, session } = useAuth();

  const { data: presData } = useQuery({
    queryKey: ['doctor-prescriptions'],
    queryFn: () => apiRequest('/api/prescriptions', {}, session),
  });

  const prescriptions = presData?.data || [];
  const needsReview = prescriptions.filter(p => p.status === 'NEEDS_REVIEW' || p.status === 'PENDING_DOCTOR_CONFIRMATION');

  return (
    <div>
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Doctor Dashboard</h1>
          <p className="page-subtitle">Welcome back, Dr. {profile?.last_name || profile?.first_name}.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-4xl">
        <Link to="/doctor/prescriptions" className="card card-body hover:border-sky-400/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-sky-500/20 via-blue-600/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-sky-500/15 border border-sky-400/40 text-sky-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all">
              <ClipboardList className="w-6 h-6" />
            </div>
            {needsReview.length > 0 && (
              <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.4)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {needsReview.length} action needed
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-sky-300 transition-colors">My Prescriptions</h2>
          <p className="text-sm text-surface-500 leading-relaxed">Review assigned prescriptions, verify AI extractions, and confirm for dispensing.</p>
        </Link>

        <Link to="/doctor/calibration" className="card card-body hover:border-sky-400/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-blue-500/20 via-indigo-600/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="w-12 h-12 bg-blue-500/15 border border-blue-400/40 text-blue-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all">
            <Brain className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-sky-300 transition-colors">Handwriting Calibration</h2>
          <p className="text-sm text-surface-500 leading-relaxed">Provide samples of your handwriting to train the custom AI recognition model.</p>
        </Link>
      </div>

      <div className="card max-w-4xl overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-bold text-surface-900 tracking-tight">Requires Attention</h2>
          <Link to="/doctor/prescriptions" className="text-sm font-semibold text-brand-600 hover:text-brand-800">View all</Link>
        </div>
        <div className="table-wrapper border-0 shadow-none rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {needsReview.length === 0 && (
                <tr><td colSpan={3} className="text-center py-8 text-surface-500 text-sm">No prescriptions currently need your review.</td></tr>
              )}
              {needsReview.map(pres => {
                const patientName = pres.patient
                  ? `${pres.patient.first_name || ''} ${pres.patient.last_name || ''}`.trim()
                  : '';
                return (
                  <tr key={pres.id}>
                    <td>
                      <p className="font-medium text-sm text-surface-900">
                        {patientName || (pres.patient_id ? `Patient #${pres.patient_id.slice(0, 8)}` : 'Unassigned')}
                      </p>
                      {pres.patient?.phone && (
                        <p className="text-xs text-surface-400">{pres.patient.phone}</p>
                      )}
                    </td>
                    <td><StatusBadge status={pres.status} /></td>
                    <td>
                      <Link to={`/doctor/prescriptions/${pres.id}`} className="btn-primary btn-sm no-underline inline-flex">
                        Review <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
