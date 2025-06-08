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
        <h2 className="text-xl font-bold mb-2 text-white">Sidebar Content</h2>
        <p className="text-gray-300">
          This is a demo sidebar. Click outside or press Escape to close.
        </p>
      </div>
    );
  };
  const handleOpenModal = () => {
    openModal(
      <div>
        <h2 className="text-xl font-bold mb-2 text-white">Modal Content</h2>
        <p className="text-gray-300">
          This is a demo modal. Click outside or press Escape to close.
        </p>
      </div>
    );
  };
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-4xl mx-auto bg-neutral-900/80 border border-neutral-800 rounded-2xl shadow-lg p-6 md:p-10 mt-8 mb-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-700">
            <img src="/favicon.png" alt="logo" className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-white heading">
            Welcome to DeployIO
          </h1>
          <p className="text-base text-neutral-400 max-w-2xl mx-auto leading-tight body">
            Your intelligent companion for seamless authentication and user
            management. Experience the future of secure, modern web
            applications.
          </p>
        </div>
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-5 bg-neutral-800/80 rounded-xl border border-neutral-700 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 border border-neutral-700 bg-neutral-900">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 heading">
              Secure Authentication
            </h3>
            <p className="text-sm text-neutral-400 body">
              Advanced security with JWT tokens and encrypted sessions.
            </p>
          </div>
          <div className="p-5 bg-neutral-800/80 rounded-xl border border-neutral-700 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 border border-neutral-700 bg-neutral-900">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 heading">
              Lightning Fast
            </h3>
            <p className="text-sm text-neutral-400 body">
              Optimized performance with modern React and Redux architecture.
            </p>
          </div>
          <div className="p-5 bg-neutral-800/80 rounded-xl border border-neutral-700 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 border border-neutral-700 bg-neutral-900">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 heading">
              User Friendly
            </h3>
            <p className="text-sm text-neutral-400 body">
              Intuitive interface designed for the best user experience.
            </p>
          </div>
        </div>
        {/* Demo Buttons for Sidebar and Modal */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-neutral-700 text-white border border-neutral-600 rounded-lg font-semibold text-base hover:bg-neutral-600 hover:border-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 body"
            onClick={handleOpenSidebar}
          >
            Open Sidebar
          </button>
          <button
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-neutral-700 text-white border border-neutral-600 rounded-lg font-semibold text-base hover:bg-neutral-600 hover:border-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 body"
            onClick={handleOpenModal}
          >
            Open Modal
          </button>
        </div>
        {/* CTA Section */}
        <div className="text-center flex flex-col items-center justify-center">
          {user ? (
            <div className="space-y-3 body">
              <p className="text-base text-neutral-400 mb-4 body">
                Welcome back! Ready to continue?
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center justify-center min-h-[44px] gap-2 px-6 py-3 bg-purple-700 text-white font-semibold rounded-lg border border-purple-800 hover:bg-purple-800 hover:border-white transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20 text-base body"
              >
                Go to Profile
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-4 body">
              <p className="text-base text-neutral-400 mb-5 body">
                Ready to get started? Join thousands of users today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center body">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center justify-center min-h-[44px] gap-2 px-6 py-3 bg-purple-700 text-white font-semibold rounded-lg border border-purple-800 hover:bg-purple-800 hover:border-white transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20 text-base body"
                >
                  Get Started Free
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
                <Link
                  to="/auth/login"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-white text-black border border-neutral-700 font-semibold rounded-lg hover:bg-neutral-100 hover:border-white transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-neutral-300 text-base body"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
