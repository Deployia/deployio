import { motion, AnimatePresence } from "framer-motion";
import { FaExclamationTriangle } from "react-icons/fa";
import { adminTokens } from "@/constants/adminDesignTokens";

const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "danger", loading = false, onConfirm, onCancel }) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onCancel}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className={`${adminTokens.modalPanel} max-w-md w-full`}>
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2 rounded-lg ${variant === "danger" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
              <FaExclamationTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white heading">{title}</h3>
              <p className="text-gray-400 text-sm mt-1 body">{message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-neutral-800/50 transition-colors">{cancelLabel}</button>
            <button type="button" onClick={onConfirm} disabled={loading} className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${variant === "danger" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"}`}>{loading ? "Processing..." : confirmLabel}</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
export default ConfirmDialog;
