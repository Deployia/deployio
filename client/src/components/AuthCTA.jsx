import { useSelector } from "react-redux";
import { useAuthActions } from "@/utils/authUtils";
import PropTypes from "prop-types";

/**
 * A wrapper component for CTAs that require authentication
 */
const AuthCTA = ({
  children,
  onClick,
  ctaContext = "default",
  className = "",
  disabled = false,
  ...props
}) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { redirectToAuth } = useAuthActions();

  const handleClick = (e) => {
    if (disabled) return;

    if (!isAuthenticated) {
      e.preventDefault();
      // Default to register for CTAs, but allow override via ctaContext
      const authType = ctaContext === "login" ? "login" : "register";
      redirectToAuth(authType);
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

AuthCTA.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  ctaContext: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default AuthCTA;
