import { useState, useEffect, useCallback } from "react";
import { FaExternalLinkAlt, FaStopCircle, FaTimesCircle } from "react-icons/fa";
import adminService from "@/services/adminService";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminDataTable from "@/components/admin/AdminDataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DeploymentLivePreview from "@/components/deployments/DeploymentLivePreview";
import { formatUserName, formatDate, StatusBadge } from "@/utils/adminFormatters";
import { getDeploymentUrl, isLiveForPreview } from "@/utils/deploymentPreview";
import { adminTokens } from "@/constants/adminDesignTokens";
import appToast from "@/utils/appToast";

const CANCELLABLE = ["pending", "queued", "cloning", "detecting", "building", "deploying", "running"];

const AdminDeploymentPreviewCell = ({ deployment }) => {
  const previewUrl = getDeploymentUrl(deployment);
  if (!isLiveForPreview(deployment?.status) || !previewUrl) {
    return <span className="text-gray-600 text-xs">—</span>;
  }

  return (
    <div
      className="w-[200px] sm:w-[240px]"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-2 py-1 border-b border-neutral-800/80">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Live</span>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
          >
            Open
            <FaExternalLinkAlt className="w-2.5 h-2.5" />
          </a>
        </div>
        <div className="h-32">
          <DeploymentLivePreview
            deployment={deployment}
            variant="mini"
            pointerEventsNone
            title={`admin-preview-${deployment.deploymentId || deployment._id}`}
          />
        </div>
      </div>
    </div>
  );
};

const AdminDeployments = () => {
  const [deployments, setDeployments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState(null);

  const fetchDeployments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getDeployments({
        page, limit: 20,
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      if (res.success) {
        setDeployments(res.data.deployments);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch deployments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchDeployments, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchDeployments, search]);

  const runAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      const id = confirm.deploymentId || confirm._id;
      const res =
        confirm.type === "cancel"
          ? await adminService.cancelDeployment(id)
          : await adminService.stopDeployment(id);
      if (!res?.success) {
        throw new Error(res?.message || "Action failed");
      }
      setConfirm(null);
      setSelectedDeploymentId(null);
      appToast.success(res.message || "Deployment updated");
      await fetchDeployments();
    } catch (err) {
      appToast.error(
        err?.response?.data?.message || err?.message || "Action failed",
      );
      console.error("Action failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRowClick = (row) => {
    const id = row._id || row.id;
    setSelectedDeploymentId((prev) => (prev === id ? null : id));
  };

  const columns = [
    {
      key: "deploymentId",
      label: "Deployment",
      render: (row) => (
        <div>
          <p className="text-white font-mono text-xs">{row.deploymentId}</p>
          <p className="text-gray-500 text-xs">{row.config?.subdomain}.deployio.tech</p>
        </div>
      ),
    },
    { key: "project", label: "Project", render: (row) => row.project?.name || "—" },
    { key: "deployedBy", label: "User", render: (row) => formatUserName(row.deployedBy) },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "environment", label: "Env", render: (row) => row.config?.environment || "—" },
    { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
    {
      key: "preview",
      label: "Preview",
      render: (row) => <AdminDeploymentPreviewCell deployment={row} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {CANCELLABLE.includes(row.status) && row.status !== "running" && (
            <button type="button" title="Cancel" onClick={() => setConfirm({ type: "cancel", ...row })} className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30">
              <FaTimesCircle className="w-4 h-4" />
            </button>
          )}
          {row.status === "running" && (
            <button type="button" title="Stop" onClick={() => setConfirm({ type: "stop", ...row })} className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30">
              <FaStopCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={adminTokens.pageRoot}>
      <AdminPageHeader title="Deployments" subtitle="Monitor and manage deployments across the platform" />
      <AdminFilters
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search subdomain or deployment id..."
        filters={[{
          key: "status", value: statusFilter,
          onChange: (v) => { setStatusFilter(v); setPage(1); },
          options: [
            { value: "all", label: "All statuses" },
            { value: "running", label: "Running" },
            { value: "building", label: "Building" },
            { value: "deploying", label: "Deploying" },
            { value: "failed", label: "Failed" },
            { value: "stopped", label: "Stopped" },
            { value: "cancelled", label: "Cancelled" },
          ],
        }]}
      />
      <AdminDataTable
        columns={columns}
        rows={deployments}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        rowKey="_id"
        onRowClick={handleRowClick}
        selectedRowKey={selectedDeploymentId}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === "cancel" ? "Cancel deployment" : "Stop deployment"}
        message={`${confirm?.type === "cancel" ? "Cancel" : "Stop"} deployment ${confirm?.deploymentId}?`}
        confirmLabel={confirm?.type === "cancel" ? "Cancel" : "Stop"}
        loading={actionLoading}
        onConfirm={runAction}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default AdminDeployments;
