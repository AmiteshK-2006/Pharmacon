import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { PageSpinner } from '../../components/Spinner';
import { ErrorState, EmptyState } from '../../components/States';
import { Link } from 'react-router-dom';
import { Users, FileText, Pill, ClipboardList, Activity } from 'lucide-react';

function StatCard({ title, value, icon: Icon, loading }) {
  return (
    <div className="card card-body flex items-center gap-4 hover:border-brand-300 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/25">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-surface-500">{title}</p>
        {loading ? (
          <div className="skeleton w-16 h-8 mt-1 rounded-lg" />
        ) : (
          <p className="text-2xl font-extrabold text-surface-900 tracking-tight">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { session } = useAuth();

  // We could fetch these counts from dedicated endpoints, but for simplicity we fetch lists and take length.
  // In a real prod environment with large datasets, these would be count queries.
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: () => apiRequest('/api/users', {}, session),
  });

  const { data: deliverables, isLoading: delivLoading } = useQuery({
    queryKey: ['admin-deliv-count'],
    queryFn: () => apiRequest('/api/deliverables', {}, session),
  });

  const { data: medicines, isLoading: medLoading } = useQuery({
    queryKey: ['admin-med-count'],
    queryFn: () => apiRequest('/api/inventory/medicines', {}, session),
  });

  const { data: prescriptions, isLoading: presLoading } = useQuery({
    queryKey: ['admin-pres-count'],
    queryFn: () => apiRequest('/api/prescriptions', {}, session),
  });

  const { data: audit, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit-recent'],
    queryFn: () => apiRequest('/api/audit?limit=5', {}, session),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Overview of system activity and configuration.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={users?.data?.length || 0} icon={Users} loading={usersLoading} />
        <StatCard title="Deliverables" value={deliverables?.data?.length || 0} icon={FileText} loading={delivLoading} />
        <StatCard title="Medicines" value={medicines?.data?.length || 0} icon={Pill} loading={medLoading} />
        <StatCard title="Prescriptions" value={prescriptions?.data?.length || 0} icon={ClipboardList} loading={presLoading} />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" /> Recent Audit Logs
          </h2>
          <Link to="/admin/audit" className="text-sm font-medium text-brand-600 hover:text-brand-700">View All</Link>
        </div>
        <div className="table-wrapper border-0 shadow-none rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {auditLoading && [1, 2, 3].map(i => (
                <tr key={i}>
                  <td colSpan={4} className="p-4"><div className="skeleton h-4 w-full rounded" /></td>
                </tr>
              ))}
              {!auditLoading && audit?.data?.length === 0 && (
                <tr><td colSpan={4}><EmptyState title="No recent activity" /></td></tr>
              )}
              {!auditLoading && audit?.data?.map(log => (
                <tr key={log.id}>
                  <td className="text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="text-sm font-medium">{log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : 'System'}</td>
                  <td className="text-sm"><span className="badge badge-gray">{log.action}</span></td>
                  <td className="text-sm text-surface-500">{log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0,8)}...)` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
