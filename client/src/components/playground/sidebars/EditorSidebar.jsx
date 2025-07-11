import { FaCode, FaBrain, FaBookOpen, FaLock, FaUnlock } from "react-icons/fa";

const EditorSidebar = ({ workspace }) => {
  return (
    <div className="p-4 space-y-4 custom-scrollbar">
      <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body">
        Code Insights
      </div>
      {workspace.activeFile ? (
        <div className="space-y-4">
          {/* File Information */}
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaCode className="w-4 h-4 text-blue-400" />
              <div className="text-sm font-semibold text-white heading">
                {workspace.activeFile.path?.split("/").pop() ||
                  "No file selected"}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs body mb-3">
              {workspace.activeFile.editable ? (
                <>
                  <FaUnlock className="text-green-400" />
                  <span className="text-green-400">Editable</span>
                </>
              ) : (
                <>
                  <FaLock className="text-red-400" />
                  <span className="text-red-400">Read-only DevOps Config</span>
                </>
              )}
            </div>
            <div className="text-xs text-neutral-300 body leading-relaxed">
              File type:{" "}
              <span className="text-blue-400 font-medium">
                {workspace.activeFile.path?.split(".").pop()?.toUpperCase() ||
                  "Unknown"}
              </span>
            </div>
            {workspace.activeFile.size && (
              <div className="text-xs text-neutral-300 body leading-relaxed mt-1">
                Size: {(workspace.activeFile.size / 1024).toFixed(1)} KB
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaBrain className="w-4 h-4 text-purple-400" />
              <div className="text-sm font-semibold text-white heading">
                AI Analysis
              </div>
            </div>
            <div className="text-xs text-neutral-300 body leading-relaxed">
              This file contains DevOps best practices and configurations. Learn
              from the structure and patterns used in modern deployments.
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
            <div className="text-sm font-semibold text-white heading mb-3">
              Quick Actions
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs body">
                <FaBrain className="w-3 h-3" />
                Analyze Code
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-xs body">
                <FaBookOpen className="w-3 h-3" />
                Learn More
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <FaBrain className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <div className="text-sm text-neutral-400 body mb-2">
            No file selected
          </div>
          <div className="text-xs text-neutral-500 body">
            Select a file from the explorer to get AI insights and code analysis
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorSidebar;
