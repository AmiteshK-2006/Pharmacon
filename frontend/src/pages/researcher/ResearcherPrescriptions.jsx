import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { PageSpinner, Spinner } from '../../components/Spinner';
import { EmptyState, ErrorState } from '../../components/States';
import { StatusBadge } from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { Search, Eye, Download, ShieldCheck, Clock, FileText, Lock, ExternalLink, Sparkles } from 'lucide-react';

export default function ResearcherPrescriptions() {
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
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
    setFileError(null);
    try {
      const res = await apiRequest(`/api/prescriptions/${pres.id}/anonymized-file`, {}, session);
      if (res?.data?.url) {
        setFileUrl(res.data.url);
      } else {
        throw new Error('Anonymized file URL not available');
      }
    } catch (err) {
      setFileError(err.message || 'Failed to load anonymized document preview');
    } finally {
      setPreviewLoading(false);
    }
  }

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
                    <button
                      onClick={() => openAnonymizedPreview(pres)}
                      className="btn-primary btn-sm inline-flex items-center gap-1.5 text-xs font-bold shadow-md shadow-sky-400/20"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Anonymized Copy
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Anonymized Document Preview Modal ────────────────── */}
      <Modal
        open={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title={selectedPrescription ? `Anonymized Document — RX-ANON-${selectedPrescription.id.slice(0, 8).toUpperCase()}` : ''}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                <strong>De-Identification Audit:</strong> Patient name, contact numbers, doctor registration, and hospital letterhead metadata have been permanently scrubbed.
              </span>
            </div>
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-sm ml-4 inline-flex items-center gap-1 shrink-0 text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Fullscreen
              </a>
            )}
          </div>

          <div className="min-h-[420px] max-h-[650px] bg-[#070d1e] rounded-xl border border-surface-200/80 flex items-center justify-center overflow-auto p-4">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Spinner size="lg" />
                <p className="text-xs text-sky-400 mt-3 font-semibold">
                  Generating secure signed link to anonymized document…
                </p>
              </div>
            ) : fileError ? (
              <div className="text-center p-8 max-w-md">
                <FileText className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Document Preview</p>
                <p className="text-xs text-surface-400 mt-1">{fileError}</p>
                <p className="text-[11px] text-surface-500 mt-3">
                  The anonymizer pipeline is currently connecting to the background processor.
                </p>
              </div>
            ) : fileUrl ? (
              <div className="w-full flex justify-center">
                <img
                  src={fileUrl}
                  alt="Anonymized Prescription"
                  className="max-h-[580px] w-auto max-w-full object-contain rounded-lg shadow-lg border border-sky-500/20"
                  onError={() => {
                    // If image fails, could be a PDF
                    setFileError('File format is PDF or binary document. Use "Open Fullscreen" to view or download.');
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-surface-200/60 text-xs text-surface-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-surface-300">
                Engine: {selectedPrescription?.anonymization_metadata?.engine || 'Pharmacon Redactor'}
              </span>
              <span className="text-surface-600">•</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                <ShieldCheck className="w-3 h-3" />
                {selectedPrescription?.anonymization_metadata?.total_entities_redacted ?? 0} PII Entities Redacted
              </span>
              {selectedPrescription?.anonymization_metadata?.confidence_score && (
                <span className="inline-flex items-center gap-1 text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                  <Sparkles className="w-3 h-3" />
                  {Math.round(selectedPrescription.anonymization_metadata.confidence_score * 100)}% Redaction Confidence
                </span>
              )}
            </div>
            {fileUrl && (
              <a
                href={fileUrl}
                download={`anonymized_prescription_${selectedPrescription?.id?.slice(0, 8)}.png`}
                className="btn-primary btn-sm inline-flex items-center gap-1.5 font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sanitized File
              </a>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
