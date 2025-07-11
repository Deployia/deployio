import { FaCode, FaFolderOpen } from "react-icons/fa";

const AnalysisSidebar = ({ workspace }) => {
  const settings = workspace?.settings || {
    securityAnalysis: true,
    performanceCheck: true,
    bestPractices: true,
    codeQuality: true,
  };

  return (
    <div className="p-4 space-y-4 custom-scrollbar">
      <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body">
        Analysis Settings
      </div>
      <div className="space-y-3">
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3">
            Code Quality
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                defaultChecked={settings.securityAnalysis}
                className="rounded"
              />
              <span className="text-neutral-300">Security Analysis</span>
            </label>
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                defaultChecked={settings.performanceCheck}
                className="rounded"
              />
              <span className="text-neutral-300">Performance Check</span>
            </label>
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                defaultChecked={settings.bestPractices}
                className="rounded"
              />
              <span className="text-neutral-300">Best Practices</span>
            </label>
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3">
            Analysis Scope
          </h4>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs body">
              <FaCode className="w-3 h-3" />
              Current File
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors text-xs body">
              <FaFolderOpen className="w-3 h-3" />
              Entire Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSidebar;
