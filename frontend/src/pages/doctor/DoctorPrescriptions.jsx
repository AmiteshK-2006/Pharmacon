import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { PageSpinner } from '../../components/Spinner';
import { EmptyState, ErrorState } from '../../components/States';
import { StatusBadge } from '../../components/StatusBadge';
import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight, Clock, Search } from 'lucide-react';

export default function DoctorPrescriptions() {
  const { session } = useAuth();
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['doctor-prescriptions'],
    queryFn: () => apiRequest('/api/prescriptions', {}, session),
  });

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorState message={error.message} />;

  const prescriptions = data?.data || [];
  const filtered = prescriptions.filter(p => {
    const q = search.toLowerCase();
    const patientName = p.patient ? `${p.patient.first_name || ''} ${p.patient.last_name || ''}`.toLowerCase() : '';
    return p.id.toLowerCase().includes(q) ||
      patientName.includes(q) ||
      (p.file_assets?.original_name || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">My Prescriptions</h1>
          <p className="page-subtitle">View and review your patients' prescriptions.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" className="form-input pl-10" placeholder="Search by patient name, ID, or file..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={4}><EmptyState title="No prescriptions found" icon={ClipboardList} /></td></tr>
            )}
            {filtered.map(pres => {
              const patientName = pres.patient
                ? `${pres.patient.first_name || ''} ${pres.patient.last_name || ''}`.trim()
                : '';
              return (
                <tr key={pres.id}>
                  <td>
                    <div>
                      <p className="font-medium text-sm text-surface-900">
                        {patientName || (pres.patient_id ? `Patient #${pres.patient_id.slice(0, 8)}` : 'Unassigned')}
                      </p>
                      {pres.patient?.phone && (
                        <p className="text-xs text-surface-400">{pres.patient.phone}</p>
                      )}
                    </div>
                  </td>
                <td className="text-sm flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-surface-400" /> {new Date(pres.created_at).toLocaleString()}</td>
                <td><StatusBadge status={pres.status} /></td>
                <td>
                  {(pres.status === 'NEEDS_REVIEW' || pres.status === 'PENDING_DOCTOR_CONFIRMATION') ? (
                    <Link to={`/doctor/prescriptions/${pres.id}`} className="btn-primary btn-sm no-underline inline-flex">
                      Review <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  ) : (
                    <Link to={`/doctor/prescriptions/${pres.id}/view`} className="btn-secondary btn-sm no-underline inline-flex">
                      View
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}
