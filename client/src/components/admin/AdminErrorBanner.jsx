import { FaExclamationTriangle } from "react-icons/fa";
import { adminTokens } from "@/constants/adminDesignTokens";

const AdminErrorBanner = ({ message }) => (
  <div className={adminTokens.errorBanner}>
    <FaExclamationTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
    <p className="text-red-300 text-sm body">{message}</p>
  </div>
);

export default AdminErrorBanner;
