import { Outlet, Link } from "react-router-dom";
import { FaHome, FaArrowLeft } from "react-icons/fa";

function AuthLayout({ children }) {
  return (
    <div className="h-full overflow-auto body bg-gradient-to-b from-black to-neutral-900">
      {/* Back to Home Link */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link
          to="/"
          className="group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 text-sm font-medium"
        >
          <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform duration-200" />
          <FaHome className="text-sm" />
          <span className="hidden sm:inline">Back to Home</span>
        </Link>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-6">
        <div className="w-full max-w-6xl mx-auto">{children || <Outlet />}</div>
      </div>
    </div>
  );
}

export default AuthLayout;
