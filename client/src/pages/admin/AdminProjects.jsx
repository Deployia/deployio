import { useState, useEffect, useCallback } from "react";
import { FaArchive, FaTrash } from "react-icons/fa";
import adminService from "@/services/adminService";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminDataTable from "@/components/admin/AdminDataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatUserName, formatDate, StatusBadge } from "@/utils/adminFormatters";
import { adminTokens } from "@/constants/adminDesignTokens";

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getProjects({
        page, limit: 10,
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      if (res.success) {
        setProjects(res.data.projects);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchProjects, search]);

  const runAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === "archive") await adminService.archiveProject(confirm.id);
      else await adminService.deleteProject(confirm.id);
      setConfirm(null);
      fetchProjects();
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Project",
      render: (row) => (
        <div>
          <p className="text-white font-medium">{row.name}</p>
          <p className="text-gray-500 text-xs">{row.slug}</p>
        </div>
      ),
    },
    { key: "owner", label: "Owner", render: (row) => formatUserName(row.owner) },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">]
          {row.status !== "archived" && (
            <button type="button" title="Archive" onClick={() => setConfirm({ type: "archive", id: row._id, name: row.name })} className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30">
              <FaArchive className="w-4 h-4" />
            </button>
          )}
          <button type="button" title="Delete" onClick={() => setConfirm({ type: "delete", id: row._id, name: row.name })} className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30">
            <FaTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={adminTokens.pageRoot}>
      <AdminPageHeader title="Projects" subtitle="View and manage all platform projects" />
      <AdminFilters
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search projects..."
        filters={[{
          key: "status", value: statusFilter,
          onChange: (v) => { setStatusFilter(v); setPage(1); },
          options: [
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
          ],
        }]}
      />
      <AdminDataTable columns={columns} rows={projects} loading={loading} pagination={pagination} onPageChange={setPage} rowKey="_id" />
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === "archive" ? "Archive project" : "Delete project"}
        message={confirm?.type === "archive" ? `Archive "${confirm?.name}"? Active deployments will be stopped.` : `Permanently delete "${confirm?.name}" and all related deployments?`}
        confirmLabel={confirm?.type === "archive" ? "Archive" : "Delete"}
        loading={actionLoading}
        onConfirm={runAction}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default AdminProjects;
