import { useDispatch, useSelector } from "react-redux";
import {
  updateProfile,
  updatePassword,
  resetUserState,
} from "../redux/slices/userSlice";
import { useEffect, useRef, useState } from "react";
import Spinner from "../components/Spinner";
import { useSearchParams } from "react-router-dom";
import { FaPen } from "react-icons/fa";

function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "details";
  const [activeTab, setActiveTab] = useState(initialTab);
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
  const isOAuthUser = !!authUser?.googleId;

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
    if (isOAuthUser) {
      alert("Password update is not allowed for OAuth users.");
      return;
    }
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

  // Handle tab change and update search params
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    return () => {
      dispatch(resetUserState());
    };
  }, [dispatch]);
  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white text-center">
              Profile Settings
            </h1>
          </div>

          {/* Profile image and user details */}
          <div className="px-8 py-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <img
                  src={
                    user?.profileImage ||
                    authUser?.profileImage ||
                    "https://ui-avatars.com/api/?name=" +
                      (authUser?.username || "User")
                  }
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-purple-100 shadow-lg mb-2"
                />
                <button
                  type="button"
                  className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-purple-50 border border-purple-200 transition-all duration-200"
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                  aria-label="Change profile image"
                >
                  <FaPen className="text-purple-600 w-3 h-3" />
                </button>
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleProfileChange}
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <div className="font-bold text-xl text-white">
                  {authUser?.username || "User Name"}
                </div>
                <div className="text-slate-500 text-sm">
                  {authUser?.email || "user@email.com"}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-purple-100 mb-8">
              <button
                className={`px-6 py-3 font-semibold focus:outline-none border-b-2 transition-all duration-200 rounded-t-lg ${
                  activeTab === "details"
                    ? "border-purple-500 text-purple-600 bg-purple-50"
                    : "border-transparent text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                }`}
                onClick={() => handleTabChange("details")}
              >
                Profile Details
              </button>
              {!isOAuthUser && (
                <button
                  className={`ml-4 px-6 py-3 font-semibold focus:outline-none border-b-2 transition-all duration-200 rounded-t-lg ${
                    activeTab === "password"
                      ? "border-purple-500 text-purple-600 bg-purple-50"
                      : "border-transparent text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                  }`}
                  onClick={() => handleTabChange("password")}
                >
                  Update Password
                </button>
              )}
            </div>

            <div>
              {activeTab === "details" && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <h2 className="text-xl font-bold mb-6 text-white">
                    Update Profile Details
                  </h2>
                  <div>
                    {" "}
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={profileForm.firstName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Bio
                    </label>{" "}
                    <textarea
                      name="bio"
                      value={profileForm.bio}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                      rows={3}
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl">
                      {success}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={loading}
                  >
                    {loading ? <Spinner size={20} /> : "Update Profile"}
                  </button>
                </form>
              )}
              {activeTab === "password" && !isOAuthUser && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <h2 className="text-xl font-bold mb-6 text-white">
                    Update Password
                  </h2>
                  {isOAuthUser && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded-xl font-semibold">
                      Password update is not allowed for OAuth users.
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl">
                      {passwordSuccess}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={loading || isOAuthUser}
                  >
                    {loading ? <Spinner size={20} /> : "Update Password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
