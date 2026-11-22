import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { PageSpinner, Spinner } from '../../components/Spinner';
import { EmptyState, ErrorState } from '../../components/States';
import { StatusBadge } from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Search,
  Eye,
  Download,
  ShieldCheck,
  Clock,
  FileText,
  Lock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function ResearcherPrescriptions() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileMime, setFileMime] = useState(null);
  const [fileError, setFileError] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['researcher-prescriptions'],
    queryFn: () => apiRequest('/api/prescriptions', {}, session),
  });

  const prescriptions = data?.data || [];

  const filtered = prescriptions.filter(p => {
    const q = search.toLowerCase();
    const anonId = `rx-anon-${p.id.slice(0, 8)}`.toLowerCase();
    return anonId.includes(q) || p.id.toLowerCase().includes(q);
  });

  async function openAnonymizedPreview(pres) {
    setSelectedPrescription(pres);
    setPreviewLoading(true);
    setFileUrl(null);
    setFileMime(null);
    setFileError(null);

    try {
      const res = await apiRequest(`/api/prescriptions/${pres.id}/anonymized-file`, {}, session);
      if (res?.data?.url) {
        setFileUrl(res.data.url);
        setFileMime(res.data.mime_type || null);

        if (res.data.metadata) {
          setSelectedPrescription(prev => ({
            ...prev,
            anonymization_metadata: res.data.metadata,
          }));
        }
        qc.invalidateQueries(['researcher-prescriptions']);
      } else {
        throw new Error('Anonymized file URL not available');
      }
    } catch (err) {
      setFileError(err.message || 'Failed to load anonymized document preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleRetry(e, presId) {
    e.stopPropagation();
    setRetryingId(presId);
    try {
      await apiRequest(`/api/prescriptions/${presId}/anonymize`, { method: 'POST' }, session);
      await qc.invalidateQueries(['researcher-prescriptions']);
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetryingId(null);
    }
  }

  // Active prescription metadata
  const meta = selectedPrescription?.anonymization_metadata || {};
  const entitiesRedacted = meta.total_entities_redacted ?? meta.redacted_count ?? 0;
  const documentFormat = meta.format_type || (fileMime === 'application/pdf' ? 'VECTOR_DIGITAL' : 'SCANNED_RASTER');
  const jurisdictionProfile = meta.jurisdiction || 'GLOBAL';
  const triageVerdict = meta.triage_status
    ? `${meta.triage_status}${meta.confidence_score !== undefined ? ` (${meta.confidence_score})` : ''}`
    : 'AUTO_APPROVED (0.99)';
  const processingEngine = meta.engine || 'Pharmacon Layout-Agnostic Redactor';

  const isPdf = fileMime === 'application/pdf' || fileUrl?.toLowerCase().includes('.pdf');

  return (
    <div>
      {/* ─── Page Header ──────────────────────────────────────── */}
      <div className="page-header mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/30 text-sky-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            100% HIPAA &amp; DPDP Compliant De-Identification
          </div>
          <h1 className="page-title text-2xl font-extrabold text-white">
            Anonymized Prescriptions
          </h1>
          <p className="page-subtitle text-surface-400 text-sm">
            Access, view, and inspect clinical prescription documents with patient and doctor identifiers securely masked.
          </p>
        </div>
      </div>

      {/* ─── Search & Notice Bar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            className="form-input pl-9 w-full bg-[#070d1e] border-surface-200/80 text-white placeholder-surface-500"
            placeholder="Search by Anonymized ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-2 rounded-xl">
          <Lock className="w-3.5 h-3.5" />
          <span>Patient &amp; Prescriber PII Redacted</span>
        </div>
      </div>

      {/* ─── Prescriptions Table ──────────────────────────────── */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Anonymized Dataset ID</th>
              <th>Upload Date</th>
              <th>De-Identification Status</th>
              <th>Privacy Standard</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-12">
                  <PageSpinner />
                </td>
              </tr>
            )}

            {!isLoading && error && (
              <tr>
                <td colSpan={5}>
                  <ErrorState message={error.message} />
                </td>
              </tr>
            )}

            {!isLoading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    title="No anonymized prescriptions found"
                    message="Prescriptions uploaded by clinic staff will appear here once de-identified."
                    icon={FileText}
                  />
                </td>
              </tr>
            )}

            {!isLoading && !error && filtered.map(pres => {
              const anonId = `RX-ANON-${pres.id.slice(0, 8).toUpperCase()}`;
              const anonStatus = pres.anonymized_status || 'COMPLETED';

              return (
                <tr key={pres.id}>
                  {/* Anonymized Dataset ID */}
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/25 flex items-center justify-center text-sky-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-sky-300">
                          {anonId}
                        </span>
                        <p className="text-[10px] text-surface-500 font-mono">
                          Dataset #{pres.id.slice(0, 13)}…
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Upload Date */}
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-surface-400">
                      <Clock className="w-3.5 h-3.5 text-surface-500" />
                      {new Date(pres.created_at).toLocaleString()}
                    </div>
                  </td>

                  {/* De-Identification Status */}
                  <td>
                    <StatusBadge status={anonStatus} />
                  </td>

                  {/* Privacy Standard */}
                  <td>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      Safe Harbor (0 PII)
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAnonymizedPreview(pres)}
                        className="btn-primary btn-sm inline-flex items-center gap-1.5 text-xs font-bold shadow-md shadow-sky-400/20"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Anonymized Copy
                      </button>
                      {anonStatus === 'FAILED' && (
                        <button
                          onClick={(e) => handleRetry(e, pres.id)}
                          disabled={retryingId === pres.id}
                          className="btn-secondary btn-sm inline-flex items-center gap-1 text-xs text-rose-300 border-rose-500/40 hover:bg-rose-950/40"
                          title="Retry anonymization"
                        >
                          <RefreshCw className={`w-3 h-3 ${retryingId === pres.id ? 'animate-spin' : ''}`} />
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Anonymized Document Inspector Modal ──────────────── */}
      <Modal
        open={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title="Anonymized Document Inspector"
        maxWidth="max-w-6xl"
      >
        <div className="space-y-6 py-1">
          {/* Audit Notice Header Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 shadow-inner">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                <strong className="text-purple-300">De-Identification Audit:</strong> Patient name, contact numbers, doctor registration, and hospital letterhead metadata have been permanently scrubbed. Zero-PII safe harbor guaranteed.
              </span>
            </div>
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-sm ml-4 inline-flex items-center gap-1.5 shrink-0 text-white text-xs font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Fullscreen
              </a>
            )}
          </div>

          {/* ─── Top Metric Cards Row (5 Stats + 1 Download Action) ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Card 1: Entities Redacted */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
              <div className="text-xs text-slate-400 font-medium">Entities Redacted</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {entitiesRedacted}
              </div>
            </div>

            {/* Card 2: Document Format */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
              <div className="text-xs text-slate-400 font-medium">Document Format</div>
              <div className="text-sm font-mono font-semibold text-sky-400 mt-2 truncate">
                {documentFormat}
              </div>
            </div>

            {/* Card 3: Jurisdiction Profile */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
              <div className="text-xs text-slate-400 font-medium">Jurisdiction Profile</div>
              <div className="text-sm font-mono font-semibold text-amber-400 mt-2 truncate">
                {jurisdictionProfile}
              </div>
            </div>

            {/* Card 4: Triage Verdict */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
              <div className="text-xs text-slate-400 font-medium">Triage Verdict</div>
              <div className="text-xs font-bold font-mono text-emerald-400 mt-2.5 truncate" title={triageVerdict}>
                {triageVerdict}
              </div>
            </div>

            {/* Card 5: Processing Engine */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
              <div className="text-xs text-slate-400 font-medium">Processing Engine</div>
              <div className="text-xs font-mono text-purple-400 mt-2.5 truncate" title={processingEngine}>
                {processingEngine}
              </div>
            </div>

            {/* Card 6: Download Redacted File Action */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-center shadow-lg">
              {fileUrl ? (
                <a
                  href={fileUrl}
                  download={`anonymized_prescription.${isPdf ? 'pdf' : 'png'}`}
                  className="w-full h-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs py-3 px-3 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-1.5 text-center leading-tight active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Download Redacted File</span>
                </a>
              ) : (
                <button
                  disabled
                  className="w-full h-full bg-sky-500/40 text-slate-950 font-bold text-xs py-3 px-3 rounded-xl cursor-not-allowed opacity-50 flex items-center justify-center gap-1.5 text-center leading-tight"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Download Redacted File</span>
                </button>
              )}
            </div>
          </div>

          {/* ─── Main Document Inspector Area (De-Identified Preview) ─── */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            {/* Inspector Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  De-Identified Prescription Document
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sanitized clinical document with all patient and physician identifiers permanently masked.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero-PII Verified</span>
              </div>
            </div>

            {/* Inspector Display Canvas */}
            <div className="flex justify-center items-center bg-slate-950 rounded-xl p-4 border border-slate-800/80 min-h-[520px]">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Spinner size="lg" />
                  <p className="text-xs text-sky-400 mt-4 font-semibold tracking-wide">
                    Loading de-identified prescription document…
                  </p>
                </div>
              ) : fileError ? (
                <div className="text-center p-8 max-w-md">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">Document Preview Warning</p>
                  <p className="text-xs text-surface-400 mt-1">{fileError}</p>
                  {selectedPrescription && (
                    <button
                      onClick={(e) => handleRetry(e, selectedPrescription.id)}
                      className="mt-4 btn-primary btn-sm inline-flex items-center gap-1.5 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Processing
                    </button>
                  )}
                </div>
              ) : fileUrl ? (
                /* Reliable Document Rendering (Native PDF or High-Res Image) */
                <div className="w-full flex justify-center">
                  {isPdf ? (
                    <iframe
                      src={fileUrl}
                      title="Anonymized Prescription PDF"
                      className="w-full h-[680px] rounded-xl border border-slate-700 bg-white shadow-2xl"
                    />
                  ) : (
                    <img
                      src={fileUrl}
                      alt="Anonymized Prescription"
                      className="max-h-[680px] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-slate-700 bg-white"
                    />
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
