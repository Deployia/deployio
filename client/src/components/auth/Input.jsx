const AuthInput = ({
  label,
  type = "text",
  required = false,
  error = null,
  icon: Icon,
  className = "",
  ...props
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={props.id || props.name}
          className="block text-xs sm:text-sm font-medium text-neutral-300"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-500" />
          </div>
        )}

        <input
          type={type}
          className={`w-full ${
            Icon ? "pl-8 sm:pl-10" : "pl-2.5 sm:pl-3"
          } pr-2.5 sm:pr-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg transition-all duration-200 bg-neutral-800/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-neutral-600 hover:border-neutral-500"
          }`}
          {...props}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-1 leading-tight" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthInput;
