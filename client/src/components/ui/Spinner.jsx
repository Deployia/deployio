import React from "react";

/**
 * Modern loading spinner component
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (sm, md, lg)
 * @param {string} props.color - Color theme (blue, green, white, etc.)
 * @param {string} props.className - Additional CSS classes
 */
const Spinner = ({ size = "md", color = "blue", className = "", ...props }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colorClasses = {
    blue: "border-blue-400 border-t-transparent",
    green: "border-green-400 border-t-transparent",
    white: "border-white border-t-transparent",
    neutral: "border-neutral-400 border-t-transparent",
    red: "border-red-400 border-t-transparent",
    yellow: "border-yellow-400 border-t-transparent",
  };

  return (
    <div
      className={`
        animate-spin rounded-full border-2 
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        ${className}
      `}
      {...props}
    />
  );
};

/**
 * Loading state component with spinner and text
 */
export const LoadingState = ({
  text = "Loading...",
  size = "md",
  color = "blue",
  className = "",
  textClassName = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <Spinner size={size} color={color} />
      <p className={`text-neutral-400 text-sm ${textClassName}`}>{text}</p>
    </div>
  );
};

/**
 * Inline loading spinner for buttons or small spaces
 */
export const InlineSpinner = ({ size = "sm", color = "white" }) => {
  return <Spinner size={size} color={color} />;
};

export default Spinner;
