import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { PageSpinner } from '../../components/Spinner';
import { EmptyState, ErrorState } from '../../components/States';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { Ban, ShieldCheck } from 'lucide-react';

export default function AdminUsers() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const { show, ToastContainer } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiRequest('/api/users', {}, session),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => apiRequest(`/api/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }, session),
    onSuccess: () => {
      qc.invalidateQueries(['admin-users']);
      show('Role updated successfully', 'success');
    },
    onError: (err) => show(err.message, 'error'),
  });

  const disableMutation = useMutation({
    mutationFn: (id) => apiRequest(`/api/users/${id}/disable`, { method: 'PATCH' }, session),
    onSuccess: () => {
      qc.invalidateQueries(['admin-users']);
      show('User disabled', 'success');
    },
    onError: (err) => show(err.message, 'error'),
  });

  function handleRoleChange(id, newRole) {
    if(confirm(`Change role to ${newRole}?`)) {
      roleMutation.mutate({ id, role: newRole });
    }
  }

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage system access and roles.</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>User ID</th>
              <th>Current Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && [1,2,3].map(i => <tr key={i}><td colSpan={5}><div className="skeleton h-4 w-full rounded" /></td></tr>)}
            {!isLoading && error && <tr><td colSpan={5}><ErrorState message={error.message} /></td></tr>}
            {!isLoading && !error && (data?.data || []).map(user => (
              <tr key={user.id}>
                <td className="font-medium">{user.first_name} {user.last_name}</td>
                <td className="font-mono text-xs text-surface-500">{user.id}</td>
                <td><StatusBadge status={user.role} /></td>
                <td className="text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <select
                      className="form-select py-1 pl-2 pr-8 text-xs bg-surface-50 border-surface-200"
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      disabled={roleMutation.isPending}
                    >
                      <option value="patient">Patient</option>
                      <option value="clinic_staff">Clinic Staff</option>
                      <option value="doctor">Doctor</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="researcher">Researcher</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => { if(confirm('Disable user permanently?')) disableMutation.mutate(user.id); }}
                      className="btn-ghost btn-sm text-danger"
                      title="Disable User"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
