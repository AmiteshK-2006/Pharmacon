import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import { PageSpinner } from '../../components/Spinner';
import { EmptyState, ErrorState } from '../../components/States';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import {
  Plus, Search, AlertTriangle, Package, RefreshCw, Minus, Settings,
  ChevronDown, Filter, Clock,
} from 'lucide-react';

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Patch', 'Suppository', 'Other'];

function formatSize(bytes) {
  if (!bytes) return '-';
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatStock(batches = []) {
  return batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
}

function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
      ))}
    </tr>
  );
}

export default function InventoryPage() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const { show, ToastContainer } = useToast();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [activeTab, setActiveTab] = useState('medicines'); // medicines | low-stock | expiring | transactions

  // ─── Add medicine form state ──────────────────────────────
  const [addForm, setAddForm] = useState({
    name: '', generic_name: '', strength: '', dosage_form: 'Tablet',
    sku: '', manufacturer: '', unit: 'units', pack_size: 1,
    reorder_threshold: 10, price: '',
  });

  // ─── Restock form state ───────────────────────────────────
  const [restockForm, setRestockForm] = useState({
    quantity: '', batch_number: '', expiry_date: '', supplier: '', cost_per_unit: '', notes: '',
  });

  // ─── Adjust form state ────────────────────────────────────
  const [adjustForm, setAdjustForm] = useState({ quantity_change: '', reason: '', notes: '' });

  // ─── Queries ──────────────────────────────────────────────
  const { data: medicinesData, isLoading, error, refetch } = useQuery({
    queryKey: ['medicines'],
    queryFn: () => apiRequest('/api/inventory/medicines', {}, session),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => apiRequest('/api/inventory/alerts/low-stock', {}, session),
  });

  const { data: expiringData } = useQuery({
    queryKey: ['expiring'],
    queryFn: () => apiRequest('/api/inventory/alerts/expiring?days=30', {}, session),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', selectedMedicine?.id],
    queryFn: () => apiRequest(`/api/inventory/medicines/${selectedMedicine.id}/transactions`, {}, session),
    enabled: !!selectedMedicine && activeTab === 'transactions',
  });

  // ─── Mutations ────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (body) => apiRequest('/api/inventory/medicines', { method: 'POST', body: JSON.stringify(body) }, session),
    onSuccess: () => {
      qc.invalidateQueries(['medicines']);
      setShowAddModal(false);
      setAddForm({ name: '', generic_name: '', strength: '', dosage_form: 'Tablet', sku: '', manufacturer: '', unit: 'units', pack_size: 1, reorder_threshold: 10, price: '' });
      show('Medicine added successfully', 'success');
    },
    onError: (err) => show(err.message, 'error'),
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, body }) => apiRequest(`/api/inventory/medicines/${id}/restock`, { method: 'POST', body: JSON.stringify(body) }, session),
    onSuccess: () => {
      qc.invalidateQueries(['medicines']);
      qc.invalidateQueries(['low-stock']);
      setShowRestockModal(false);
      setRestockForm({ quantity: '', batch_number: '', expiry_date: '', supplier: '', cost_per_unit: '', notes: '' });
      show('Restock recorded successfully', 'success');
    },
    onError: (err) => show(err.message, 'error'),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, body }) => apiRequest(`/api/inventory/medicines/${id}/adjust`, { method: 'POST', body: JSON.stringify(body) }, session),
    onSuccess: () => {
      qc.invalidateQueries(['medicines']);
      setShowAdjustModal(false);
      setAdjustForm({ quantity_change: '', reason: '', notes: '' });
      show('Stock adjustment recorded', 'success');
    },
    onError: (err) => show(err.message, 'error'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => apiRequest(`/api/inventory/medicines/${id}/deactivate`, { method: 'PATCH' }, session),
    onSuccess: () => {
      qc.invalidateQueries(['medicines']);
      show('Medicine deactivated', 'warning');
    },
    onError: (err) => show(err.message, 'error'),
  });

  const medicines = medicinesData?.data ?? [];
  const filtered = medicines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.generic_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.sku || '').toLowerCase().includes(search.toLowerCase())
  );
  const lowStock = lowStockData?.data ?? [];
  const expiring = expiringData?.data ?? [];

  function openRestock(medicine) {
    setSelectedMedicine(medicine);
    setShowRestockModal(true);
  }

  function openAdjust(medicine) {
    setSelectedMedicine(medicine);
    setShowAdjustModal(true);
  }

  function openTransactions(medicine) {
    setSelectedMedicine(medicine);
    setActiveTab('transactions');
  }

  return (
    <div>
      <ToastContainer />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Medicine stock management and tracking</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      {/* Alert badges */}
      <div className="flex gap-3 mb-6">
        {lowStock.length > 0 && (
          <button onClick={() => setActiveTab('low-stock')}
            className="flex items-center gap-2 px-3 py-2 bg-warning-light text-warning-dark rounded-lg text-sm font-medium border border-amber-200 hover:bg-amber-100 transition-colors">
            <AlertTriangle className="w-4 h-4" />
            {lowStock.length} low-stock {lowStock.length === 1 ? 'item' : 'items'}
          </button>
        )}
        {expiring.length > 0 && (
          <button onClick={() => setActiveTab('expiring')}
            className="flex items-center gap-2 px-3 py-2 bg-danger-light text-danger-dark rounded-lg text-sm font-medium border border-red-200 hover:bg-red-100 transition-colors">
            <Clock className="w-4 h-4" />
            {expiring.length} expiring within 30 days
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-surface-100 p-1 rounded-lg w-fit">
        {[
          { key: 'medicines', label: 'All Medicines', icon: Package },
          { key: 'low-stock', label: 'Low Stock', icon: AlertTriangle },
          { key: 'expiring', label: 'Expiring', icon: Clock },
          ...(selectedMedicine ? [{ key: 'transactions', label: `Transactions — ${selectedMedicine.generic_name || selectedMedicine.name}`, icon: RefreshCw }] : []),
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === key ? 'bg-white text-surface-900 shadow-card' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ─── All Medicines Tab ──────────────────────────────── */}
      {activeTab === 'medicines' && (
        <>
          {/* Search */}
          <div className="relative mb-4 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search medicines…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Form / Strength</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Reorder At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && [1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
                {!isLoading && error && (
                  <tr><td colSpan={7}><ErrorState message={error.message} onRetry={refetch} /></td></tr>
                )}
                {!isLoading && !error && filtered.length === 0 && (
                  <tr><td colSpan={7}><EmptyState title="No medicines found" message="Add your first medicine using the button above." icon={Package} /></td></tr>
                )}
                {filtered.map(med => {
                  const stock = formatStock(med.inventory_batches);
                  const isLow = stock <= med.reorder_threshold;
                  return (
                    <tr key={med.id}>
                      <td>
                        <p className="font-medium text-surface-900">{med.generic_name || med.name}</p>
                        {med.generic_name && <p className="text-xs text-surface-400">{med.name}</p>}
                      </td>
                      <td>{med.dosage_form} · {med.strength}</td>
                      <td className="font-mono text-xs">{med.sku || '—'}</td>
                      <td>
                        <span className={`font-semibold ${isLow ? 'text-danger' : 'text-surface-900'}`}>
                          {stock} {med.unit}
                        </span>
                      </td>
                      <td>{med.reorder_threshold} {med.unit}</td>
                      <td><StatusBadge status={med.status} /></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openRestock(med)} className="btn-secondary btn-sm" title="Restock">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openAdjust(med)} className="btn-secondary btn-sm" title="Adjust">
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openTransactions(med)} className="btn-ghost btn-sm" title="History">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          {med.status === 'active' && (
                            <button onClick={() => { if (confirm(`Deactivate ${med.generic_name || med.name}?`)) deactivateMutation.mutate(med.id); }}
                              className="btn-ghost btn-sm text-danger hover:bg-danger-light" title="Deactivate">
                              <Minus className="w-3.5 h-3.5" />
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
        </>
      )}

      {/* ─── Low Stock Tab ──────────────────────────────────── */}
      {activeTab === 'low-stock' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Medicine</th><th>Form</th><th>Current Stock</th><th>Reorder Threshold</th><th>Action</th></tr>
            </thead>
            <tbody>
              {lowStock.length === 0 && (
                <tr><td colSpan={5}><EmptyState title="All stocks are adequate" icon={Package} /></td></tr>
              )}
              {lowStock.map(item => (
                <tr key={item.medicine_id}>
                  <td>
                    <p className="font-medium text-surface-900">{item.generic_name || item.name}</p>
                    {item.generic_name && <p className="text-xs text-surface-400">{item.name}</p>}
                  </td>
                  <td>{item.dosage_form} · {item.strength}</td>
                  <td className="font-semibold text-danger">{item.total_stock}</td>
                  <td>{item.reorder_threshold}</td>
                  <td>
                    <button onClick={() => { setSelectedMedicine({ id: item.medicine_id, name: item.name, generic_name: item.generic_name }); setShowRestockModal(true); }}
                      className="btn-primary btn-sm">
                      <Plus className="w-3.5 h-3.5" /> Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Expiring Tab ───────────────────────────────────── */}
      {activeTab === 'expiring' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Medicine</th><th>Batch</th><th>Quantity</th><th>Expiry Date</th><th>Days Left</th></tr>
            </thead>
            <tbody>
              {expiring.length === 0 && (
                <tr><td colSpan={5}><EmptyState title="No batches expiring soon" icon={Clock} /></td></tr>
              )}
              {expiring.map(batch => {
                const daysLeft = Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                const med = batch.medicines;
                return (
                  <tr key={batch.id}>
                    <td>
                      <p className="font-medium text-surface-900">{med?.generic_name || med?.name}</p>
                      {med?.generic_name && <p className="text-xs text-surface-400">{med?.name}</p>}
                    </td>
                    <td className="font-mono text-xs">{batch.batch_number || '—'}</td>
                    <td>{batch.quantity}</td>
                    <td>{new Date(batch.expiry_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`font-semibold ${daysLeft <= 7 ? 'text-danger' : 'text-warning-dark'}`}>
                        {daysLeft}d
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Transactions Tab ───────────────────────────────── */}
      {activeTab === 'transactions' && selectedMedicine && (
        <>
          <p className="text-sm text-surface-500 mb-4">Transaction history for <strong>{selectedMedicine.generic_name || selectedMedicine.name}</strong></p>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Type</th><th>Qty Change</th><th>Actor</th><th>Reference</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {txLoading && [1,2,3].map(i => <SkeletonRow key={i} />)}
                {!txLoading && (txData?.data ?? []).length === 0 && (
                  <tr><td colSpan={6}><EmptyState title="No transactions" /></td></tr>
                )}
                {(txData?.data ?? []).map(tx => (
                  <tr key={tx.id}>
                    <td className="text-xs">{new Date(tx.created_at).toLocaleString()}</td>
                    <td><span className={`badge ${tx.transaction_type === 'RESTOCK' ? 'badge-green' : tx.transaction_type === 'DISPENSE' ? 'badge-blue' : 'badge-yellow'}`}>{tx.transaction_type}</span></td>
                    <td className={`font-semibold font-mono ${tx.quantity_change > 0 ? 'text-success-dark' : 'text-danger'}`}>
                      {tx.quantity_change > 0 ? '+' : ''}{tx.quantity_change}
                    </td>
                    <td className="text-xs">{tx.profiles ? `${tx.profiles.first_name} ${tx.profiles.last_name}` : '—'}</td>
                    <td className="text-xs font-mono">{tx.reference_id ? tx.reference_id.slice(0, 8) + '…' : '—'}</td>
                    <td className="text-xs text-surface-500">{tx.notes || tx.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── Add Medicine Modal ─────────────────────────────── */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Medicine">
        <form onSubmit={e => { e.preventDefault(); addMutation.mutate({ ...addForm, pack_size: Number(addForm.pack_size), reorder_threshold: Number(addForm.reorder_threshold), price: addForm.price ? Number(addForm.price) : undefined }); }}
          className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="form-label">Brand Name *</label>
              <input required className="form-input" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Calpol" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Generic Name</label>
              <input className="form-input" value={addForm.generic_name} onChange={e => setAddForm(f => ({ ...f, generic_name: e.target.value }))} placeholder="e.g. Paracetamol" />
            </div>
            <div>
              <label className="form-label">Strength *</label>
              <input required className="form-input" value={addForm.strength} onChange={e => setAddForm(f => ({ ...f, strength: e.target.value }))} placeholder="e.g. 500mg" />
            </div>
            <div>
              <label className="form-label">Dosage Form *</label>
              <select className="form-select" value={addForm.dosage_form} onChange={e => setAddForm(f => ({ ...f, dosage_form: e.target.value }))}>
                {DOSAGE_FORMS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">SKU</label>
              <input className="form-input" value={addForm.sku} onChange={e => setAddForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. MED-001" />
            </div>
            <div>
              <label className="form-label">Manufacturer</label>
              <input className="form-input" value={addForm.manufacturer} onChange={e => setAddForm(f => ({ ...f, manufacturer: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Unit *</label>
              <input required className="form-input" value={addForm.unit} onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. tablets" />
            </div>
            <div>
              <label className="form-label">Pack Size</label>
              <input type="number" min="1" className="form-input" value={addForm.pack_size} onChange={e => setAddForm(f => ({ ...f, pack_size: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Reorder Threshold</label>
              <input type="number" min="0" className="form-input" value={addForm.reorder_threshold} onChange={e => setAddForm(f => ({ ...f, reorder_threshold: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Price (₹)</label>
              <input type="number" min="0" step="0.01" className="form-input" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={addMutation.isPending} className="btn-primary">
              {addMutation.isPending ? 'Adding…' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Restock Modal ──────────────────────────────────── */}
      <Modal open={showRestockModal} onClose={() => setShowRestockModal(false)} title={`Restock — ${selectedMedicine?.generic_name || selectedMedicine?.name}`}>
        <form onSubmit={e => {
          e.preventDefault();
          restockMutation.mutate({ id: selectedMedicine.id, body: { ...restockForm, quantity: Number(restockForm.quantity), cost_per_unit: restockForm.cost_per_unit ? Number(restockForm.cost_per_unit) : undefined } });
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="form-label">Quantity *</label>
              <input required type="number" min="1" className="form-input" value={restockForm.quantity} onChange={e => setRestockForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Batch Number</label>
              <input className="form-input" value={restockForm.batch_number} onChange={e => setRestockForm(f => ({ ...f, batch_number: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Expiry Date</label>
              <input type="date" className="form-input" value={restockForm.expiry_date} onChange={e => setRestockForm(f => ({ ...f, expiry_date: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Supplier</label>
              <input className="form-input" value={restockForm.supplier} onChange={e => setRestockForm(f => ({ ...f, supplier: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Cost per Unit (₹)</label>
              <input type="number" min="0" step="0.01" className="form-input" value={restockForm.cost_per_unit} onChange={e => setRestockForm(f => ({ ...f, cost_per_unit: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows={2} className="form-input" value={restockForm.notes} onChange={e => setRestockForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
            <button type="button" onClick={() => setShowRestockModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={restockMutation.isPending} className="btn-primary">
              {restockMutation.isPending ? 'Recording…' : 'Record Restock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Adjust Stock Modal ─────────────────────────────── */}
      <Modal open={showAdjustModal} onClose={() => setShowAdjustModal(false)} title={`Adjust Stock — ${selectedMedicine?.generic_name || selectedMedicine?.name}`}>
        <form onSubmit={e => {
          e.preventDefault();
          adjustMutation.mutate({ id: selectedMedicine.id, body: { ...adjustForm, quantity_change: Number(adjustForm.quantity_change) } });
        }} className="space-y-4">
          <div className="alert-info text-xs">Use a positive number to increase stock, negative to decrease.</div>
          <div>
            <label className="form-label">Quantity Change *</label>
            <input required type="number" className="form-input" value={adjustForm.quantity_change}
              onChange={e => setAdjustForm(f => ({ ...f, quantity_change: e.target.value }))}
              placeholder="e.g. +10 or -5" />
          </div>
          <div>
            <label className="form-label">Reason *</label>
            <input required className="form-input" value={adjustForm.reason}
              onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Damaged stock removed, Count correction" />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea rows={2} className="form-input" value={adjustForm.notes}
              onChange={e => setAdjustForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
            <button type="button" onClick={() => setShowAdjustModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={adjustMutation.isPending} className="btn-primary">
              {adjustMutation.isPending ? 'Saving…' : 'Record Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
