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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          Welcome to your Dashboard
        </h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Profile Information</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="mb-2">
              <span className="font-medium">Name:</span> {user?.name}
            </p>
            <p className="mb-2">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-medium">Account created:</span>{" "}
              {new Date(user?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => navigate("/update-password")}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
