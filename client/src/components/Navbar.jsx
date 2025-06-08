import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { FaBars, FaTimes, FaSpinner } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        toast.success("Logged out successfully");
        navigate("/");
        setIsMobileMenuOpen(false);
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Disable logout button while logout is processing
  const isLoggingOut = loading && loading.logout;

  return (
    <header className="bg-black/90 backdrop-blur-sm border-b border-neutral-800 sticky top-0 z-50 body shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            onClick={closeMobileMenu}
          >
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-700 group-hover:border-neutral-600 transition-colors duration-200">
              <img src="/favicon.png" alt="DeployIO Logo" className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white heading group-hover:text-neutral-200 transition-colors duration-200">
              DeployIO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link
                      to="/profile"
                      className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 font-medium text-sm body"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/health"
                      className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 font-medium text-sm body"
                    >
                      Health
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={onLogout}
                      disabled={isLoggingOut}
                      className={`inline-flex items-center justify-center min-h-[44px] gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 font-medium text-sm body ${
                        isLoggingOut
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:shadow-lg"
                      }`}
                    >
                      {isLoggingOut ? (
                        <>
                          <FaSpinner className="w-4 h-4 animate-spin flex-shrink-0" />
                          <span>Logging out...</span>
                        </>
                      ) : (
                        "Logout"
                      )}
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      to="/auth/login"
                      className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 font-medium text-sm body"
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/auth/register"
                      className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-lg bg-white hover:bg-neutral-100 text-black transition-colors duration-200 font-medium text-sm body hover:shadow-lg"
                    >
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-600 transition-colors duration-200"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <FaTimes className="w-5 h-5" />
            ) : (
              <FaBars className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-neutral-800 animate-fade-in-down">
            <nav className="pt-4">
              <ul className="flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <li>
                      <Link
                        to="/profile"
                        onClick={closeMobileMenu}
                        className="flex items-center min-h-[44px] px-4 py-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 font-medium text-base body"
                      >
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/health"
                        onClick={closeMobileMenu}
                        className="flex items-center min-h-[44px] px-4 py-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 font-medium text-base body"
                      >
                        System Health
                      </Link>
                    </li>
                    <li className="pt-2 border-t border-neutral-800 mt-2">
                      <button
                        onClick={onLogout}
                        disabled={isLoggingOut}
                        className={`w-full flex items-center justify-center min-h-[44px] gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 font-medium text-base body ${
                          isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {isLoggingOut ? (
                          <>
                            <FaSpinner className="w-4 h-4 animate-spin flex-shrink-0" />
                            <span>Logging out...</span>
                          </>
                        ) : (
                          "Logout"
                        )}
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        to="/auth/login"
                        onClick={closeMobileMenu}
                        className="flex items-center min-h-[44px] px-4 py-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 font-medium text-base body"
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/auth/register"
                        onClick={closeMobileMenu}
                        className="flex items-center justify-center min-h-[44px] px-4 py-3 rounded-lg bg-white hover:bg-neutral-100 text-black transition-colors duration-200 font-medium text-base body"
                      >
                        Sign Up
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
