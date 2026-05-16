import { useState } from "react";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";

/**
 * Confirmation content for the global Modal shell (Modal.jsx).
 * Do not add an outer card, border, or negative margins — the shell provides those.
 */
const DangerConfirmModal = ({
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmDisabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  const disabled = isLoading || confirmDisabled;

  return (
    <div className="w-full min-w-[280px] max-w-md">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex-shrink-0 p-2.5 bg-red-500/15 border border-red-500/30 rounded-lg">
            <FaExclamationTriangle className="w-5 h-5 text-red-400" aria-hidden />
          </div>
          <h3 className="text-lg font-semibold text-white leading-snug pt-0.5">
            {title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-shrink-0 p-1 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 rounded-md hover:bg-neutral-800"
          aria-label="Close"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      <div className="text-sm text-neutral-300 leading-relaxed mb-6">{children}</div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-neutral-600 text-neutral-200 hover:bg-neutral-800 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={disabled}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? "Please wait..." : confirmLabel}
        </button>
      </div>
    </div>
  );
};

export default DangerConfirmModal;
