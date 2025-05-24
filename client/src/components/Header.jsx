import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { toast } from "react-toastify";

function Header() {
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
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          Auth Template
        </Link>

        <nav>
          {" "}
          <ul className="flex space-x-6">
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className="hover:text-blue-200 transition duration-200"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <button
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className={`hover:text-blue-200 transition duration-200 ${
                      isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-blue-200 transition duration-200"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="hover:text-blue-200 transition duration-200"
                  >
                    Register
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

export default Header;
