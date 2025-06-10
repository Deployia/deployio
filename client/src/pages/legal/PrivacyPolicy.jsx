import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaUserShield,
  FaCookie,
  FaDatabase,
} from "react-icons/fa";
import SEO from "@components/SEO.jsx";

function PrivacyPolicy() {
  return (
    <>
      <SEO page="privacyPolicy" />
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
              className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-6"
            >
              <FaShieldAlt className="w-8 h-8 text-blue-400" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-4 heading">
              Privacy Policy
            </h1>
            <p className="text-neutral-400 body max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we
              collect, use, and protect your information.
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
              <div className="flex items-center gap-3 mb-4">
                <FaDatabase className="w-5 h-5 text-blue-400" />
                <h2 className="text-2xl font-semibold text-white heading">
                  Information We Collect
                </h2>
              </div>
              <div className="space-y-4 text-neutral-300 body">
                <p>
                  We collect information you provide directly to us, such as:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account information (email, username, profile data)</li>
                  <li>Authentication data (hashed passwords, 2FA settings)</li>
                  <li>Usage data and preferences</li>
                  <li>Communication data when you contact us</li>
                </ul>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaUserShield className="w-5 h-5 text-green-400" />
                <h2 className="text-2xl font-semibold text-white heading">
                  How We Use Your Information
                </h2>
              </div>
              <div className="space-y-4 text-neutral-300 body">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices and security alerts</li>
                  <li>Respond to your comments and questions</li>
                  <li>Analyze usage patterns to enhance user experience</li>
                </ul>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaCookie className="w-5 h-5 text-yellow-400" />
                <h2 className="text-2xl font-semibold text-white heading">
                  Cookies and Tracking
                </h2>
              </div>
              <div className="space-y-4 text-neutral-300 body">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Maintain your session and keep you logged in</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze site traffic and usage patterns</li>
                  <li>Provide security features and fraud prevention</li>
                </ul>
                <p className="mt-4">
                  You can control cookie settings through your browser
                  preferences.
                </p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <h2 className="text-2xl font-semibold text-white mb-4 heading">
                Data Security
              </h2>
              <div className="space-y-4 text-neutral-300 body">
                <p>
                  We implement appropriate security measures to protect your
                  personal information against unauthorized access, alteration,
                  disclosure, or destruction. This includes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Secure HTTPS connections</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication systems</li>
                </ul>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <h2 className="text-2xl font-semibold text-white mb-4 heading">
                Your Rights
              </h2>
              <div className="space-y-4 text-neutral-300 body">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access, update, or delete your personal information</li>
                  <li>Export your data in a portable format</li>
                  <li>Opt-out of certain communications</li>
                  <li>Request information about how your data is processed</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us at{" "}
                  <a
                    href="mailto:privacy@deployio.tech"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    privacy@deployio.tech
                  </a>
                </p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
            >
              <h2 className="text-2xl font-semibold text-white mb-4 heading">
                Contact Us
              </h2>
              <div className="text-neutral-300 body">
                <p>
                  If you have any questions about this Privacy Policy, please
                  contact us at{" "}
                  <a
                    href="mailto:privacy@deployio.tech"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
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

export default PrivacyPolicy;
