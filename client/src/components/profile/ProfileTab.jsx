import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "@redux/slices/userSlice";
import activityLogger from "@/utils/activityLogger";
import { FaCamera, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";
import Spinner from "@components/Spinner";

const ProfileTab = ({
  profileForm,
  setProfileForm,
  authUser,
  handleRemoveProfileImage,
}) => {
  const fileInputRef = useRef();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.user);

  const handleProfileChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profileImage" && files?.[0]) {
      if (files[0].size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const loadingToastId = toast.loading("Uploading image...");
      const formData = new FormData();
      formData.append("profileImage", files[0]);

      // Add other form fields
      Object.entries(profileForm).forEach(([key, val]) => {
        if (key !== "profileImage" && val) formData.append(key, val);
      });
      dispatch(updateProfile(formData))
        .unwrap()
        .then(async () => {
          toast.success("Profile image updated successfully", {
            id: loadingToastId,
          });
          // Log activity
          await activityLogger.profileUpdate(["profileImage"]);
        })
        .catch((error) => {
          toast.error(`Failed to update image: ${error}`, {
            id: loadingToastId,
          });
        });
    } else {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(profileForm).forEach(([key, value]) => {
      if (value && key !== "profileImage") formData.append(key, value);
    });

    const loadingToastId = toast.loading("Updating profile...");
    dispatch(updateProfile(formData))
      .unwrap()
      .then(async () => {
        toast.success("Profile updated successfully", { id: loadingToastId });
        // Log activity with updated fields
        const updatedFields = Object.keys(profileForm).filter(
          (key) => profileForm[key] && key !== "profileImage"
        );
        await activityLogger.profileUpdate(updatedFields);
      })
      .catch((error) => {
        toast.error(`Failed to update profile: ${error}`, {
          id: loadingToastId,
        });
      });
  };
  return (
    <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
      <h3 className="text-xl font-semibold text-white mb-6">
        Profile Information
      </h3>

      <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* Profile Image */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {" "}
            <img
              src={
                authUser?.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  authUser?.username || "User"
                )}&background=4F46E5&color=ffffff&size=120`
              }
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-neutral-600"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              <FaCamera />
            </button>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              name="profileImage"
              accept="image/*"
              onChange={handleProfileChange}
              className="hidden"
            />{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 border border-neutral-600 text-gray-300 rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Change Photo
            </button>
            {authUser?.profileImage && (
              <button
                type="button"
                onClick={handleRemoveProfileImage}
                className="ml-3 px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {" "}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={profileForm.firstName}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-neutral-600 rounded-lg bg-neutral-800/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={profileForm.lastName}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-neutral-600 rounded-lg bg-neutral-800/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your last name"
            />
          </div>
        </div>{" "}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            name="bio"
            value={profileForm.bio}
            onChange={handleProfileChange}
            rows={4}
            className="w-full px-3 py-2 border border-neutral-600 rounded-lg bg-neutral-800/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Spinner size={20} /> : <FaSave />}
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default ProfileTab;
