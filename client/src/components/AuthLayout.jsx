import React from "react";
import { Outlet } from "react-router-dom";

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center body">
      {children || <Outlet />}
    </div>
  );
}

export default AuthLayout;
