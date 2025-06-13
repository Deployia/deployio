import { useState } from "react";
import { FiTrash2, FiAlertTriangle } from "react-icons/fi";

const ConfirmDeleteModal = ({
  title,
  description,
  itemName,
  onConfirm,
  onCancel,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConfirmValid) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Delete operation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isConfirmValid = confirmText === "DELETE";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto h-16 w-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
          <FiAlertTriangle className="h-7 w-7 text-red-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400 mt-2">{description}</p>
          {itemName && (
            <p className="text-sm text-white font-medium mt-2 bg-neutral-800 px-3 py-2 rounded-lg">
              {itemName}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="confirm-text"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Type <span className="text-red-400 font-mono">DELETE</span> to
            confirm
          </label>
          <input
            id="confirm-text"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50"
            autoFocus
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading || !isConfirmValid}
            className="flex-1 min-h-[44px] px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <FiTrash2 className="h-4 w-4" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2.5 border border-neutral-600 text-gray-300 rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfirmDeleteModal;
