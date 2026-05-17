import { useState, useEffect, useCallback } from "react";
import { FaExternalLinkAlt, FaStopCircle, FaTimesCircle } from "react-icons/fa";
import adminService from "@/services/adminService";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminDataTable from "@/components/admin/AdminDataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DeploymentPreviewIframe from "@/components/deployments/DeploymentPreviewIframe";
import { formatUserName, formatDate, StatusBadge } from "@/utils/adminFormatters";
import { getDeploymentUrl, isLiveForPreview } from "@/utils/deploymentPreview";
import { adminTokens } from "@/constants/adminDesignTokens";

const CANCELLABLE = ["pending", "queued", "cloning", "detecting", "building", "deploying", "running"];

const AdminDeployments = () => {
  const [deployments, setDeployments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);

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
      if (confirm.type === "cancel") await adminService.cancelDeployment(id);
      else await adminService.stopDeployment(id);
      setConfirm(null);
      setSelectedDeployment(null);
      fetchDeployments();
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRowClick = (row) => {
    setSelectedDeployment((prev) =>
      prev?._id === row._id ? null : row,
    );
  };

  const previewUrl = selectedDeployment
    ? getDeploymentUrl(selectedDeployment)
    : null;
  const showPreview = selectedDeployment && isLiveForPreview(selectedDeployment.status);

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
        selectedRowKey={selectedDeployment?._id}
      />

      {selectedDeployment && (
        <div className={`${adminTokens.glassCard} mt-4 p-4`}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-white font-mono text-sm">{selectedDeployment.deploymentId}</p>
                  <p className="text-gray-400 text-xs">
                    {selectedDeployment.project?.name || "—"} ·{" "}
                    <StatusBadge status={selectedDeployment.status} />
                  </p>
                </div>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300"
                  >
                    Open site
                    <FaExternalLinkAlt className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-gray-500 text-xs">
                {selectedDeployment.config?.subdomain}.deployio.tech ·{" "}
                {formatUserName(selectedDeployment.deployedBy)} ·{" "}
                {formatDate(selectedDeployment.createdAt)}
              </p>
            </div>
            {showPreview && (
              <div className="w-full lg:w-72 h-40 rounded-lg overflow-hidden border border-neutral-700/50 bg-neutral-900/50 shrink-0">
                <DeploymentPreviewIframe
                  deployment={selectedDeployment}
                  variant="mini"
                  pointerEventsNone
                />
              </div>
            )}
          </div>
        </div>
      )}

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
