import { X } from 'lucide-react';

/**
 * Simple modal wrapper.
 * Usage:
 *   <Modal open={show} onClose={() => setShow(false)} title="Create Deliverable">
 *     ... children ...
 *   </Modal>
 */
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-[#0c1427] border border-sky-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_25px_rgba(14,165,233,0.15)] w-full ${maxWidth} flex flex-col max-h-[90vh] text-white`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200/80">
          <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1 text-surface-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
