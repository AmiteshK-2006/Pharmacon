import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pill, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function PublicLayout() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = {
    admin: '/admin', doctor: '/doctor', pharmacist: '/pharmacist',
    clinic_staff: '/clinic', patient: '/patient',
  }[role] || '/dashboard';

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/project', label: 'Project' },
    { to: '/team', label: 'Team' },
    { to: '/presentations', label: 'Presentations' },
    { to: '/roadmap', label: 'Roadmap' },
    { to: '/architecture', label: 'Architecture' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-white">
      {/* ─── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#070d1e]/85 backdrop-blur-md border-b border-surface-200/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white hover:text-sky-300 no-underline transition-colors">
              <div className="w-8 h-8 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Pill className="w-4 h-4 text-slate-950 font-bold" />
              </div>
              <span className="tracking-tight text-white font-extrabold">Pharmacon</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === '/'}
                  className={({ isActive }) =>
                    `px-3.5 py-1.5 text-sm font-semibold rounded-full transition-all no-underline ${
                      isActive ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]' : 'text-surface-500 hover:text-white hover:bg-surface-200/50'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <button onClick={() => navigate(dashboardPath)} className="btn-primary btn-sm">
                  Go to Dashboard
                </button>
              ) : (
                <Link to="/login" className="btn-primary btn-sm no-underline">
                  Login
                </Link>
              )}
            </div>

            {/* Mobile toggle */}
            <button className="md:hidden btn-ghost p-2" onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-200/80 bg-[#070d1e] px-4 py-3 space-y-1">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm font-medium rounded-lg no-underline ${
                    isActive ? 'bg-sky-500/20 text-sky-300' : 'text-surface-400'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {isAuthenticated
              ? <button onClick={() => { navigate(dashboardPath); setMobileOpen(false); }} className="btn-primary w-full mt-2">Dashboard</button>
              : <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full mt-2 block text-center no-underline">Login</Link>
            }
          </div>
        )}
      </header>

      {/* ─── Page content ─────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-surface-200/80 bg-[#060b18]/90 backdrop-blur-md text-surface-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-surface-400 text-sm">
              <Pill className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white">Pharmacon</span>
              <span>— Semester Project, 2026</span>
            </div>
            <p className="text-xs text-surface-500">
              Prescription digitisation &amp; medication management platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
