import React from "react";
import { Outlet } from "react-router-dom";

function AuthLayout({ children }) {
  return (
    // Apply themed background to the AuthLayout container
    <div className="min-h-screen w-full bg-[rgb(var(--bg-primary))] flex flex-col items-center justify-center p-4">
      {children || <Outlet />}
    </div>
  );
}

export default AuthLayout;
