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
        <h2 className="text-xl font-bold mb-2 text-color-text-primary">
          Sidebar Content
        </h2>
        <p className="text-color-text-secondary">
          This is a demo sidebar. Click outside or press Escape to close.
        </p>
      </div>
    );
  };
  const handleOpenModal = () => {
    openModal(
      <div>
        <h2 className="text-xl font-bold mb-2 text-color-text-primary">
          Modal Content
        </h2>
        <p className="text-color-text-secondary">
          This is a demo modal. Click outside or press Escape to close.
        </p>
      </div>
    );
  };
  return (
    <div className="h-full bg-color-background text-color-text-primary overflow-hidden">
      <div className="h-full flex flex-col px-6 py-4">
        {/* Header Section - Compact */}
        <div className="text-center mb-4 flex-shrink-0">
          {/* Main Logo - Smaller */}
          <div className="mx-auto mb-3 w-16 h-16 bg-color-accent-primary rounded-2xl flex items-center justify-center shadow-xl">
            <img src="/favicon.png" alt="DeployIO Logo" className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            <span className="bg-gradient-to-r from-color-accent-primary via-color-accent-secondary to-color-accent-primary bg-clip-text text-transparent">
              Welcome to DeployIO
            </span>
          </h1>{" "}
          <p className="text-base text-color-text-secondary max-w-2xl mx-auto leading-relaxed">
            Your intelligent companion for seamless authentication and user
            management. Experience the future of secure, modern web
            applications.
          </p>
        </div>{" "}
        {/* Feature Cards - Compact and Consistent */}
        <div className="grid md:grid-cols-3 gap-4 mb-4 max-w-6xl mx-auto flex-shrink-0">
          <div className="bg-color-card-background p-4 rounded-xl shadow-xl border border-color-border">
            <div className="w-10 h-10 bg-color-accent-primary rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-color-text-on-accent"
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
              </svg>{" "}
            </div>
            <h3 className="text-lg font-semibold text-color-text-primary mb-2">
              Secure Authentication
            </h3>
            <p className="text-sm text-color-text-tertiary">
              Advanced security with JWT tokens and encrypted sessions.
            </p>
          </div>

          <div className="bg-color-card-background p-4 rounded-xl shadow-xl border border-color-border">
            <div className="w-10 h-10 bg-color-accent-secondary rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-color-text-on-accent"
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
              </svg>{" "}
            </div>
            <h3 className="text-lg font-semibold text-color-text-primary mb-2">
              Lightning Fast
            </h3>
            <p className="text-sm text-color-text-tertiary">
              Optimized performance with modern React and Redux architecture.
            </p>
          </div>

          <div className="bg-color-card-background p-4 rounded-xl shadow-xl border border-color-border">
            <div className="w-10 h-10 bg-color-accent-primary rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-color-text-on-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {" "}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>{" "}
            </div>
            <h3 className="text-lg font-semibold text-color-text-primary mb-2">
              User Friendly
            </h3>
            <p className="text-sm text-color-text-tertiary">
              Intuitive interface designed for the best user experience.
            </p>
          </div>
        </div>{" "}
        {/* Demo Buttons for Sidebar and Modal - Compact */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6 flex-shrink-0">
          <button
            className="bg-color-button-primary-bg hover:bg-color-button-primary-hover text-color-button-primary-text px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
            onClick={handleOpenSidebar}
          >
            Open Sidebar
          </button>{" "}
          <button
            className="bg-color-button-secondary-bg hover:bg-color-button-secondary-hover text-color-button-secondary-text border-2 border-color-button-secondary-border hover:border-color-accent-hover px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
            onClick={handleOpenModal}
          >
            Open Modal
          </button>
        </div>{" "}
        {/* CTA Section - Compact */}
        <div className="text-center flex-grow flex flex-col justify-center min-h-0">
          {" "}
          {user ? (
            <div className="space-y-3">
              <p className="text-base text-color-text-secondary mb-4">
                Welcome back! Ready to continue?
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center px-6 py-3 bg-color-button-primary-bg hover:bg-color-button-primary-hover text-color-button-primary-text font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
                  ></path>
                </svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-base text-color-text-secondary mb-5">
                Ready to get started? Join thousands of users today!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center justify-center px-6 py-3 bg-color-button-primary-bg hover:bg-color-button-primary-hover text-color-button-primary-text font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
                    ></path>
                  </svg>
                </Link>{" "}
                <Link
                  to="/auth/login"
                  className="inline-flex items-center justify-center px-6 py-3 bg-color-button-secondary-bg hover:bg-color-button-secondary-hover text-color-button-secondary-text border-2 border-color-button-secondary-border hover:border-color-accent-hover font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
