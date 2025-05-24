import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";

function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (error && error.me) {
      toast.error(error.me);
    }

    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, error, navigate, dispatch]);

  if (loading && loading.me) {
    return <Spinner />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Main F! Logo */}
        <div className="flex flex-col items-center">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-4">
            F!
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 tracking-wide">
            Welcome to Fauxigent
          </h2>
        </div>

        {/* User Info Card */}
        {user && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-gray-200">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user.username?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-center">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Welcome back,
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {user.username || user.email}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate("/update-password")}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 -right-8 w-20 h-20 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
