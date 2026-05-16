import { useState } from "react";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";

const DisconnectProviderModal = ({
  providerName,
  onConfirm,
  onCancel,
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

  return (
    <div className="w-full max-w-md -m-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <FaExclamationTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white heading">
            Disconnect {providerName}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      <p className="text-gray-300 text-sm mb-6 leading-relaxed body">
        Are you sure you want to disconnect{" "}
        <span className="font-medium text-white">{providerName}</span>? You will
        no longer be able to import repositories or trigger deployments from this
        provider until you reconnect.
      </p>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm transition-colors disabled:opacity-50"
        >
          {isLoading ? "Disconnecting..." : "Disconnect"}
        </button>
      </div>
    </div>
  );
};

export default DisconnectProviderModal;
