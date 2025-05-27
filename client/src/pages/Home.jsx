import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSidebar } from "../context/SidebarContext.jsx";
import { useModal } from "../context/ModalContext.jsx";

function Home() {
  const { user } = useSelector((state) => state.auth);
  const { openSidebar } = useSidebar();
  const { openModal } = useModal();

  const handleOpenSidebar = () => {
    openSidebar(
      <div>
        <h2 className="text-xl font-bold mb-2">Sidebar Content</h2>
        <p>This is a demo sidebar. Click outside or press Escape to close.</p>
      </div>
    );
  };

  const handleOpenModal = () => {
    openModal(
      <div>
        <h2 className="text-xl font-bold mb-2">Modal Content</h2>
        <p>This is a demo modal. Click outside or press Escape to close.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          {/* Main Logo */}
          <div className="mx-auto mb-8 w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-white text-4xl font-bold">F!</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to Fauxigent
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Your intelligent companion for seamless authentication and user
            management. Experience the future of secure, modern web applications
            with our cutting-edge authentication system.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Secure Authentication
            </h3>
            <p className="text-gray-600">
              Advanced security with JWT tokens and encrypted sessions.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Lightning Fast
            </h3>
            <p className="text-gray-600">
              Optimized performance with modern React and Redux architecture.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              User Friendly
            </h3>
            <p className="text-gray-600">
              Intuitive interface designed for the best user experience.
            </p>
          </div>
        </div>

        {/* Demo Buttons for Sidebar and Modal */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition mb-4"
            onClick={handleOpenSidebar}
          >
            Open Sidebar
          </button>
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition mb-4"
            onClick={handleOpenModal}
          >
            Open Modal
          </button>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          {user ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-600 mb-6">
                Welcome back! Ready to continue?
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Go to Profile 
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  ></path>
                </svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-lg text-gray-600 mb-8">
                Ready to get started? Join thousands of users today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Get Started Free
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    ></path>
                  </svg>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-gray-300 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
        </div>
      </div>
    </div>
  );
}

export default Home;
