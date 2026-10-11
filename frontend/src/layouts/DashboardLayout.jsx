import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
  Pill, LayoutDashboard, FileText, Package, Users, ClipboardList,
  Upload, CheckSquare, Calendar, RefreshCw, Settings, LogOut,
  ChevronLeft, ChevronRight, Brain, Stethoscope, ShieldCheck,
  AlertTriangle, Bell,
} from 'lucide-react';

const NAV_CONFIG = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/deliverables', label: 'Deliverables', icon: FileText },
    { to: '/admin/team', label: 'Team', icon: Users },
    { to: '/admin/files', label: 'Files', icon: Package },
    { to: '/admin/users', label: 'Users', icon: ShieldCheck },
    { to: '/admin/audit', label: 'Audit Logs', icon: ClipboardList },
    { to: '/admin/profile', label: 'Profile', icon: Settings },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
    { to: '/doctor/calibration', label: 'Calibration', icon: Brain },
    { to: '/doctor/profile', label: 'Profile', icon: Settings },
  ],
  pharmacist: [
    { to: '/pharmacist', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/pharmacist/inventory', label: 'Inventory', icon: Package },
    { to: '/pharmacist/dispensing', label: 'Dispensing', icon: CheckSquare },
    { to: '/pharmacist/refills', label: 'Refill Requests', icon: RefreshCw },
    { to: '/pharmacist/profile', label: 'Profile', icon: Settings },
  ],
  clinic_staff: [
    { to: '/clinic', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/clinic/upload', label: 'Upload Prescription', icon: Upload },
    { to: '/clinic/review', label: 'Review Queue', icon: CheckSquare },
    { to: '/clinic/profile', label: 'Profile', icon: Settings },
  ],
  patient: [
    { to: '/patient', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/patient/prescriptions', label: 'My Prescriptions', icon: FileText },
    { to: '/patient/schedule', label: 'Schedule', icon: Calendar },
    { to: '/patient/refills', label: 'Refill Requests', icon: RefreshCw },
    { to: '/patient/profile', label: 'Profile', icon: Settings },
  ],
};

const ROLE_LABELS = {
  admin: 'Administrator', doctor: 'Doctor',
  pharmacist: 'Pharmacist', clinic_staff: 'Clinic Staff', patient: 'Patient',
};

export default function DashboardLayout({ role }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = NAV_CONFIG[role] || [];

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden text-white">
      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside className={`flex flex-col bg-[#070d1e] border-r border-surface-200/80 shadow-[4px_0_30px_rgba(0,0,0,0.6)] z-30 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-surface-200/60 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/30">
            <Pill className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-white tracking-tight text-base leading-none">Pharmacon</span>
              <span className="text-[10px] font-bold text-sky-400 tracking-wider uppercase mt-1">Medical Portal</span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 no-underline ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-slate-950 font-bold shadow-lg shadow-sky-400/25'
                    : 'text-surface-500 hover:bg-surface-200/50 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user + signout */}
        <div className="border-t border-surface-200/60 p-3 space-y-1">
          {!collapsed && profile && (
            <div className="px-3 py-2 text-xs text-surface-500">
              <p className="font-semibold text-white truncate">{profile.first_name} {profile.last_name}</p>
              <p className="mt-0.5 text-sky-400">{ROLE_LABELS[role]}</p>
            </div>
          )}
          <button onClick={handleSignOut}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg text-surface-500 hover:bg-rose-950/60 hover:text-rose-300 transition-colors ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(v => !v)}
          className="flex items-center justify-center h-8 border-t border-surface-200/60 text-surface-500 hover:text-white hover:bg-surface-200/40 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* ─── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3.5 bg-[#070d1e]/85 backdrop-blur-md border-b border-surface-200/80 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-semibold text-surface-400">System Online • HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost p-2 rounded-xl text-surface-400 hover:text-white" title="Notifications">
              <Bell className="w-4 h-4" />
            </button>
            {profile && (
              <div className="flex items-center gap-3 pl-3 border-l border-surface-200">
                <div className="text-right">
                  <p className="text-sm font-bold text-white leading-tight">{profile.first_name} {profile.last_name}</p>
                  <p className="text-xs text-sky-400 font-semibold leading-tight mt-0.5">{ROLE_LABELS[role]}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 border border-sky-300 flex items-center justify-center text-xs font-bold text-slate-950 shadow-md shadow-sky-500/25">
                  {profile.first_name?.[0] || 'U'}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-[#030712] via-[#050b1a] to-[#071329] relative">
          <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-gradient-to-br from-sky-500/10 via-blue-600/10 to-transparent blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
