import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Clock } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export default function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="card">
        <div className="card-header border-b-0 pb-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30">
              <span className="text-2xl font-black text-slate-950">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{profile.first_name} {profile.last_name}</h1>
              <p className="text-surface-500 font-mono text-sm">{profile.id}</p>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="grid sm:grid-cols-2 gap-6 mt-6">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-surface-500 mb-1">
                <Shield className="w-4 h-4" /> Role
              </p>
              <StatusBadge status={profile.role} />
            </div>

            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-surface-500 mb-1">
                <Clock className="w-4 h-4" /> Member Since
              </p>
              <p className="text-surface-900 font-medium">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-surface-100">
            <h2 className="text-sm font-semibold text-surface-900 uppercase tracking-wider mb-4">Account Settings</h2>
            <div className="alert-info">
              Account settings, password changes, and 2FA will be available in Phase 5.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
