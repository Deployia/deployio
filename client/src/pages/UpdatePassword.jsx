import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { updatePassword, reset } from "../redux/slices/authSlice";
import Spinner from "../components/Spinner";

function UpdatePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { currentPassword, newPassword, confirmPassword } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error, success } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }

    if (error && error.updatePassword) {
      toast.error(error.updatePassword);
    }

    if (success && success.updatePassword) {
      toast.success("Password updated successfully");
      navigate("/dashboard");
    }

    dispatch(reset());
  }, [isAuthenticated, error, success, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
    } else {
      const passwordData = {
        currentPassword,
        newPassword,
      };

      dispatch(updatePassword(passwordData));
    }
  };
  if (loading && loading.updatePassword) {
    return <Spinner />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Update Password</h2>

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="currentPassword"
            >
              Current Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              id="currentPassword"
              name="currentPassword"
              value={currentPassword}
              onChange={onChange}
              placeholder="Enter your current password"
              required
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="newPassword"
            >
              New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={onChange}
              placeholder="Enter your new password"
              required
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="confirmPassword"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              placeholder="Confirm your new password"
              required
            />
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
            >
              Update Password
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdatePassword;
