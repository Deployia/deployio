import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import SEO from "@components/SEO";
import WizardNavigation from "@components/project-creation/WizardNavigation";
import ProviderSelection from "@components/project-creation/ProviderSelection";
import RepositoryBrowser from "@components/project-creation/RepositoryBrowser";
import BranchSelection from "@components/project-creation/BranchSelection";
import DockerfileSelection from "@components/project-creation/DockerfileSelection";
import AnalysisProgress from "@components/project-creation/AnalysisProgress";
import SmartProjectForm from "@components/project-creation/SmartProjectForm";
import ProjectReview from "@components/project-creation/ProjectReview";
import {
  completeStep,
  updateStep,
  resetWizard,
  completeWizard,
  setSelectedProvider,
  createProjectFromState,
} from "@redux/slices/projectCreationSlice";
import {
  fetchConnectedProviders,
  selectConnectedProviders,
} from "@redux/slices/gitProviderSlice";

const CreateProject = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { currentStep, completedSteps, stepData, loading, error, isCompleted } =
    useSelector((state) => state.projectCreation);
  const connectedProviders = useSelector(selectConnectedProviders);
  const githubConnection = connectedProviders.find(
    (provider) => provider.provider === "github",
  );

  // const { } = useSelector((state) => state.auth);

  // Initialize session on component mount
  useEffect(() => {
    dispatch(fetchConnectedProviders());

    // Cleanup on unmount
    return () => {
      if (!isCompleted) {
        dispatch(resetWizard());
      }
    };
  }, [dispatch, isCompleted]);

  useEffect(() => {
    if (githubConnection && currentStep === 1) {
      dispatch(setSelectedProvider("github"));
      dispatch(completeStep(1));
      dispatch(updateStep({ step: 2 }));
    }
  }, [dispatch, githubConnection, currentStep]);

  // Handle step navigation
  const canProceedToNext = () => {
    // Step gating logic - validate before allowing next step
    switch (currentStep) {
      case 1: // Git Provider
        return stepData.selectedProvider;
      case 2: // Repository
        return stepData.selectedRepository && stepData.selectedRepository.name;
      case 3: // Branch
        return stepData.selectedBranch;
      case 4: // Dockerfile
        return (
          stepData.selectedDockerfile?.path &&
          stepData.selectedDockerfile?.isValid !== false &&
          stepData.dockerfileDiscoveryStatus === "completed" &&
          (stepData.dockerfiles || []).some((df) => df.isValid)
        );
      case 5: // Analysis
        return (
          (stepData.analysisStatus === "completed" &&
            stepData.analysisResults?.deployable !== false) ||
          (stepData.analysisStatus === "failed" &&
            stepData.allowManualConfiguration)
        );
      case 6: // Configuration
        return true; // Form is always valid
      case 7: // Review
        return false; // Final step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceedToNext()) {
      console.warn(
        `Cannot proceed from step ${currentStep}. Validation failed.`,
      );
      return;
    }
    if (currentStep < 7) {
      dispatch(updateStep({ step: currentStep + 1 }));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      dispatch(updateStep({ step: currentStep - 1 }));
    }
  };

  const handleStepClick = (step) => {
    // Only allow navigation to completed steps or the next step
    if (completedSteps.includes(step) || step === currentStep) {
      dispatch(updateStep({ step }));
    }
  };

  // Handle wizard completion - creates project and navigates
  const handleComplete = async () => {
    try {
      const result = await dispatch(createProjectFromState()).unwrap();

      // Mark wizard as complete
      dispatch(completeWizard());

      // Navigate to project details or dashboard
      if (result?.projectId) {
        navigate(`/dashboard/projects/${result.projectId}`);
      } else {
        navigate("/dashboard/projects");
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      // Error will be displayed by the error display section
    }
  };

  // Handle back to dashboard
  const handleBack = () => {
    navigate("/dashboard/projects");
  };

  // Wizard steps configuration
  const steps = [
    {
      id: 1,
      title: "Git Provider",
      description: "Choose your Git provider",
      component: ProviderSelection,
      aiEnhanced: false,
    },
    {
      id: 2,
      title: "Repository",
      description: "Select your repository",
      component: RepositoryBrowser,
      aiEnhanced: false,
    },
    {
      id: 3,
      title: "Branch & Settings",
      description: "Configure analysis settings",
      component: BranchSelection,
      aiEnhanced: true,
    },
    {
      id: 4,
      title: "Dockerfile",
      description: "Select service to deploy",
      component: DockerfileSelection,
      aiEnhanced: false,
    },
    {
      id: 5,
      title: "Analysis",
      description: "Analyzing your codebase",
      component: AnalysisProgress,
      aiEnhanced: false,
    },
    {
      id: 6,
      title: "Project Configuration",
      description: "Configure your project",
      component: SmartProjectForm,
      aiEnhanced: true,
    },
    {
      id: 7,
      title: "Review & Deploy",
      description: "Review and create project",
      component: ProjectReview,
      aiEnhanced: false,
    },
  ];

  const CurrentStepComponent = steps[currentStep - 1]?.component;

  return (
    <>
      <SEO page="create-project" />

      <div className="min-h-screen">
        {/* Header - Mobile Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/50 backdrop-blur-md border-b border-neutral-800/50 p-4 sm:p-6"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors text-sm sm:text-base"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Projects</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="w-px h-6 bg-neutral-700 hidden sm:block"></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Create New Project
                </h1>
                <p className="text-neutral-400 text-xs sm:text-sm">
                  AI-powered project setup with intelligent configuration
                </p>
              </div>
            </div>

            {/* Session Info */}
          </div>
        </motion.div>

        {/* Wizard Navigation */}
        <WizardNavigation
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        {/* Main Content - Mobile Responsive */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 sm:mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3"
              >
                <FaExclamationTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium text-sm sm:text-base">
                    Error
                  </p>
                  <p className="text-red-300 text-xs sm:text-sm">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step Content */}
          <div className="bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 rounded-lg">
            <AnimatePresence mode="wait">
              {CurrentStepComponent && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 sm:p-6 lg:p-8"
                >
                  <CurrentStepComponent
                    stepData={stepData}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onComplete={handleComplete}
                    loading={loading}
                    error={error}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Controls - Mobile Responsive */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`
                flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all w-full sm:w-auto text-sm sm:text-base
                ${
                  currentStep === 1
                    ? "bg-neutral-800/50 text-neutral-600 cursor-not-allowed"
                    : "bg-neutral-800 hover:bg-neutral-700 text-white"
                }
              `}
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2 text-sm text-neutral-400 order-first sm:order-none">
              <span>
                Step {currentStep} of {steps.length}
              </span>
            </div>

            <button
              onClick={currentStep === 7 ? handleComplete : handleNext}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors w-full sm:w-auto text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : currentStep === 7 ? (
                <>
                  <FaCheckCircle className="w-4 h-4" />
                  <span>Create Project</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <FaArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CreateProject;
