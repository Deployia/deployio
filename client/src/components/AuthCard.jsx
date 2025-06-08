import React from "react";
import { FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";

const AuthCard = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-purple-400",
  children,
  error = null,
  success = null,
  maxWidth = "max-w-xl",
}) => {
  return (
    <div className={`${maxWidth} w-full mx-auto px-4 sm:px-0`}>
      <div className="p-4 sm:p-6 backdrop-blur-lg rounded-xl border border-neutral-700 shadow-lg bg-neutral-900/70 hover:bg-neutral-900 transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 sm:gap-0">
          <div className="flex items-center">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center mr-3 bg-purple-600/20 ${iconColor} flex-shrink-0`}
            >
              {Icon && <Icon className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-white heading truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Status Indicator */}
          {(error || success) && (
            <div
              className={`px-3 py-1.5 rounded-lg flex items-center text-sm self-start sm:self-auto ${
                error
                  ? "bg-red-900/30 border border-red-700/30"
                  : "bg-green-900/30 border border-green-700/30"
              }`}
            >
              {error ? (
                <>
                  <FaExclamationTriangle className="mr-2 text-red-400 flex-shrink-0" />
                  <span className="text-red-300">Error</span>
                </>
              ) : (
                <>
                  <FaInfoCircle className="mr-2 text-green-400 flex-shrink-0" />
                  <span className="text-green-300">Success</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error/Success Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-400 mr-2 flex-shrink-0" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
            <div className="flex items-center">
              <FaInfoCircle className="text-green-400 mr-2 flex-shrink-0" />
              <span className="text-green-300 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
};

export default AuthCard;
