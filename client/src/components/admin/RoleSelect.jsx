import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

const RoleSelect = ({ userId, currentRole, onRoleChange, disabled = false }) => {
  const [pendingRole, setPendingRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const newRole = e.target.value;
    if (newRole !== currentRole) {
      setPendingRole(newRole);
    }
  };

  const handleConfirm = async () => {
    if (!pendingRole) return;
    setLoading(true);
    try {
      await onRoleChange(userId, pendingRole);
      setPendingRole(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <select
        value={currentRole}
        onChange={handleChange}
        disabled={disabled || loading}
        className="bg-neutral-700/50 border border-neutral-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>

      <ConfirmDialog
        open={Boolean(pendingRole)}
        title="Change user role"
        message={`Change this user's role to "${pendingRole}"?`}
        confirmLabel="Update role"
        loading={loading}
        variant="primary"
        onConfirm={handleConfirm}
        onCancel={() => setPendingRole(null)}
      />
    </>
  );
};

export default RoleSelect;
