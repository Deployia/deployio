import { useSidebar } from "../context/SidebarContext.jsx";
import { useModal } from "../context/ModalContext.jsx";
import SEO from "../components/SEO.jsx";
import {
  Hero,
  About,
  Features,
  Testimonials,
  Pricing,
  CTA,
} from "../components/home";

function Home() {
  const { openSidebar } = useSidebar();
  const { openModal } = useModal();

  const handleOpenSidebar = () => {
    openSidebar(
      <div>
        <h2 className="text-xl font-bold mb-4 text-white">
          AI DevOps Assistant
        </h2>
        <p className="text-gray-300 mb-4">
          Get instant help with deployment configurations, troubleshooting, and
          best practices.
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-neutral-800 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Quick Actions</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Analyze Repository</li>
              <li>• Generate Dockerfile</li>
              <li>• Setup CI/CD Pipeline</li>
              <li>• Deploy to Cloud</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const handleOpenModal = () => {
    openModal(
      <div>
        <h2 className="text-xl font-bold mb-4 text-white">
          🚀 Get Started with AI DevOps
        </h2>
        <p className="text-gray-300 mb-4">
          Ready to transform your deployment process? Submit a GitHub repository
          URL and watch our AI analyze, optimize, and deploy your application
          automatically.
        </p>
        <div className="bg-neutral-800 p-4 rounded-lg mb-4">
          <h3 className="text-white font-semibold mb-2">
            What our AI will do:
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Analyze your codebase structure</li>
            <li>• Detect dependencies and frameworks</li>
            <li>• Generate optimized Dockerfile</li>
            <li>• Create CI/CD pipeline configuration</li>
            <li>• Recommend best practices</li>
            <li>• Deploy to your preferred cloud platform</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
            Try Demo
          </button>
          <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
            Deploy Now
          </button>
        </div>
      </div>
    );
  };

  const handleWatchDemo = () => {
    handleOpenModal();
  };

  const handleGetStarted = () => {
    handleOpenSidebar();
  };

  return (
    <>
      <SEO
        title="Deployio - AI-Powered DevOps Platform"
        description="Transform your deployment process with AI-powered automation. Deploy smarter, not harder with intelligent code analysis and optimization."
        keywords="deployment, devops, ai, automation, docker, ci/cd, cloud deployment"
      />
      <div className="min-h-screen bg-neutral-900">
        <Hero onGetStarted={handleGetStarted} onWatchDemo={handleWatchDemo} />
        <About />
        <Features />
        <Testimonials />
        <Pricing />
        <CTA onGetStarted={handleGetStarted} />
      </div>
    </>
  );
}

export default Home;
