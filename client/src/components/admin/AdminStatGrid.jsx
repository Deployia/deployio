import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { adminTokens } from "@/constants/adminDesignTokens";

const StatCard = ({ stat, index }) => {
  const content = (
    <>
      <div className="flex items-center gap-3 mb-2">
        {stat.icon && (
          <div className={`p-2 rounded-lg ${stat.iconBg || "bg-blue-500/20"} group-hover:opacity-90 transition-colors`}>
            <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor || "text-blue-400"}`} />
          </div>
        )}
        <h3 className="text-gray-400 text-sm font-medium">{stat.label}</h3>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
      {stat.footnote && (
        <p className={`text-xs mt-2 ${stat.footnoteColor || "text-gray-400"}`}>{stat.footnote}</p>
      )}
      {stat.href && (
        <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
          <span>View</span>
          <FaArrowRight className="w-3 h-3" />
        </div>
      )}
    </>
  );
  const className = stat.href ? `${adminTokens.statCard} cursor-pointer group block` : adminTokens.statCard;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.05 }}>
      {stat.href ? <Link to={stat.href} className={className}>{content}</Link> : <div className={className}>{content}</div>}
    </motion.div>
  );
};

const AdminStatGrid = ({ stats = [], columns = 4 }) => {
  const gridClass = columns === 4
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8";
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={gridClass}>
      {stats.map((stat, index) => <StatCard key={stat.label} stat={stat} index={index} />)}
    </motion.div>
  );
};

export default AdminStatGrid;
