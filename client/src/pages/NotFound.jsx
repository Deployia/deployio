import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-300 mb-6">
        Page Not Found
      </h2>
      <p className="text-gray-400 text-center mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="flex space-x-4">
        <Link
          to="/auth/login"
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl transition duration-200 shadow-lg hover:shadow-xl"
        >
          Go to Login
        </Link>
        <Link
          to="/"
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl transition duration-200 shadow-lg hover:shadow-xl"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
