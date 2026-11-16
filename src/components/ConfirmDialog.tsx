import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#DCE4DF] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                variant === 'danger'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-[#1B4332]/10 text-[#1B4332]'
              }`}
            >
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="confirm-dialog-title"
                className="font-display text-lg font-bold text-[#111C17]"
              >
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#4A5D54]">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup dialog konfirmasi"
            className="rounded-lg p-1.5 text-[#4A5D54] hover:bg-[#F2F6F4] hover:text-[#111C17]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-[#DCE4DF] bg-white px-4 py-2 text-sm font-medium text-[#111C17] hover:bg-[#F2F6F4] disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={
              variant === 'primary'
                ? { backgroundColor: 'var(--brand-primary)' }
                : undefined
            }
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60 whitespace-nowrap shrink-0 ${
              variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''
            }`}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
