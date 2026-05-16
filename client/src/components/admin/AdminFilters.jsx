import { motion } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import { adminTokens } from "@/constants/adminDesignTokens";

const AdminFilters = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${adminTokens.glassCard} ${adminTokens.glassCardPadding} mb-6`}
  >
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${adminTokens.input} pl-10`}
        />
      </div>
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className={adminTokens.select}
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  </motion.div>
);

export default AdminFilters;
