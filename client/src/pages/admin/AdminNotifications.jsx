import { useState, useEffect, useCallback } from "react";
import { FaPaperPlane } from "react-icons/fa";
import adminService from "@/services/adminService";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataTable from "@/components/admin/AdminDataTable";
import { formatUserName, formatDate } from "@/utils/adminFormatters";
import { adminTokens } from "@/constants/adminDesignTokens";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: "", message: "", type: "general.announcement",
    systemWide: true, userId: "", priority: "normal",
  });
  const [feedback, setFeedback] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getNotifications({ page, limit: 20 });
      if (res.success) {
        setNotifications(res.data.notifications);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      const res = await adminService.sendNotification({
        title: form.title, message: form.message, type: form.type, priority: form.priority,
        systemWide: form.systemWide,
        userId: form.systemWide ? undefined : form.userId,
      });
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setForm((f) => ({ ...f, title: "", message: "" }));
        fetchNotifications();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to send" });
    } finally {
      setSending(false);
    }
  };

  const columns = [
    { key: "type", label: "Type", render: (row) => <span className="text-xs font-mono text-gray-300">{row.type}</span> },
    { key: "title", label: "Title", render: (row) => row.title },
    { key: "user", label: "Recipient", render: (row) => formatUserName(row.user) },
    { key: "priority", label: "Priority", render: (row) => row.priority },
    { key: "createdAt", label: "Sent", render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div className={adminTokens.pageRoot}>
      <AdminPageHeader title="Notifications" subtitle="Send announcements and review recent notifications" />
      <form onSubmit={handleSend} className={`mb-6 space-y-4 ${adminTokens.glassCard} ${adminTokens.glassCardPadding}`}>
        <h2 className={`${adminTokens.sectionTitle} flex items-center gap-2`}>
          <FaPaperPlane className="w-4 h-4 text-blue-400" />
          Send notification
        </h2>
        {feedback && (
          <p className={`text-sm body ${feedback.type === "success" ? "text-green-400 bg-green-500/20 border border-green-500/30 rounded-lg p-3" : "text-red-300 bg-red-500/20 border border-red-500/30 rounded-lg p-3"}`}>{feedback.text}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1 body">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={adminTokens.input} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1 body">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={adminTokens.select}>
              <option value="general.announcement">general.announcement</option>
              <option value="system.maintenance">system.maintenance</option>
              <option value="system.update">system.update</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1 body">Message</label>
          <textarea required rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={adminTokens.input} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-300 body">
            <input type="checkbox" checked={form.systemWide} onChange={(e) => setForm({ ...form, systemWide: e.target.checked })} />
            Send to all users
          </label>
          {!form.systemWide && (
            <input required placeholder="User ID (MongoDB ObjectId)" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className={`flex-1 min-w-[200px] text-sm ${adminTokens.input}`} />
          )}
          <button type="submit" disabled={sending} className={`${adminTokens.primaryButton} disabled:opacity-50`}>{sending ? "Sending..." : "Send"}</button>
        </div>
      </form>
      <h2 className={`${adminTokens.sectionTitle} mb-4`}>Recent notifications</h2>
      <AdminDataTable columns={columns} rows={notifications} loading={loading} pagination={pagination} onPageChange={setPage} rowKey="_id" />
    </div>
  );
};

export default AdminNotifications;
