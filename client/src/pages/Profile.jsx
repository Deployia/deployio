import { useState } from "react";
import { useSelector } from "react-redux";

function Profile() {
  const [activeTab, setActiveTab] = useState("details");
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded shadow">
      {/* Profile image and user details */}
      <div className="flex flex-col items-center mb-8">
        <img
          src={
            user?.avatar ||
            "https://ui-avatars.com/api/?name=" + (user?.username || "User")
          }
          alt="Profile"
          className="w-24 h-24 rounded-full border mb-2"
        />
        <div className="text-center">
          <div className="font-bold text-lg">{user?.username || "User Name"}</div>
          <div className="text-gray-500">{user?.email || "user@email.com"}</div>
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
          <div>
            {/* Profile details form goes here */}
            <h2 className="text-xl font-bold mb-4">Update Profile Details</h2>
            {/* TODO: Add form fields for name, email, etc. */}
            <p>Profile details form coming soon.</p>
          </div>
        )}
        {activeTab === "password" && (
          <div>
            {/* Password update form goes here */}
            <h2 className="text-xl font-bold mb-4">Update Password</h2>
            {/* TODO: Add form fields for current password, new password, confirm password */}
            <p>Password update form coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
