import { useState, useEffect, useCallback } from "react";
import { FaUnlock, FaPlus, FaTimes } from "react-icons/fa";
import adminService from "@/services/adminService";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminDataTable from "@/components/admin/AdminDataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatDate, StatusBadge } from "@/utils/adminFormatters";
import { adminTokens } from "@/constants/adminDesignTokens";
import appToast from "@/utils/appToast";

const BLOCKLIST_CATEGORIES = [
  { value: "reserved", label: "Reserved slug" },
  { value: "abusive", label: "Abusive" },
  { value: "illegal", label: "Illegal / non-compliant" },
  { value: "custom", label: "Custom" },
];

const AdminSubdomains = () => {
  const [subdomains, setSubdomains] = useState([]);
  const [platformReserved, setPlatformReserved] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [baseDomain, setBaseDomain] = useState("");
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [blockTerm, setBlockTerm] = useState("");
  const [blockMatchType, setBlockMatchType] = useState("contains");
  const [blockCategory, setBlockCategory] = useState("custom");
  const [blockReason, setBlockReason] = useState("");
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState(null);

  const fetchPolicy = useCallback(async () => {
    setPolicyLoading(true);
    setPolicyError(null);
    try {
      const res = await adminService.getSubdomainBlocklist();
      if (res.success) {
        setPolicy(res.data);
        setBaseDomain(res.data.baseDomain || "");
        const combined = [
          ...(res.data.builtinReserved || []),
          ...(res.data.envReserved || []),
          ...(res.data.managedBlocklist || [])
            .filter((row) => row.matchType === "exact" && row.category === "reserved")
            .map((row) => row.term),
        ];
        setPlatformReserved([...new Set(combined)].sort());
      }
    } catch (err) {
      setPolicyError(err?.message || "Failed to load subdomain policy");
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  const fetchSubdomains = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, reservedRes] = await Promise.all([
        adminService.getSubdomains({
          page,
          limit: 20,
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
        if (reservedRes.data.policy) {
          setPolicy(reservedRes.data.policy);
        }
      }
    } catch (err) {
      console.error("Failed to fetch subdomains:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  useEffect(() => {
    const timer = setTimeout(fetchSubdomains, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchSubdomains, search]);

  const handleRelease = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      const res = await adminService.releaseSubdomain(confirm._id);
      if (!res?.success) {
        throw new Error(res?.message || "Release failed");
      }
      setConfirm(null);
      appToast.success(
        res.message || `Released "${confirm.subdomain}" — status is now released`,
      );
      await fetchSubdomains();
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to release subdomain";
      appToast.error(message);
      console.error("Release failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBlocklist = async (event) => {
    event.preventDefault();
    const term = blockTerm.trim();
    if (!term) return;

    setPolicyLoading(true);
    setPolicyError(null);
    try {
      await adminService.addSubdomainBlocklistEntry({
        term,
        matchType: blockMatchType,
        category: blockCategory,
        reason: blockReason.trim(),
      });
      setBlockTerm("");
      setBlockReason("");
      await fetchPolicy();
    } catch (err) {
      setPolicyError(
        err?.response?.data?.message || err?.message || "Failed to add entry",
      );
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleRemoveBlocklist = async (entryId) => {
    setPolicyLoading(true);
    setPolicyError(null);
    try {
      await adminService.removeSubdomainBlocklistEntry(entryId);
      await fetchPolicy();
    } catch (err) {
      setPolicyError(
        err?.response?.data?.message || err?.message || "Failed to remove entry",
      );
    } finally {
      setPolicyLoading(false);
    }
  };

  const columns = [
    {
      key: "subdomain",
      label: "Subdomain",
      render: (row) => (
        <span className="text-white font-mono text-sm">
          {row.subdomain}.{baseDomain || "deployio.tech"}
        </span>
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
        ["reserved", "active"].includes(row.status) ? (
          <button
            type="button"
            title="Release"
            onClick={() => setConfirm(row)}
            className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30"
          >
            <FaUnlock className="w-4 h-4" />
          </button>
        ) : null,
    },
  ];

  const managedEntries = policy?.managedBlocklist || [];
  const builtinBlocklist = policy?.builtinBlocklist || [];

  return (
    <div className={adminTokens.pageRoot}>
      <AdminPageHeader
        title="Subdomains"
        subtitle="Reservations, platform holds, and abusive-name policy"
      />

      <div className={`mb-6 ${adminTokens.glassCard} ${adminTokens.glassCardPadding}`}>
        <p className="text-sm text-gray-400 mb-3 body">Subdomain abuse policy</p>
        <p className="text-xs text-gray-500 mb-4">
          Exact matches block the full slug. Contains matches block any slug that includes the term
          (e.g. &quot;scam&quot; blocks &quot;my-scam-app&quot;). Built-in rules cannot be removed here.
        </p>

        {policyError && (
          <p className="text-sm text-red-400 mb-3">{policyError}</p>
        )}

        <form
          onSubmit={handleAddBlocklist}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-4"
        >
          <input
            type="text"
            value={blockTerm}
            onChange={(e) => setBlockTerm(e.target.value)}
            placeholder="term or slug"
            className="rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-sm text-white"
          />
          <select
            value={blockMatchType}
            onChange={(e) => setBlockMatchType(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-sm text-white"
          >
            <option value="contains">Contains</option>
            <option value="exact">Exact slug</option>
          </select>
          <select
            value={blockCategory}
            onChange={(e) => setBlockCategory(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-sm text-white"
          >
            {BLOCKLIST_CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Optional note"
            className="rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={policyLoading || !blockTerm.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <FaPlus className="w-3 h-3" />
            Add rule
          </button>
        </form>

        {managedEntries.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Admin-managed rules</p>
            <div className="flex flex-wrap gap-2">
              {managedEntries.map((row) => (
                <span
                  key={row._id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-neutral-800/50 border border-neutral-700/50 text-gray-300"
                >
                  <span className="font-mono">{row.term}</span>
                  <span className="text-gray-500">({row.matchType})</span>
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => handleRemoveBlocklist(row._id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {builtinBlocklist.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Built-in contains rules (read-only)</p>
            <div className="flex flex-wrap gap-2">
              {builtinBlocklist.map((row) => (
                <span
                  key={`${row.term}-${row.matchType}`}
                  className="px-2 py-1 text-xs rounded-full bg-neutral-900/60 border border-neutral-800 text-gray-500"
                >
                  {row.term}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {platformReserved.length > 0 && (
        <div className={`mb-6 ${adminTokens.glassCard} ${adminTokens.glassCardPadding}`}>
          <p className="text-sm text-gray-400 mb-2 body">
            Platform reserved ({baseDomain || "deployio.tech"})
          </p>
          <p className="text-xs text-gray-500 mb-2">
            From code defaults, PLATFORM_RESERVED_SUBDOMAINS env, and exact reserved admin rules.
          </p>
          <div className="flex flex-wrap gap-2">
            {platformReserved.map((s) => (
              <span
                key={s}
                className="px-2 py-1 text-xs rounded-full bg-neutral-800/50 border border-neutral-700/50 text-gray-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <AdminFilters
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search subdomain..."
        filters={[
          {
            key: "status",
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
            options: [
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "reserved", label: "Reserved" },
              { value: "hold", label: "Hold" },
              { value: "released", label: "Released" },
              { value: "expired", label: "Expired" },
            ],
          },
        ]}
      />
      <AdminDataTable
        columns={columns}
        rows={subdomains}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        rowKey="_id"
      />
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Release subdomain"
        message={`Release hold on "${confirm?.subdomain}"?`}
        confirmLabel="Release"
        loading={actionLoading}
        variant="primary"
        onConfirm={handleRelease}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default AdminSubdomains;
