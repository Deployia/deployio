import DangerConfirmModal from "@components/common/DangerConfirmModal";

const DisconnectProviderModal = ({ providerName, onConfirm, onCancel }) => (
  <DangerConfirmModal
    title={`Disconnect ${providerName}`}
    confirmLabel="Disconnect"
    cancelLabel="Cancel"
    onConfirm={onConfirm}
    onCancel={onCancel}
  >
    <p>
      Are you sure you want to disconnect{" "}
      <span className="font-medium text-white">{providerName}</span>? You will
      no longer be able to import repositories or trigger deployments from this
      provider until you reconnect.
    </p>
  </DangerConfirmModal>
);

export default DisconnectProviderModal;
