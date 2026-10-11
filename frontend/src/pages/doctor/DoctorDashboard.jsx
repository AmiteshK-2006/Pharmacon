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
        <Link to="/doctor/prescriptions" className="card card-body hover:border-brand-400 hover:shadow-md transition-all no-underline group cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6" />
            </div>
            {needsReview.length > 0 && (
              <span className="bg-danger text-white text-xs font-bold px-2 py-1 rounded-full">
                {needsReview.length} action needed
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-surface-900 mb-2">My Prescriptions</h2>
          <p className="text-sm text-surface-600">Review assigned prescriptions, verify AI extractions, and confirm for dispensing.</p>
        </Link>

        <Link to="/doctor/calibration" className="card card-body hover:border-brand-400 hover:shadow-md transition-all no-underline group cursor-pointer block">
          <div className="w-12 h-12 bg-info-light text-info-dark rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Brain className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-surface-900 mb-2">Handwriting Calibration</h2>
          <p className="text-sm text-surface-600">Provide samples of your handwriting to train the custom AI recognition model.</p>
        </Link>
      </div>

      <div className="card max-w-4xl">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-surface-900">Requires Attention</h2>
          <Link to="/doctor/prescriptions" className="text-sm font-medium text-brand-600 hover:text-brand-800">View all</Link>
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
