import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { PageSpinner } from '../../components/Spinner';
import { EmptyState, ErrorState } from '../../components/States';
import { StatusBadge } from '../../components/StatusBadge';
import { ArrowLeft, FileText, Download, ExternalLink } from 'lucide-react';

export default function PrescriptionDetailPage() {
  const { id } = useParams();
  const { session, role } = useAuth();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => apiRequest(`/api/prescriptions/${id}`, {}, session),
  });

  const pres = data?.data;

  const { data: fileData, isLoading: fileLoading } = useQuery({
    queryKey: ['prescription-file', id],
    queryFn: () => apiRequest(`/api/prescriptions/${id}/file`, {}, session),
    enabled: !!pres?.file_assets,
  });

  const fileUrl = fileData?.data?.url;

  async function handleDownload() {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
      return;
    }
    setDownloading(true);
    try {
      const res = await apiRequest(`/api/prescriptions/${id}/file`, {}, session);
      if (res?.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorState message={error.message} />;
  if (!pres) return <EmptyState title="Prescription not found" />;

  const fields = pres.prescription_extraction_fields || [];
  const history = pres.prescription_status_history || [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="btn-ghost btn-sm mb-6 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="page-header mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            Prescription Details
            <StatusBadge status={pres.status} />
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-surface-600">
            {pres.patient ? (
              <span className="font-semibold text-surface-900">
                Patient: {pres.patient.first_name} {pres.patient.last_name}
                {pres.patient.phone && <span className="text-surface-400 font-normal ml-1">({pres.patient.phone})</span>}
              </span>
            ) : (
              <span className="text-surface-400 italic">
                {pres.patient_id ? `Patient #${pres.patient_id.slice(0, 8)}` : 'Unassigned Patient'}
              </span>
            )}
            <span className="text-surface-300">•</span>
            <span className="font-mono text-xs text-surface-400">{pres.id}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card card-body">
            <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" /> Original File
            </h3>
            {pres.file_assets ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg border border-surface-200">
                  <div className="truncate mr-2">
                    <p className="font-medium text-sm text-surface-900">{pres.file_assets.original_name}</p>
                    <p className="text-xs text-surface-500 uppercase">{pres.file_assets.mime_type.split('/').pop()}</p>
                  </div>
                  <button onClick={handleDownload} disabled={downloading} className="btn-secondary btn-sm flex-shrink-0">
                    {downloading ? 'Loading...' : <><ExternalLink className="w-4 h-4" /> Open in New Tab</>}
                  </button>
                </div>
                {fileUrl && pres.file_assets.mime_type?.startsWith('image/') && (
                  <div className="p-2 bg-surface-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={fileUrl}
                      alt={pres.file_assets.original_name}
                      className="max-h-96 w-auto object-contain rounded border border-surface-200"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-surface-500">No file attached</p>
            )}
            
            {pres.notes && (
              <div className="mt-4 pt-4 border-t border-surface-100">
                <p className="text-xs font-semibold text-surface-500 uppercase mb-1">Notes</p>
                <p className="text-sm text-surface-700">{pres.notes}</p>
              </div>
            )}
          </div>

          <div className="card card-body">
            <h3 className="font-semibold text-surface-900 mb-4">Extracted Data</h3>
            {fields.length === 0 ? (
              <p className="text-sm text-surface-500">No data extracted yet.</p>
            ) : (
              <div className="table-wrapper">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Value</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(f => (
                      <tr key={f.id}>
                        <td className="font-medium font-mono text-xs">{f.field_name}</td>
                        <td className={f.is_corrected ? 'text-brand-700 font-semibold' : ''}>
                          {f.is_corrected ? f.corrected_value : f.extracted_value}
                          {f.is_corrected && <span className="ml-2 badge badge-blue text-[10px] px-1 py-0">Corrected</span>}
                        </td>
                        <td>
                          {f.confidence !== null ? (
                            <span className={f.confidence > 0.8 ? 'text-success-dark' : 'text-warning-dark'}>
                              {Math.round(f.confidence * 100)}%
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card card-body">
            <h3 className="font-semibold text-surface-900 mb-4">Status History</h3>
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={h.id} className="relative pl-6 pb-4 border-l border-surface-200 last:border-0 last:pb-0">
                  <div className={`absolute w-3 h-3 rounded-full -left-[6.5px] top-1 ${i === 0 ? 'bg-brand-500 shadow-[0_0_0_3px_#eef7ff]' : 'bg-surface-300'}`} />
                  <p className="font-medium text-sm text-surface-900 leading-none mb-1"><StatusBadge status={h.status} /></p>
                  <p className="text-xs text-surface-500">{new Date(h.created_at).toLocaleString()}</p>
                  {h.notes && <p className="text-xs text-surface-600 mt-2 bg-surface-50 p-2 rounded">{h.notes}</p>}
                </div>
              ))}
            </div>
          </div>
          {role === 'clinic_staff' && (
            <div className="mt-4 p-4 border border-surface-200 rounded-lg bg-surface-50">
              <h4 className="font-semibold text-surface-900 text-sm mb-3">Assignment</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-surface-500">Patient</p>
                  <p className="text-sm font-medium">{pres.patient_id || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">Doctor</p>
                  <p className="text-sm font-medium">{pres.doctor_id || 'Unassigned'}</p>
                </div>
              </div>
              {/* Note: In a full app, this would be a button that opens a modal with the user list to select a new patient/doctor. */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
