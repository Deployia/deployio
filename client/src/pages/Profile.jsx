import { useDispatch, useSelector } from "react-redux";
import {
  updateProfile,
  updatePassword,
  resetUserState,
} from "../redux/slices/userSlice";
import { useEffect, useRef, useState } from "react";
import Spinner from "../components/Spinner";

function Profile() {
  const [activeTab, setActiveTab] = useState("details");
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    profileImage: null,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const fileInputRef = useRef();
  const dispatch = useDispatch();
  const { user, loading, error, success, passwordSuccess } = useSelector(
    (state) => state.user
  );
  const authUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (authUser) {
      setProfileForm((prev) => ({
        ...prev,
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        bio: authUser.bio || "",
      }));
    }
  }, [authUser]);

  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
      }));
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profileImage") {
      setProfileForm((prev) => ({ ...prev, profileImage: files[0] }));
    } else {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(profileForm).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    dispatch(updateProfile(formData));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    dispatch(
      updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
    );
  };

  useEffect(() => {
    return () => {
      dispatch(resetUserState());
    };
  }, [dispatch]);

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded shadow">
      {/* Profile image and user details */}
      <div className="flex flex-col items-center mb-8">
        <img
          src={
            user?.profileImage ||
            authUser?.profileImage ||
            "https://ui-avatars.com/api/?name=" + (authUser?.username || "User")
          }
          alt="Profile"
          className="w-24 h-24 rounded-full border mb-2"
        />
        <div className="text-center">
          <div className="font-bold text-lg">
            {authUser?.username || "User Name"}
          </div>
          <div className="text-gray-500">
            {authUser?.email || "user@email.com"}
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-semibold focus:outline-none border-b-2 transition-colors duration-200 ${
            activeTab === "details"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => setActiveTab("details")}
        >
          Profile Details
        </button>
        <button
          className={`ml-4 px-4 py-2 font-semibold focus:outline-none border-b-2 transition-colors duration-200 ${
            activeTab === "password"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => setActiveTab("password")}
        >
          Update Password
        </button>
      </div>
      <div>
        {activeTab === "details" && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Update Profile Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={profileForm.lastName}
                onChange={handleProfileChange}
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                className="mt-1 block w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Profile Image
              </label>
              <input
                type="file"
                name="profileImage"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleProfileChange}
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </div>
            {error && <div className="text-red-500">{error}</div>}
            {success && <div className="text-green-600">{success}</div>}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? <Spinner size={20} /> : "Update Profile"}
            </button>
          </form>
        )}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Update Password</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full border rounded px-3 py-2"
                required
              />
            </div>
            {error && <div className="text-red-500">{error}</div>}
            {passwordSuccess && (
              <div className="text-green-600">{passwordSuccess}</div>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? <Spinner size={20} /> : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
