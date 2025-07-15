import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@components/SEO.jsx";
import { useScrollToSection } from "@hooks/useScrollToSection";
import BusinessChatbot from "@components/BusinessChatbot.jsx";
import {
  Hero,
  About,
  Features,
  Testimonials,
  Pricing,
  CTA,
} from "@components/home";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { scrollToSectionDelayed } = useScrollToSection();

  // Handle cross-page scrolling when navigated from other pages
  useEffect(() => {
    // Check if we have a section to scroll to from navigation state
    if (location.state?.scrollToSection) {
      const sectionId = location.state.scrollToSection;

      // Use the hook's delayed scroll function
      const cleanup = scrollToSectionDelayed(sectionId, 100);

      // Clear the state to prevent repeated scrolling on component re-renders
      window.history.replaceState(
        { ...location.state, scrollToSection: null },
        ""
      );

      return cleanup;
    }
  }, [location.state, scrollToSectionDelayed]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth/login");
    }
  };

  const handleWatchDemo = () => {
    if (isAuthenticated) {
      navigate("/playground");
    } else {
      navigate("/auth/login");
    }
  };
  return (
    <>
      <SEO page="home" />
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Unique Home Background - Immersive AI Network */}
        <div className="absolute inset-0">
          {/* Primary gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-950 to-neutral-900" />

          {/* AI Network Effect - Unique to Home */}
          <div className="absolute inset-0">
            {/* Flowing AI Connections */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.3)_0%,transparent_25%)] animate-pulse delay-0" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.25)_0%,transparent_30%)] animate-pulse delay-1000" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_60%,rgba(34,197,94,0.15)_0%,transparent_20%)] animate-pulse delay-2000" />

            {/* Dynamic Neural Network Lines */}
            <svg
              className="absolute inset-0 w-full h-full opacity-20"
              viewBox="0 0 1920 1080"
            >
              <defs>
                <linearGradient
                  id="networkGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06d6a0" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              {/* Animated connecting lines */}
              <g stroke="url(#networkGrad)" strokeWidth="1" fill="none">
                <path
                  d="M100,300 Q500,150 900,400 T1600,200"
                  className="animate-pulse"
                />
                <path
                  d="M200,600 Q600,450 1000,700 T1700,500"
                  className="animate-pulse delay-500"
                />
                <path
                  d="M300,800 Q700,650 1100,900 T1800,700"
                  className="animate-pulse delay-1000"
                />
              </g>
              {/* Floating nodes */}
              <g fill="url(#networkGrad)">
                <circle
                  cx="200"
                  cy="300"
                  r="3"
                  className="animate-ping delay-200"
                />
                <circle
                  cx="500"
                  cy="600"
                  r="2"
                  className="animate-ping delay-800"
                />
                <circle
                  cx="800"
                  cy="200"
                  r="4"
                  className="animate-ping delay-1200"
                />
                <circle
                  cx="1200"
                  cy="700"
                  r="2"
                  className="animate-ping delay-400"
                />
                <circle
                  cx="1500"
                  cy="400"
                  r="3"
                  className="animate-ping delay-1600"
                />
              </g>
            </svg>

            {/* Floating Code Elements */}
            <div className="absolute top-20 left-10 text-blue-400/30 font-mono text-xs animate-float">
              {'{ "deploy": "auto" }'}
            </div>
            <div className="absolute top-40 right-20 text-purple-400/30 font-mono text-xs animate-float delay-1000">
              FROM node:18-alpine
            </div>
            <div className="absolute bottom-40 left-20 text-green-400/30 font-mono text-xs animate-float delay-2000">
              kubernetes.io/version
            </div>
            <div className="absolute bottom-20 right-40 text-cyan-400/30 font-mono text-xs animate-float delay-500">
              CI/CD: ✓ Complete
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Hero onGetStarted={handleGetStarted} onWatchDemo={handleWatchDemo} />
          <About />
          <Features />
          <Testimonials />
          <Pricing />
          <CTA onGetStarted={handleGetStarted} />
          <BusinessChatbot />
        </div>
      </div>
    </>
  );
}

export default Home;
