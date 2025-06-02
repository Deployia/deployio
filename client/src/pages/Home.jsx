import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

function Home() {
  const { user } = useSelector((state) => state.auth);
  
  return (
    <div className="h-full bg-color-background text-color-text-primary">
      <div className="h-full flex flex-col px-6 py-4 max-w-full overflow-x-hidden">
        {/* Hero Section */}
        <div className="text-center mb-8 flex-shrink-0">
          <div className="mx-auto mb-3 w-20 h-20 bg-color-accent-primary rounded-2xl flex items-center justify-center shadow-xl">
            <img src="/favicon.png" alt="DeployIO Logo" className="w-14 h-14" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-color-accent-primary via-color-accent-secondary to-color-accent-primary bg-clip-text text-transparent">
              DevOps Automation, Simplified
            </span>
          </h1>
          <p className="text-lg text-color-text-secondary max-w-2xl mx-auto leading-relaxed">
            Modern software teams struggle with setting up efficient, scalable,
            and consistent DevOps pipelines. DeployIO lets you input a GitHub
            project URL and instantly get a full Docker-based, CI/CD-enabled,
            AI-assisted deployment pipeline—no DevOps expertise required.
          </p>
        </div>
        {/* About Section */}
        <div className="max-w-4xl mx-auto mb-10 text-center">
          <h2 className="text-2xl font-bold mb-2 text-color-text-primary">
            Our Vision
          </h2>
          <p className="text-base text-color-text-secondary mb-2">
            We democratize DevOps by making automation, deployment, and
            infrastructure management accessible to all developers. From solo
            hackers to scaling teams, DeployIO streamlines your entire DevOps
            lifecycle with minimal input and maximum intelligence.
          </p>
          <p className="text-base text-color-text-tertiary">
            With AI integrations, cloud compatibility, and smart diagnostics,
            DeployIO is your one-stop solution for deployment and DevOps
            learning.
          </p>
        </div>
        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center text-color-text-primary">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-color-card-background p-6 rounded-xl shadow-xl border border-color-border flex flex-col items-center">
              <div className="w-12 h-12 bg-color-accent-primary rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-color-text-on-accent"
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
              <h3 className="text-lg font-semibold text-color-text-primary mb-2">
                One-Click DevOps
              </h3>
              <p className="text-sm text-color-text-tertiary">
                Paste your GitHub URL, get a full pipeline: Docker, CI/CD, logs,
                and deployment—auto-configured.
              </p>
            </div>
            <div className="bg-color-card-background p-6 rounded-xl shadow-xl border border-color-border flex flex-col items-center">
              <div className="w-12 h-12 bg-color-accent-secondary rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-color-text-on-accent"
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
              <h3 className="text-lg font-semibold text-color-text-primary mb-2">
                AI-Assisted Diagnostics
              </h3>
              <p className="text-sm text-color-text-tertiary">
                Get smart error explanations, guided fixes, and best-practice
                suggestions for your deployments.
              </p>
            </div>
            <div className="bg-color-card-background p-6 rounded-xl shadow-xl border border-color-border flex flex-col items-center">
              <div className="w-12 h-12 bg-color-accent-primary rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-color-text-on-accent"
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
              <h3 className="text-lg font-semibold text-color-text-primary mb-2">
                Cloud & Stack Agnostic
              </h3>
              <p className="text-sm text-color-text-tertiary">
                Start with MERN, scale to any stack or cloud. DeployIO grows
                with your needs.
              </p>
            </div>
          </div>
        </div>
        {/* Testimonials Section */}
        <div className="py-8 bg-color-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-color-text-primary sm:text-4xl">
                Loved by Developers
              </h2>
              <p className="mt-4 text-lg leading-6 text-color-text-secondary">
                Hear what our users are saying about DeployIO.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-color-card-background rounded-xl shadow-xl p-6 border border-color-border">
                <p className="text-base text-color-text-secondary mb-4">
                  "DeployIO has revolutionized our deployment workflow. It's
                  fast, reliable, and incredibly easy to use. Highly
                  recommended!"
                </p>
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-color-accent-primary flex items-center justify-center text-color-text-on-accent font-bold">
                    JD
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-color-text-primary">
                      Jane Doe
                    </div>
                    <div className="text-sm text-color-text-tertiary">
                      CTO, Tech Solutions Inc.
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-color-card-background rounded-xl shadow-xl p-6 border border-color-border">
                <p className="text-base text-color-text-secondary mb-4">
                  "The best DevOps automation platform I've ever used. The AI
                  diagnostics are a game changer for our team."
                </p>
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-color-accent-secondary flex items-center justify-center text-color-text-on-accent font-bold">
                    JS
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-color-text-primary">
                      John Smith
                    </div>
                    <div className="text-sm text-color-text-tertiary">
                      Lead Developer, Innovate Ltd.
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-color-card-background rounded-xl shadow-xl p-6 border border-color-border">
                <p className="text-base text-color-text-secondary mb-4">
                  "Setting up DeployIO was a breeze. The documentation is clear,
                  and the support team is fantastic."
                </p>
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-color-accent-primary flex items-center justify-center text-color-text-on-accent font-bold">
                    AS
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-color-text-primary">
                      Alice Stone
                    </div>
                    <div className="text-sm text-color-text-tertiary">
                      Product Manager, WebApp Co.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* CTA Section */}
        <div className="text-center flex-grow flex flex-col justify-center min-h-0 mt-8">
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
                </Link>
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
