import { motion } from "framer-motion";
import { FaCookie, FaCog, FaChartLine, FaShieldAlt } from "react-icons/fa";
import SEO from "../components/SEO.jsx";

function CookiePolicy() {
  return (
    <>
      <SEO page="cookiePolicy" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black"
      >
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-2xl border border-orange-500/20 mb-6"
            >
              <FaCookie className="w-8 h-8 text-orange-400" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-4 heading">
              Cookie Policy
            </h1>
            <p className="text-neutral-400 body max-w-2xl mx-auto">
              This policy explains how we use cookies and similar technologies
              to recognize you when you visit our website.
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <h2 className="text-2xl font-semibold text-white mb-4 heading">
                What Are Cookies?
              </h2>
              <div className="space-y-4 text-neutral-300 body">
                <p>
                  Cookies are small data files that are placed on your computer
                  or mobile device when you visit a website. Cookies are widely
                  used by website owners to make their websites work, or to work
                  more efficiently, as well as to provide reporting information.
                </p>
                <p>
                  Cookies set by the website owner (in this case, DeployIO) are
                  called &quot;first party cookies&quot;. Cookies set by parties
                  other than the website owner are called &quot;third party
                  cookies&quot;.
                </p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaShieldAlt className="w-5 h-5 text-green-400" />
                <h2 className="text-2xl font-semibold text-white heading">
                  Essential Cookies
                </h2>
              </div>
              <div className="space-y-4 text-neutral-300 body">
                <p>
                  These cookies are strictly necessary for the operation of our
                  website. They include:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Authentication Cookies:</strong> Keep you logged in
                    during your session
                  </li>
                  <li>
                    <strong>Security Cookies:</strong> Protect against
                    cross-site request forgery (CSRF) attacks
                  </li>
                  <li>
                    <strong>Session Cookies:</strong> Remember your preferences
                    during your visit
                  </li>
                  <li>
                    <strong>Load Balancing Cookies:</strong> Ensure you connect
                    to the same server
                  </li>
                </ul>
                <p className="mt-4 text-sm text-neutral-400">
                  These cookies cannot be disabled as they are essential for the
                  website to function properly.
                </p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaCog className="w-5 h-5 text-blue-400" />
                <h2 className="text-2xl font-semibold text-white heading">
                  Functional Cookies
                </h2>
              </div>
              <div className="space-y-4 text-neutral-300 body">
                <p>
                  These cookies enhance the functionality and personalization of
                  our website:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Preference Cookies:</strong> Remember your language
                    and region settings
                  </li>
                  <li>
                    <strong>Theme Cookies:</strong> Remember your dark/light
                    mode preference
                  </li>
                  <li>
                    <strong>Feature Cookies:</strong> Enable enhanced features
                    like auto-save
                  </li>
                  <li>
                    <strong>Accessibility Cookies:</strong> Remember
                    accessibility settings
                  </li>
                </ul>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaChartLine className="w-5 h-5 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white heading">
                  Analytics Cookies
                </h2>
              </div>
              <div className="space-y-4 text-neutral-300 body">
                <p>
                  These cookies help us understand how visitors interact with
                  our website:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Usage Analytics:</strong> Track which pages are
                    visited most often
                  </li>
                  <li>
                    <strong>Performance Analytics:</strong> Monitor website
                    speed and performance
                  </li>
                  <li>
                    <strong>Error Tracking:</strong> Identify and fix technical
                    issues
                  </li>
                  <li>
                    <strong>A/B Testing:</strong> Test different versions of
                    features
                  </li>
                </ul>
                <p className="mt-4">
                  We use this information to improve our website and user
                  experience. All analytics data is anonymized and cannot be
                  used to identify individual users.
                </p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <h2 className="text-2xl font-semibold text-white mb-4 heading">
                Cookie Lifespan
              </h2>
              <div className="space-y-4 text-neutral-300 body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">
                      Session Cookies
                    </h3>
                    <p className="text-sm">
                      Deleted when you close your browser
                    </p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">
                      Persistent Cookies
                    </h3>
                    <p className="text-sm">
                      Remain for a specified period (up to 1 year)
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <h2 className="text-2xl font-semibold text-white mb-4 heading">
                Managing Cookies
              </h2>
              <div className="space-y-4 text-neutral-300 body">
                <p>
                  You can control and/or delete cookies as you wish. You can:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Delete all cookies that are already on your computer</li>
                  <li>Set your browser to prevent cookies from being placed</li>
                  <li>Allow cookies only from trusted sites</li>
                  <li>Use browser extensions to manage cookies</li>
                </ul>
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    <strong>Note:</strong> Disabling cookies may affect the
                    functionality of this and many other websites that you
                    visit. Disabling cookies will usually result in also
                    disabling certain features of this site.
                  </p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <h2 className="text-2xl font-semibold text-white mb-4 heading">
                Contact Us
              </h2>
              <div className="text-neutral-300 body">
                <p>
                  If you have any questions about our use of cookies, please
                  contact us at{" "}
                  <a
                    href="mailto:privacy@deployio.tech"
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    privacy@deployio.tech
                  </a>
                </p>
              </div>
            </motion.section>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default CookiePolicy;
