import { motion } from "framer-motion";
import { adminTokens } from "@/constants/adminDesignTokens";

const AdminDistributionChart = ({
  title,
  subtitle,
  data = [],
  labelKey = "_id",
  emptyMessage = "No data available",
}) => {
  const items = data
    .filter((row) => row[labelKey] != null)
    .map((row) => ({
      label: String(row[labelKey]),
      count: row.count || 0,
    }));
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${adminTokens.chartCard} h-full`}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className={adminTokens.sectionTitle}>{title}</h3>
        {subtitle && <span className="text-sm text-gray-400 body hidden sm:inline">{subtitle}</span>}
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm body text-center py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white truncate flex-1 mr-2">{item.label}</span>
                <span className="text-gray-400 flex-shrink-0">{item.count}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((item.count / max) * 100, 100)}%`,
                    backgroundColor: `hsl(${index * 45}, 70%, 55%)`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminDistributionChart;
