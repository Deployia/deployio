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
    <div className="h-full  overflow-hidden body relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 39px, #BDC 39px, #BDC 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, #BDC 39px, #BDC 40px)
          `,
          backgroundSize: "40px 40px",
          backgroundColor: "#000",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.20) 30%, rgba(0,0,0,0.01) 100%)",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.20) 40%, rgba(0,0,0,0.01) 100%)",
        }}
      />
      <div className="h-full flex flex-col px-6 py-4 relative z-10">
        {/* Header Section - Compact */}
        <div className="text-center mb-4 flex-shrink-0">
          {/* Main Logo - Smaller */}
          <div className="mx-auto mb-3 w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-700">
            <img src="/favicon.png" alt="logo" className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-white heading">
            Welcome to DeployIO
          </h1>{" "}
          <p className="text-base text-neutral-400 max-w-2xl mx-auto leading-tight body">
            Your intelligent companion for seamless authentication and user
            management. Experience the future of secure, modern web
            applications.
          </p>
        </div>{" "}
        {/* Feature Cards - Compact and Consistent */}
        <div className="grid md:grid-cols-3 gap-4 mb-4 max-w-4xl mx-auto flex-shrink-0 body">
          <div className="p-4 backdrop-blur-lg rounded-xl border border-neutral-700 body">
            <div className="w-10 h-10  rounded-lg flex items-center justify-center mb-3 border ">
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
              </svg>{" "}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 heading">
              Secure Authentication
            </h3>
            <p className="text-sm text-neutral-400 body">
              Advanced security with JWT tokens and encrypted sessions.
            </p>
          </div>
          <div className=" p-4 backdrop-blur-lg rounded-xl border border-neutral-700 body">
            <div className="w-10 h-10  rounded-lg flex items-center justify-center mb-3 ">
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
              </svg>{" "}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 heading">
              Lightning Fast
            </h3>
            <p className="text-sm text-neutral-400 body">
              Optimized performance with modern React and Redux architecture.
            </p>
          </div>
          <div className="backdrop-blur-lg p-4 rounded-xl border border-neutral-700 body">
            <div className="w-10 h-10  rounded-lg flex items-center justify-center mb-3 border ">
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
              </svg>{" "}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 heading">
              User Friendly
            </h3>
            <p className="text-sm text-neutral-400 body">
              Intuitive interface designed for the best user experience.
            </p>
          </div>
        </div>{" "}
        {/* Demo Buttons for Sidebar and Modal - Compact */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6 flex-shrink-0 body">
          <button
            className="bg-neutral-800 text-white border border-neutral-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-neutral-800 hover:border-white transition-all duration-200 body"
            onClick={handleOpenSidebar}
          >
            Open Sidebar
          </button>{" "}
          <button
            className="bg-neutral-800 text-white border border-neutral-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-neutral-700 hover:border-white transition-all duration-200 body"
            onClick={handleOpenModal}
          >
            Open Modal
          </button>
        </div>{" "}
        {/* CTA Section - Compact */}
        <div className="text-center flex-grow flex flex-col justify-center min-h-0 body">
          {user ? (
            <div className="space-y-3 body">
              <p className="text-base text-neutral-400 mb-4 body">
                Welcome back! Ready to continue?
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center px-6 py-3 bg-neutral-900 text-white font-semibold rounded-lg border border-neutral-700 hover:bg-neutral-800 hover:border-white transition-all duration-200 transform hover:scale-105 body"
              >
                Go to Profile
                <svg
                  className="ml-2 w-4 h-4"
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
              <div className="flex flex-col sm:flex-row gap-3 justify-center body">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center justify-center px-6 py-3 bg-neutral-900 text-white font-semibold rounded-lg border border-neutral-700 hover:bg-neutral-800 hover:border-white transition-all duration-200 transform hover:scale-105 body"
                >
                  Get Started Free
                  <svg
                    className="ml-2 w-4 h-4"
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
                </Link>{" "}
                <Link
                  to="/auth/login"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-black border border-neutral-700 font-semibold rounded-lg hover:bg-neutral-100 hover:border-white transition-all duration-200 transform hover:scale-105 body"
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
