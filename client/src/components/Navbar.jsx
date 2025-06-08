import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { toast } from "react-hot-toast";

function Navbar() {
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
    <header className="bg-black border-b border-neutral-800 flex-shrink-0 body">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-700">
            <span className="text-white text-lg font-bold heading">F!</span>
          </div>
          <span className="text-xl font-bold text-white heading">DeployIO</span>
        </Link>

        <nav>
          <ul className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/profile"
                    className="px-4 py-2 rounded-xl text-gray-300 hover:bg-gray-700 transition-all duration-200 font-semibold body"
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <button
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className={`px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all duration-200 font-semibold body ${
                      isLoggingOut
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-xl"
                    }`}
                  >
                    {isLoggingOut ? (
                      <div className="flex items-center space-x-2">
                        <svg
                          className="animate-spin h-4 w-4"
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
                    className="px-4 py-2 rounded-xl text-gray-300 hover:bg-gray-700 transition-all duration-200 font-semibold body"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth/register"
                    className="px-6 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black transition-all duration-200 font-semibold body"
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
