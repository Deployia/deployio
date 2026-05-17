import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { LoadingGrid } from "@components/LoadingSpinner";
import { adminTokens } from "@/constants/adminDesignTokens";

const AdminDataTable = ({
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = "No records found",
  pagination,
  onPageChange,
  rowKey = "_id",
  onRowClick,
  selectedRowKey,
}) => {
  if (loading) {
    return <LoadingGrid columns={1} rows={3} />;
  }

  return (
    <div className={`${adminTokens.glassCard} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gray-500 body"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const key = row[rowKey] || row.id || index;
                const isSelected = selectedRowKey != null && selectedRowKey === key;
                return (
                <motion.tr
                  key={key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-neutral-800/30 transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-neutral-800/40" : "hover:bg-neutral-800/40"
                  } ${isSelected ? "bg-purple-500/10" : ""}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-300">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800/50">
          <p className="text-sm text-gray-400 body">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              className="p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-gray-300 hover:bg-neutral-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              className="p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-gray-300 hover:bg-neutral-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDataTable;
