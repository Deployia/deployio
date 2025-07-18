import { useSelector } from "react-redux";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaUser,
  FaBell,
  FaHistory,
  FaEdit,
  FaShieldAlt,
  FaChartLine,
  FaDesktop,
  FaChevronDown,
} from "react-icons/fa";
import SEO from "@components/SEO.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingGrid } from "@components/LoadingSpinner";
import {
  ProfileTab,
  ActivityTab,
  ProfileErrorBoundary,
  OverviewTab,
  SecurityTab,
  NotificationsTab,
} from "@components/profile";
import AnalyticsTab from "@components/profile/AnalyticsTab";
import SessionsTab from "@components/profile/SessionsTab";

function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Create refs for each tab content
  const tabRefs = useRef({
    overview: null,
    profile: null,
    security: null,
    sessions: null,
    notifications: null,
    activity: null,
    analytics: null,
  });

  // Get minimal user data from auth state (still needed for loading check)
  const { user: authUser } = useSelector((state) => state.auth);

  // Helper function for smooth scrolling with navbar offset
  const scrollToSection = useCallback((sectionId, delay = 300) => {
    setTimeout(() => {
      const sectionElement = document.getElementById(sectionId);
      if (sectionElement) {
        const navbarHeight = window.innerWidth >= 1024 ? 100 : 80; // More space on desktop, less on mobile
        const elementPosition = sectionElement.offsetTop;
        const offsetPosition = elementPosition - navbarHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, delay);
  }, []);

  // Tab configuration
  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: FaUser },
      { id: "profile", label: "Profile", icon: FaEdit },
      { id: "security", label: "Security", icon: FaShieldAlt },
      { id: "sessions", label: "Sessions", icon: FaDesktop },
      { id: "notifications", label: "Notifications", icon: FaBell },
      { id: "activity", label: "Activity", icon: FaHistory },
      { id: "analytics", label: "Analytics", icon: FaChartLine },
    ],
    []
  );
  // Update URL when tab changes with optional section
  const handleTabChange = useCallback(
    (tabId, section = null) => {
      setActiveTab(tabId);
      setShowMobileSidebar(false); // Close mobile sidebar when tab changes
      const newSearchParams = new URLSearchParams(searchParams);
      if (tabId === "overview") {
        newSearchParams.delete("tab");
      } else {
        newSearchParams.set("tab", tabId);
      }

      // Add section parameter if provided
      if (section) {
        newSearchParams.set("section", section);
      } else {
        newSearchParams.delete("section");
      }

      setSearchParams(newSearchParams);

      // Scroll to top of the page for better UX, with delay for tab content to render
      setTimeout(() => {
        if (section) {
          // If section is specified, try to scroll to it
          scrollToSection(section, 0); // No additional delay since we're already in setTimeout
        } else {
          // Otherwise scroll to top
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
          });
        }
      }, 100);
    },
    [searchParams, setSearchParams, scrollToSection]
  );

  // Handle URL tab changes and section navigation
  useEffect(() => {
    const tab = searchParams.get("tab") || "overview";
    const section = searchParams.get("section");
    setActiveTab(tab);

    // If section is specified, scroll to it after component renders
    if (section) {
      scrollToSection(section);
    }
  }, [searchParams, scrollToSection]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const renderTabContent = () => {
    const content = (() => {
      switch (activeTab) {
        case "overview":
          return <OverviewTab ref={(el) => (tabRefs.current.overview = el)} />;
        case "profile":
          return <ProfileTab ref={(el) => (tabRefs.current.profile = el)} />;
        case "security":
          return <SecurityTab ref={(el) => (tabRefs.current.security = el)} />;
        case "sessions":
          return <SessionsTab ref={(el) => (tabRefs.current.sessions = el)} />;
        case "notifications":
          return (
            <NotificationsTab
              ref={(el) => (tabRefs.current.notifications = el)}
            />
          );
        case "activity":
          return <ActivityTab ref={(el) => (tabRefs.current.activity = el)} />;
        case "analytics":
          return (
            <AnalyticsTab ref={(el) => (tabRefs.current.analytics = el)} />
          );
        default:
          return null;
      }
    })();

    return (
      <ProfileErrorBoundary
        fallbackMessage={`Failed to load the ${activeTab} tab. Please try refreshing the page.`}
      >
        {content}
      </ProfileErrorBoundary>
    );
  };
  if (!authUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white heading mb-8">
            Profile
          </h1>
          <LoadingGrid columns={3} rows={2} />
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO page="profile" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Account Settings
          </h1>
          <p className="mt-2 text-gray-400 text-sm lg:text-base">
            Manage your profile, security, and notification preferences
          </p>
        </motion.div>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Mobile Sidebar Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl text-white"
            >
              <span className="flex items-center gap-2">
                <FaUser className="w-4 h-4" />
                Account Settings
              </span>
              <motion.div
                animate={{ rotate: showMobileSidebar ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
          </div>

          {/* Sidebar Navigation */}
          <motion.div
            variants={itemVariants}
            className={`lg:col-span-1 ${
              showMobileSidebar ? "block" : "hidden lg:block"
            }`}
          >
            <div className="lg:sticky lg:top-20 lg:h-fit">
              <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 lg:p-6">
                <nav className="space-y-1 lg:space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left transition-colors text-sm lg:text-base ${
                        activeTab === tab.id
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "text-gray-300 hover:bg-neutral-700/50"
                      }`}
                    >
                      <tab.icon className="flex-shrink-0 w-3 h-3 lg:w-4 lg:h-4" />
                      <span className="font-medium truncate">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

export default Profile;
