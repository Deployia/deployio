import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { toast } from "react-hot-toast";
import { FaSun, FaMoon, FaBars } from "react-icons/fa";
import { useSidebar } from "../context/SidebarContext.jsx";

function Navbar({ darkMode, toggleDarkMode }) {
  const { openSidebar } = useSidebar();
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

  const isLoggingOut = loading && loading.logout;

  // Content to render inside sidebar
  const sidebarContent = (
    <ul className="mt-6 space-y-4 text-[rgb(var(--text-primary))]">
      <li>
        <button
          onClick={toggleDarkMode}
          className="flex items-center p-2 rounded-md text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
        >
          {darkMode ? (
            <FaSun className="h-5 w-5 mr-2" />
          ) : (
            <FaMoon className="h-5 w-5 mr-2" />
          )}
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </li>
      {isAuthenticated ? (
        <>
          <li>
            <Link
              to="/profile"
              className="block p-2 rounded-md hover:bg-[rgb(var(--bg-hover))] transition-colors"
            >
              Profile
            </Link>
          </li>
          <li>
            <button
              onClick={onLogout}
              className="w-full text-left block p-2 rounded-md text-white bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 hover:from-green-500 hover:via-yellow-500 hover:to-red-500 transition-all"
            >
              Logout
            </button>
          </li>
        </>
      ) : (
        <>
          <li>
            <Link
              to="/auth/login"
              className="block p-2 rounded-md hover:bg-[rgb(var(--bg-hover))] transition-colors"
            >
              Login
            </Link>
          </li>
          <li>
            <Link
              to="/auth/register"
              className="block p-2 rounded-md text-white bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 hover:from-green-500 hover:via-yellow-500 hover:to-red-500 transition-all"
            >
              Sign Up
            </Link>
          </li>
        </>
      )}
    </ul>
  );

  return (
    <header className="bg-white dark:bg-black shadow-lg border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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
        {/* Mobile hamburger button */}
        <button
          className="md:hidden p-2 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] rounded-md focus:outline-none"
          onClick={() => openSidebar(sidebarContent)}
          aria-label="Open menu"
        >
          <FaBars className="h-6 w-6" />
        </button>
        <nav className="hidden md:block">
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
                    className={`btn-gradient px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all duration-200 ${
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
                    className="btn-gradient px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        {/* sidebar is managed by Sidebar component via context */}
      </div>
    </header>
  );
}

export default Navbar;
