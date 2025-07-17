import { useSelector } from "react-redux";
import { useCTAAuthModal } from "@/utils/AuthModal";
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
  const { showCTAAuthModal } = useCTAAuthModal();

  const handleClick = (e) => {
    if (disabled) return;

    if (!isAuthenticated) {
      e.preventDefault();
      showCTAAuthModal(ctaContext);
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
