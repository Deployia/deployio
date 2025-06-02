import { Link } from "react-router-dom";

function NotFound() {
  return (
    // Apply themed background
    <div className="flex flex-col items-center justify-center h-full p-4 bg-[rgb(var(--bg-primary))]">
      {/* Apply themed text color */}
      <h1 className="text-6xl font-bold text-[rgb(var(--text-primary))] mb-4">
        404
      </h1>
      {/* Apply themed text color */}
      <h2 className="text-2xl font-semibold text-[rgb(var(--text-secondary))] mb-6">
        Page Not Found
      </h2>
      {/* Apply themed text color */}
      <p className="text-[rgb(var(--text-muted))] text-center mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="flex space-x-4">
        <Link
          to="/auth/login"
          // Apply themed button styles
          className="px-6 py-2 bg-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--accent-secondary))] text-white rounded-xl transition duration-200 shadow-lg hover:shadow-xl"
        >
          Go to Login
        </Link>
        <Link
          to="/"
          // Apply themed button styles
          className="px-6 py-2 bg-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--accent-secondary))] text-white rounded-xl transition duration-200 shadow-lg hover:shadow-xl"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
