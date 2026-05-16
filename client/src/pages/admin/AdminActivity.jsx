import { useState, useEffect, useCallback } from "react";
import adminService from "@/services/adminService";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminDataTable from "@/components/admin/AdminDataTable";
import { formatDate, StatusBadge } from "@/utils/adminFormatters";
import { adminTokens } from "@/constants/adminDesignTokens";

const AdminActivity = () => {
  const [activity, setActivity] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getActivity({
        page, limit: 50,
        action: actionFilter || undefined,
        category: categoryFilter === "all" ? undefined : categoryFilter,
      });
      if (res.success) {
        setActivity(res.data.activity);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch activity:", err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchActivity, actionFilter ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchActivity, actionFilter]);

  const columns = [
    { key: "action", label: "Action", render: (row) => <span className="text-white font-mono text-xs">{row.action}</span> },
    { key: "category", label: "Category", render: (row) => row.category },
    { key: "severity", label: "Severity", render: (row) => <StatusBadge status={row.severity} /> },
    { key: "result", label: "Result", render: (row) => row.result },
    { key: "actor", label: "Actor", render: (row) => row.actor?.email || row.actor?.username || row.actor?.type || "—" },
    { key: "target", label: "Target", render: (row) => row.target?.name ? `${row.target.type}: ${row.target.name}` : row.target?.type || "—" },
    { key: "createdAt", label: "Time", render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div className={adminTokens.pageRoot}>
      <AdminPageHeader title="Activity" subtitle="Audit log of platform events" />
      <AdminFilters
        searchValue={actionFilter}
        onSearchChange={(v) => { setActionFilter(v); setPage(1); }}
        searchPlaceholder="Filter by action..."
        filters={[{
          key: "category", value: categoryFilter,
          onChange: (v) => { setCategoryFilter(v); setPage(1); },
          options: [
            { value: "all", label: "All categories" },
            { value: "authentication", label: "Authentication" },
            { value: "authorization", label: "Authorization" },
            { value: "data", label: "Data" },
            { value: "system", label: "System" },
            { value: "security", label: "Security" },
          ],
        }]}
      />
      <AdminDataTable columns={columns} rows={activity} loading={loading} pagination={pagination} onPageChange={setPage} rowKey="_id" emptyMessage="No activity recorded yet" />
    </div>
  );
};

export default AdminActivity;
