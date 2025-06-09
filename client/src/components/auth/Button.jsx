import Spinner from "../Spinner";

const AuthButton = ({
  type = "button",
  variant = "primary", // primary, secondary, outline
  size = "md", // sm, md, lg
  loading = false,
  disabled = false,
  children,
  className = "",
  icon: Icon,
  ...props
}) => {
  const baseClasses =
    "flex justify-center items-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 min-h-[44px]";

  const variants = {
    primary:
      "text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-600 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed",
    outline:
      "text-neutral-300 bg-transparent hover:bg-neutral-800/50 border border-neutral-600 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed",
    danger:
      "text-white bg-red-600 hover:bg-red-700 border border-red-600 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm sm:text-base",
    lg: "px-6 py-3 text-base sm:text-lg",
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading ? (
        <Spinner size={size === "sm" ? 16 : size === "lg" ? 24 : 20} />
      ) : (
        <>
          {Icon && <Icon className="flex-shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
};

export default AuthButton;
