import { useState } from "react";
import { FaCode, FaFolderOpen, FaBrain, FaCog, FaShieldAlt, FaChartLine, FaDocker, FaGithub } from "react-icons/fa";
import { FiSettings, FiZap, FiCpu, FiRefreshCw } from "react-icons/fi";

const AnalysisSidebar = ({ workspace, onSettingsChange }) => {
  const [settings, setSettings] = useState(workspace?.settings || {
    // Analysis Types
    stackAnalysis: true,
    dependencyAnalysis: true,
    codeAnalysis: true,
    securityAnalysis: true,
    performanceCheck: true,
    
    // AI Enhancement
    llmEnhancement: true,
    includeInsights: true,
    includeRecommendations: true,
    explainNullFields: false,
    
    // Generation Options
    generateDockerfile: true,
    generateDockerCompose: true,
    generateGithubActions: true,
    
    // Analysis Scope
    analysisScope: 'full_project', // 'current_file' | 'full_project'
  });

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      stackAnalysis: true,
      dependencyAnalysis: true,
      codeAnalysis: true,
      securityAnalysis: true,
      performanceCheck: true,
      llmEnhancement: true,
      includeInsights: true,
      includeRecommendations: true,
      explainNullFields: false,
      generateDockerfile: true,
      generateDockerCompose: true,
      generateGithubActions: true,
      analysisScope: 'full_project',
    };
    setSettings(defaultSettings);
    if (onSettingsChange) {
      onSettingsChange(defaultSettings);
    }
  };

  return (
    <div className="p-4 space-y-4 custom-scrollbar h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body">
          Analysis Configuration
        </div>
        <button
          onClick={resetToDefaults}
          className="p-1 hover:bg-neutral-700 rounded text-neutral-500 hover:text-neutral-300 transition-colors"
          title="Reset to defaults"
        >
          <FiRefreshCw className="w-3 h-3" />
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Analysis Types */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3 flex items-center gap-2">
            <FiCpu className="w-4 h-4 text-blue-400" />
            Analysis Types
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.stackAnalysis}
                onChange={(e) => handleSettingChange('stackAnalysis', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <FaCode className="w-3 h-3 text-blue-400" />
              <span className="text-neutral-300">Technology Stack</span>
            </label>
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.dependencyAnalysis}
                onChange={(e) => handleSettingChange('dependencyAnalysis', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
              />
              <FiZap className="w-3 h-3 text-purple-400" />
              <span className="text-neutral-300">Dependencies</span>
            </label>
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.codeAnalysis}
                onChange={(e) => handleSettingChange('codeAnalysis', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-green-500 focus:ring-green-500 focus:ring-offset-0"
              />
              <FaChartLine className="w-3 h-3 text-green-400" />
              <span className="text-neutral-300">Code Quality</span>
            </label>
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.securityAnalysis}
                onChange={(e) => handleSettingChange('securityAnalysis', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-red-500 focus:ring-red-500 focus:ring-offset-0"
              />
              <FaShieldAlt className="w-3 h-3 text-red-400" />
              <span className="text-neutral-300">Security Scan</span>
            </label>
          </div>
        </div>

        {/* AI Enhancement */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3 flex items-center gap-2">
            <FaBrain className="w-4 h-4 text-purple-400" />
            AI Enhancement
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.llmEnhancement}
                onChange={(e) => handleSettingChange('llmEnhancement', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
              />
              <span className="text-neutral-300">LLM Enhancement</span>
            </label>
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.includeInsights}
                onChange={(e) => handleSettingChange('includeInsights', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className="text-neutral-300">Include Insights</span>
            </label>
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.includeRecommendations}
                onChange={(e) => handleSettingChange('includeRecommendations', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-green-500 focus:ring-green-500 focus:ring-offset-0"
              />
              <span className="text-neutral-300">Recommendations</span>
            </label>
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.explainNullFields}
                onChange={(e) => handleSettingChange('explainNullFields', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0"
              />
              <span className="text-neutral-300">Explain Missing Data</span>
            </label>
          </div>
        </div>

        {/* Configuration Generation */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3 flex items-center gap-2">
            <FiSettings className="w-4 h-4 text-green-400" />
            Generate Configs
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.generateDockerfile}
                onChange={(e) => handleSettingChange('generateDockerfile', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <FaDocker className="w-3 h-3 text-blue-400" />
              <span className="text-neutral-300">Dockerfile</span>
            </label>
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.generateDockerCompose}
                onChange={(e) => handleSettingChange('generateDockerCompose', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
              />
              <FaCog className="w-3 h-3 text-purple-400" />
              <span className="text-neutral-300">Docker Compose</span>
            </label>
            <label className="flex items-center gap-2 text-xs body">
              <input
                type="checkbox"
                checked={settings.generateGithubActions}
                onChange={(e) => handleSettingChange('generateGithubActions', e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-green-500 focus:ring-green-500 focus:ring-offset-0"
              />
              <FaGithub className="w-3 h-3 text-green-400" />
              <span className="text-neutral-300">GitHub Actions</span>
            </label>
          </div>
        </div>

        {/* Analysis Scope */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3">
            Analysis Scope
          </h4>
          <div className="space-y-2">
            <button 
              onClick={() => handleSettingChange('analysisScope', 'current_file')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs body ${
                settings.analysisScope === 'current_file'
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                  : 'bg-neutral-800/30 border border-neutral-700/30 text-neutral-400 hover:bg-neutral-700/50 hover:text-neutral-300'
              }`}
            >
              <FaCode className="w-3 h-3" />
              Current File
            </button>
            <button 
              onClick={() => handleSettingChange('analysisScope', 'full_project')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs body ${
                settings.analysisScope === 'full_project'
                  ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                  : 'bg-neutral-800/30 border border-neutral-700/30 text-neutral-400 hover:bg-neutral-700/50 hover:text-neutral-300'
              }`}
            >
              <FaFolderOpen className="w-3 h-3" />
              Entire Project
            </button>
          </div>
        </div>

        {/* Analysis Stats */}
        {workspace?.lastAnalysis && (
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white heading mb-3">
              Last Analysis
            </h4>
            <div className="space-y-2 text-xs text-neutral-400 body">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-400">Complete</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="text-white">
                  {workspace.analysisResults?.confidence_score 
                    ? `${Math.round(workspace.analysisResults.confidence_score * 100)}%`
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="text-white">
                  {new Date(workspace.lastAnalysis).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisSidebar;
