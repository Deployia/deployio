import React from "react";
import { Outlet } from "react-router-dom";

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-purple-50 to-violet-100 flex flex-col items-center justify-center">
      {children || <Outlet />}
    </div>
  );
}

export default AuthLayout;
