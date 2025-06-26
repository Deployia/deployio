import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaCodeBranch,
  FaClock,
  FaUser,
  FaSpinner,
  FaBrain,
  FaCogs,
  FaShieldAlt,
  FaRocket,
  FaCheckCircle,
} from "react-icons/fa";
import {
  fetchBranches,
  setSelectedBranch,
  setAnalysisSettings,
  completeStep,
} from "@redux/slices/projectCreationSlice";

const BranchSelection = ({ stepData, onNext, loading }) => {
  const dispatch = useDispatch();
  const [selectedBranch, setLocalSelectedBranch] = useState(stepData.selectedBranch);
  const [analysisSettings, setLocalAnalysisSettings] = useState(stepData.analysisSettings);

  // Fetch branches when component mounts
  useEffect(() => {
    if (stepData.selectedRepository) {
      const { provider, owner, name } = stepData.selectedRepository;
      dispatch(fetchBranches({ provider, owner, repo: name }));
    }
  }, [dispatch, stepData.selectedRepository]);

  const handleBranchSelect = (branch) => {
    setLocalSelectedBranch(branch);
    dispatch(setSelectedBranch(branch));
  };

  const handleAnalysisSettingChange = (key, value) => {
    const newSettings = { ...analysisSettings, [key]: value };
    setLocalAnalysisSettings(newSettings);
    dispatch(setAnalysisSettings(newSettings));
  };

  const handleContinue = () => {
    if (selectedBranch) {
      dispatch(completeStep(3));
      onNext();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const analysisTypes = [
    {
      id: 'stack',
      name: 'Stack Detection',
      description: 'Identify frameworks, languages, and tech stack',
      icon: FaCogs,
      color: 'text-blue-500',
      recommended: true,
    },
    {
      id: 'dependencies',
      name: 'Dependency Analysis',
      description: 'Analyze package dependencies and versions',
      icon: FaShieldAlt,
      color: 'text-green-500',
      recommended: true,
    },
    {
      id: 'quality',
      name: 'Code Quality',
      description: 'Code quality metrics and suggestions',
      icon: FaRocket,
      color: 'text-purple-500',
      recommended: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCodeBranch className="w-8 h-8 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Branch & Analysis Settings
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Select the branch to analyze and configure AI analysis settings. 
            Our AI will examine your code to generate optimal deployment configurations.
          </p>
        </motion.div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Branch Selection */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FaCodeBranch className="w-5 h-5 text-purple-500" />
            <span>Select Branch</span>
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="ml-3 text-neutral-400">Loading branches...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {stepData.branches.map((branch, index) => {
                const isSelected = selectedBranch?.name === branch.name;
                const isDefault = branch.isDefault;

                return (
                  <motion.div
                    key={branch.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer
                      ${isSelected 
                        ? 'bg-purple-500/10 border-purple-500/50 ring-2 ring-purple-500/20' 
                        : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                      }
                    `}
                    onClick={() => handleBranchSelect(branch)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-white">
                            {branch.name}
                          </h4>
                          {isDefault && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                              Default
                            </span>
                          )}
                        </div>

                        {branch.lastCommit && (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-neutral-300 truncate">
                              {branch.lastCommit.message}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-neutral-400">
                              <div className="flex items-center space-x-1">
                                <FaUser className="w-3 h-3" />
                                <span>{branch.lastCommit.author}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FaClock className="w-3 h-3" />
                                <span>{formatDate(branch.lastCommit.date)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                        >
                          <FaCheckCircle className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Analysis Settings */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FaBrain className="w-5 h-5 text-blue-500" />
            <span>AI Analysis Settings</span>
          </h3>

          <div className="space-y-6">
            {/* Analysis Types */}
            <div>
              <h4 className="text-sm font-medium text-neutral-300 mb-3">
                Analysis Types
              </h4>
              <div className="space-y-3">
                {analysisTypes.map((type) => {
                  const Icon = type.icon;
                  const isEnabled = analysisSettings.analysisTypes.includes(type.id);

                  return (
                    <div
                      key={type.id}
                      className={`
                        p-3 rounded-lg border transition-all duration-300 cursor-pointer
                        ${isEnabled 
                          ? 'bg-blue-500/10 border-blue-500/30' 
                          : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                        }
                      `}
                      onClick={() => {
                        const newTypes = isEnabled
                          ? analysisSettings.analysisTypes.filter(t => t !== type.id)
                          : [...analysisSettings.analysisTypes, type.id];
                        handleAnalysisSettingChange('analysisTypes', newTypes);
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-neutral-800 ${type.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-medium text-white">
                              {type.name}
                            </h5>
                            {type.recommended && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-400 mt-1">
                            {type.description}
                          </p>
                        </div>
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center
                          ${isEnabled 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-neutral-600'
                          }
                        `}>
                          {isEnabled && (
                            <FaCheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analysis Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-neutral-300">
                Analysis Options
              </h4>

              {/* Force LLM Analysis */}
              <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                <div>
                  <h5 className="font-medium text-white">Enhanced AI Analysis</h5>
                  <p className="text-sm text-neutral-400">
                    Use advanced AI models for deeper code analysis
                  </p>
                </div>
                <button
                  onClick={() => handleAnalysisSettingChange('forceLlm', !analysisSettings.forceLlm)}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${analysisSettings.forceLlm ? 'bg-blue-500' : 'bg-neutral-600'}
                  `}
                >
                  <div className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${analysisSettings.forceLlm ? 'translate-x-7' : 'translate-x-1'}
                  `} />
                </button>
              </div>

              {/* Include Recommendations */}
              <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                <div>
                  <h5 className="font-medium text-white">Include Recommendations</h5>
                  <p className="text-sm text-neutral-400">
                    Get AI-powered optimization suggestions
                  </p>
                </div>
                <button
                  onClick={() => handleAnalysisSettingChange('includeRecommendations', !analysisSettings.includeRecommendations)}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${analysisSettings.includeRecommendations ? 'bg-blue-500' : 'bg-neutral-600'}
                  `}
                >
                  <div className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${analysisSettings.includeRecommendations ? 'translate-x-7' : 'translate-x-1'}
                  `} />
                </button>
              </div>

              {/* Track Progress */}
              <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                <div>
                  <h5 className="font-medium text-white">Real-time Progress</h5>
                  <p className="text-sm text-neutral-400">
                    Show detailed analysis progress updates
                  </p>
                </div>
                <button
                  onClick={() => handleAnalysisSettingChange('trackProgress', !analysisSettings.trackProgress)}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${analysisSettings.trackProgress ? 'bg-blue-500' : 'bg-neutral-600'}
                  `}
                >
                  <div className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${analysisSettings.trackProgress ? 'translate-x-7' : 'translate-x-1'}
                  `} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleContinue}
          disabled={!selectedBranch || loading}
          className={`
            px-8 py-3 rounded-lg font-medium transition-all
            ${selectedBranch && !loading
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }
          `}
        >
          Start AI Analysis
        </button>
      </div>
    </div>
  );
};

export default BranchSelection;
