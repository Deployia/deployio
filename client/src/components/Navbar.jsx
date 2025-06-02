import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { toast } from "react-hot-toast";
import { FaSun, FaMoon } from "react-icons/fa";

function Navbar({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        toast.success("Logged out successfully");
        navigate("/");
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  // Disable logout button while logout is processing
  const isLoggingOut = loading && loading.logout;
  return (
    // Apply themed background and border to header
    <header className="bg-[rgb(var(--bg-secondary))] shadow-lg border-b border-[rgb(var(--border-color))] flex-shrink-0">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          {/* Use favicon.png as logo */}
          <img
            src="/favicon.png"
            alt="DeployIO Logo"
            className={`h-8 w-8 mr-2 ${
              !darkMode ? "light-mode-favicon-invert" : ""
            }`}
          />
          <span className="text-xl font-bold text-[rgb(var(--text-primary))]">
            DeployIO
          </span>
        </Link>
        <nav>
          <ul className="flex items-center space-x-4 md:space-x-6">
            {/* Dark Mode Toggle Button - styling already updated */}
            <li>
              <button
                onClick={toggleDarkMode}
                // Ensure hover background and text color use theme variables
                className="p-2 rounded-full text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--accent-primary))] focus:outline-none transition-colors duration-200"
                aria-label={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {darkMode ? (
                  <FaSun className="h-5 w-5" />
                ) : (
                  <FaMoon className="h-5 w-5" />
                )}
              </button>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/profile"
                    // Ensure hover background and text color use theme variables
                    className="px-3 py-2 rounded-md text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors duration-200"
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <button
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    // Apply themed button styles (text color should be --text-button)
                    className={`px-4 py-2 rounded-md text-sm font-medium text-[rgb(var(--text-button))] bg-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--accent-secondary))] transition-colors duration-200 shadow-sm ${
                      isLoggingOut
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-md"
                    }`}
                  >
                    {isLoggingOut ? (
                      <div className="flex items-center space-x-2">
                        <svg
                          // Ensure spinner color matches button text
                          className="animate-spin h-4 w-4 text-[rgb(var(--text-button))]"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Logging out...</span>
                      </div>
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
                    // Ensure hover background and text color use theme variables
                    className="px-3 py-2 rounded-md text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors duration-200"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth/register"
                    // Apply themed button-like link styles (text color should be --text-button)
                    className="px-4 py-2 rounded-md text-sm font-medium text-[rgb(var(--text-button))] bg-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--accent-secondary))] transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
