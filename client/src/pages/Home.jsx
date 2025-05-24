import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

function Home() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to RouteMate
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your complete solution for route planning and management. Streamline
            your operations with our robust authentication system.
          </p>
        </div>

        <div className="flex justify-center mt-8">
          {user ? (
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-md text-lg font-semibold transition duration-200"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex gap-4">
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-md text-lg font-semibold transition duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 py-3 px-8 rounded-md text-lg font-semibold transition duration-200"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
