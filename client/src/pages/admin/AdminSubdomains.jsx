import { useState, useEffect, useCallback } from "react";
import { FaUnlock } from "react-icons/fa";
import adminService from "@/services/adminService";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminDataTable from "@/components/admin/AdminDataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatDate, StatusBadge } from "@/utils/adminFormatters";
import { adminTokens } from "@/constants/adminDesignTokens";

const AdminSubdomains = () => {
  const [subdomains, setSubdomains] = useState([]);
  const [platformReserved, setPlatformReserved] = useState([]);
  const [baseDomain, setBaseDomain] = useState("");
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubdomains = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, reservedRes] = await Promise.all([
        adminService.getSubdomains({
          page, limit: 20,
          search: search || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
        page === 1 ? adminService.getPlatformReservedSubdomains() : null,
      ]);
      if (listRes.success) {
        setSubdomains(listRes.data.subdomains);
        setPagination(listRes.data.pagination);
      }
      if (reservedRes?.success) {
        setPlatformReserved(reservedRes.data.reserved || []);
        setBaseDomain(reservedRes.data.baseDomain || "");
      }
    } catch (err) {
      console.error("Failed to fetch subdomains:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchSubdomains, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchSubdomains, search]);

  const handleRelease = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      await adminService.releaseSubdomain(confirm._id);
      setConfirm(null);
      fetchSubdomains();
    } catch (err) {
      console.error("Release failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: "subdomain",
      label: "Subdomain",
      render: (row) => (
        <span className="text-white font-mono text-sm">{row.subdomain}.{baseDomain || "deployio.tech"}</span>
      ),
    },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "project", label: "Project", render: (row) => row.project?.name || "—" },
    { key: "environment", label: "Environment", render: (row) => row.environment },
    { key: "deployment", label: "Deployment", render: (row) => row.deployment?.deploymentId || "—" },
    { key: "holdUntil", label: "Hold until", render: (row) => formatDate(row.holdUntil) },
    {
      key: "actions",
      label: "Actions",
      render: (row) =>
        ["reserved", "active", "hold"].includes(row.status) ? (
          <button type="button" title="Release" onClick={() => setConfirm(row)} className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30">
            <FaUnlock className="w-4 h-4" />
          </button>
        ) : null,
    },
  ];

  return (
    <div className={adminTokens.pageRoot}>
      <AdminPageHeader title="Subdomains" subtitle="Subdomain reservations and platform holds" />
      {platformReserved.length > 0 && (
        <div className={`mb-6 ${adminTokens.glassCard} ${adminTokens.glassCardPadding}`}>
          <p className="text-sm text-gray-400 mb-2 body">Platform reserved ({baseDomain})</p>
          <div className="flex flex-wrap gap-2">
            {platformReserved.map((s) => (
              <span key={s} className="px-2 py-1 text-xs rounded-full bg-neutral-800/50 border border-neutral-700/50 text-gray-300">{s}</span>
            ))}
          </div>
        </div>
      )}
      <AdminFilters
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search subdomain..."
        filters={[{
          key: "status", value: statusFilter,
          onChange: (v) => { setStatusFilter(v); setPage(1); },
          options: [
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "reserved", label: "Reserved" },
            { value: "hold", label: "Hold" },
            { value: "released", label: "Released" },
            { value: "expired", label: "Expired" },
          ],
        }]}
      />
      <AdminDataTable columns={columns} rows={subdomains} loading={loading} pagination={pagination} onPageChange={setPage} rowKey="_id" />
      <ConfirmDialog open={Boolean(confirm)} title="Release subdomain" message={`Release hold on "${confirm?.subdomain}"?`} confirmLabel="Release" loading={actionLoading} variant="primary" onConfirm={handleRelease} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default AdminSubdomains;
