import { motion } from "framer-motion";
import { adminTokens } from "@/constants/adminDesignTokens";

const AdminPageHeader = ({ title, subtitle, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
  >
    <div>
      <h1 className={adminTokens.pageTitle}>{title}</h1>
      {subtitle && <p className={adminTokens.pageSubtitle}>{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </motion.div>
);

export default AdminPageHeader;
