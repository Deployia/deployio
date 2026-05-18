import { useState, useEffect, useCallback } from "react";
import adminService from "@/services/adminService";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminDataTable from "@/components/admin/AdminDataTable";
import RoleSelect from "@/components/admin/RoleSelect";
import { formatUserName, formatDate, StatusBadge } from "@/utils/adminFormatters";
import { adminTokens } from "@/constants/adminDesignTokens";
import appToast from "@/utils/appToast";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        page, limit: 10,
        search: search || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      });
      if (res.success) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers, search]);

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await adminService.updateUserRole(userId, role);
      if (!res?.success) {
        throw new Error(res?.message || "Failed to update role");
      }
      appToast.success(res.message || "User role updated");
      await fetchUsers();
    } catch (err) {
      appToast.error(
        err?.response?.data?.message || err?.message || "Failed to update role",
      );
    }
  };

  const columns = [
    {
      key: "user",
      label: "User",
      render: (row) => (
        <div>
          <p className="text-white font-medium">{formatUserName(row)}</p>
          <p className="text-gray-500 text-xs">{row.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <RoleSelect userId={row._id} currentRole={row.role} onRoleChange={handleRoleChange} />
      ),
    },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status || "active"} /> },
    { key: "createdAt", label: "Joined", render: (row) => formatDate(row.createdAt) },
    { key: "lastLogin", label: "Last login", render: (row) => formatDate(row.lastLogin) },
  ];

  return (
    <div className={adminTokens.pageRoot}>
      <AdminPageHeader title="Users" subtitle="Manage platform accounts and roles" />
      <AdminFilters
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name or email..."
        filters={[{
          key: "role", value: roleFilter,
          onChange: (v) => { setRoleFilter(v); setPage(1); },
          options: [
            { value: "all", label: "All roles" },
            { value: "user", label: "User" },
            { value: "admin", label: "Admin" },
          ],
        }]}
      />
      <AdminDataTable columns={columns} rows={users} loading={loading} pagination={pagination} onPageChange={setPage} rowKey="_id" />
    </div>
  );
};

export default AdminUsers;
