import { Link } from 'react-router-dom';
import { Pill, Upload, Package, Users, CheckCircle, Clock, ArrowRight } from 'lucide-react';

const STATUS_BADGE = {
  label: 'Active Development',
  class: 'badge-yellow',
};

const FEATURES = [
  { icon: Upload, title: 'Prescription Upload', desc: 'Digitise handwritten prescriptions with secure file storage and processing pipeline.' },
  { icon: CheckCircle, title: 'Human Verification', desc: 'Extracted data reviewed and corrected by authorised staff before confirmation.' },
  { icon: Package, title: 'Medicine Inventory', desc: 'Track medicine stock, batches, expiry dates, restocking, and dispensing transactions.' },
  { icon: Users, title: 'Role-Based Access', desc: 'Doctors, pharmacists, clinic staff, and patients each have scoped, secure access.' },
  { icon: Clock, title: 'Audit Trail', desc: 'Every important action is logged — prescription corrections, dispensing, inventory changes.' },
  { icon: Pill, title: 'AI Integration (Pending)', desc: 'Handwriting recognition pipeline designed and ready — model integration in progress.' },
];

const TEAM = [
  { name: 'Aryan Sharma', role: 'AI Pipeline Lead' },
  { name: 'Amitesh Kr. Singh', role: 'Deployment, Model Training' },
  { name: 'Aniket Raj', role: 'Frontend Lead' },
  { name: 'Chirag Lamba', role: 'Frontend Assistance + Backend' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#030712] border-b border-surface-200/80">
        <div className="absolute inset-0 medical-grid opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-sky-500/25 via-blue-600/20 to-cyan-400/20 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-sky-950/80 border border-sky-500/40 text-sky-300 px-4 py-1.5 rounded-full text-xs font-bold mb-6 shadow-[0_0_15px_rgba(56,189,248,0.25)] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            {STATUS_BADGE.label}
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4 text-balance">
            Pharmacon
          </h1>
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent max-w-2xl mx-auto mb-3">
            Prescription Digitisation &amp; Medication Management
          </p>
          <p className="text-surface-500 max-w-xl mx-auto mb-10 text-sm leading-relaxed">
            A university semester project transforming handwritten prescriptions into structured digital records —
            with a complete pharmacy inventory, role-based workflows, and a future AI recognition pipeline.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/project" className="btn-primary btn-lg no-underline shadow-lg shadow-sky-400/30">
              Explore Project <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/presentations" className="btn-secondary btn-lg no-underline">
              View Presentations
            </Link>
            <Link to="/login" className="btn-ghost btn-lg no-underline text-surface-400 hover:text-white">
              Login →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Problem / Solution ────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <div className="p-8 rounded-2xl bg-[#0c1427]/85 border border-sky-500/20 shadow-card backdrop-blur-md flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">The Problem</h2>
              <p className="text-surface-500 leading-relaxed mb-4 text-sm sm:text-base">
                Handwritten prescriptions remain the norm in many clinics. Manual transcription is
                error-prone, time-consuming, and creates no searchable digital record. Patients lack
                visibility into their medication history, and pharmacies struggle to cross-check inventory.
              </p>
            </div>
            <p className="text-surface-500 text-xs sm:text-sm pt-4 border-t border-surface-200/60">
              Errors in prescription transcription contribute to a significant proportion of medication errors globally.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-[#0c1427]/85 border border-sky-500/20 shadow-card backdrop-blur-md flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-sky-400 mb-4 tracking-tight">The Proposed Solution</h2>
              <p className="text-surface-500 leading-relaxed mb-4 text-sm sm:text-base">
                Pharmacon digitises prescriptions through a structured pipeline — upload, AI extraction
                (pending integration), human verification, and confirmation. The result is a structured
                digital prescription linked to inventory, accessible to all authorised parties.
              </p>
            </div>
            <p className="text-surface-500 text-xs sm:text-sm pt-4 border-t border-surface-200/60">
              The AI model is not yet integrated. The system is built to accept it without rewriting the workflow.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────── */}
      <section className="bg-[#070d1e]/70 border-y border-surface-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-extrabold text-white mb-2 text-center tracking-tight">Current Capabilities</h2>
          <p className="text-surface-500 text-center text-sm mb-12">What the system supports today</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card card-body group hover:border-sky-400/50 hover:shadow-card-hover transition-all duration-200">
                <div className="w-10 h-10 bg-sky-500/15 border border-sky-400/30 rounded-xl flex items-center justify-center mb-4 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)] group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white mb-2 text-base group-hover:text-sky-300 transition-colors">{title}</h3>
                <p className="text-surface-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Team ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-extrabold text-white mb-2 text-center tracking-tight">The Team</h2>
        <p className="text-surface-500 text-center text-sm mb-12">
          <Link to="/team" className="text-sky-400 hover:text-sky-300 font-semibold">View full team page →</Link>
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map(({ name, role }) => (
            <div key={name} className="card card-body text-center hover:border-sky-400/50 hover:shadow-card-hover transition-all duration-200">
              <div className="w-14 h-14 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(56,189,248,0.35)]">
                <span className="text-slate-950 font-extrabold text-base">{name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <p className="font-bold text-white text-sm">{name}</p>
              <p className="text-sky-400 text-xs mt-1 font-medium">{role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tech stack ────────────────────────────────────── */}
      <section className="bg-[#050914] text-white border-t border-surface-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold mb-2 text-center tracking-tight">Technology Stack</h2>
          <p className="text-surface-500 text-center text-sm mb-12">
            <Link to="/architecture" className="text-sky-400 hover:text-sky-300 font-semibold">View architecture →</Link>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { layer: 'Frontend', tech: 'React + Vite + Tailwind CSS' },
              { layer: 'Backend', tech: 'Node.js + Express' },
              { layer: 'Database', tech: 'Supabase PostgreSQL' },
              { layer: 'Auth / Storage', tech: 'Supabase Auth + Storage' },
            ].map(({ layer, tech }) => (
              <div key={layer} className="p-5 rounded-2xl bg-[#0c1427]/90 border border-sky-500/20 backdrop-blur-md shadow-card">
                <p className="text-xs text-sky-400 uppercase tracking-wider font-bold mb-1.5">{layer}</p>
                <p className="text-sm font-semibold text-white">{tech}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
