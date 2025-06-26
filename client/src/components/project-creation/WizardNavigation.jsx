import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaGithub,
  FaCodeBranch,
  FaBrain,
  FaCogs,
  FaRocket,
} from "react-icons/fa";

const WizardNavigation = ({ steps, currentStep, completedSteps, onStepClick }) => {
  // Step icons mapping
  const stepIcons = {
    1: FaGithub,
    2: FaCodeBranch,
    3: FaCogs,
    4: FaBrain,
    5: FaCogs,
    6: FaRocket,
  };

  // AI confidence color mapping
  const getConfidenceColor = (confidence) => {
    if (!confidence) return "bg-neutral-400";
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStepStatus = (stepIndex) => {
    const stepNumber = stepIndex + 1;
    
    if (completedSteps.includes(stepNumber)) {
      return "completed";
    }
    if (stepNumber === currentStep) {
      return "current";
    }
    if (stepNumber < currentStep) {
      return "completed";
    }
    return "pending";
  };

  const getStepClasses = (status, isClickable) => {
    const baseClasses = `
      relative flex items-center justify-center w-12 h-12 rounded-full
      border-2 transition-all duration-300 font-medium text-sm
      ${isClickable ? 'cursor-pointer' : 'cursor-default'}
    `;

    switch (status) {
      case "completed":
        return `${baseClasses} bg-green-500 border-green-500 text-white hover:bg-green-600`;
      case "current":
        return `${baseClasses} bg-blue-600 border-blue-600 text-white ring-4 ring-blue-600/20`;
      default:
        return `${baseClasses} bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600`;
    }
  };

  const getConnectorClasses = (stepIndex) => {
    const isCompleted = completedSteps.includes(stepIndex + 1) || currentStep > stepIndex + 1;
    return `
      h-0.5 flex-1 transition-colors duration-300
      ${isCompleted ? 'bg-green-500' : 'bg-neutral-700'}
    `;
  };

  return (
    <div className="bg-neutral-900/30 backdrop-blur-sm border-b border-neutral-800/50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const status = getStepStatus(index);
            const isClickable = completedSteps.includes(stepNumber) || stepNumber === currentStep;
            const StepIcon = stepIcons[stepNumber];

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={getStepClasses(status, isClickable)}
                    onClick={() => isClickable && onStepClick(stepNumber)}
                  >
                    {status === "completed" ? (
                      <FaCheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}

                    {/* AI Confidence Indicator */}
                    {step.aiEnhanced && status === "completed" && (
                      <div
                        className={`
                          absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-neutral-900
                          ${getConfidenceColor(0.85)} // This would come from actual AI confidence
                        `}
                        title="AI Confidence: High"
                      />
                    )}

                    {/* Current step pulse effect */}
                    {status === "current" && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-blue-400"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Step Title and Description */}
                  <div className="mt-3 text-center min-w-0">
                    <p
                      className={`
                        text-sm font-medium transition-colors
                        ${status === "current" 
                          ? "text-blue-400" 
                          : status === "completed" 
                          ? "text-green-400" 
                          : "text-neutral-400"
                        }
                      `}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4 hidden md:block">
                    <div className={getConnectorClasses(index)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Step Indicator */}
        <div className="mt-4 md:hidden">
          <div className="flex items-center justify-center space-x-2">
            {steps.map((_, index) => {
              const stepNumber = index + 1;
              const status = getStepStatus(index);
              
              return (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-colors
                    ${status === "completed" 
                      ? "bg-green-500" 
                      : status === "current" 
                      ? "bg-blue-500" 
                      : "bg-neutral-700"
                    }
                  `}
                />
              );
            })}
          </div>
          <div className="text-center mt-2">
            <p className="text-sm text-neutral-300">
              {steps[currentStep - 1]?.title}
            </p>
            <p className="text-xs text-neutral-500">
              Step {currentStep} of {steps.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardNavigation;
