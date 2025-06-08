import { Link } from "react-router-dom";
import {
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaHeart,
  FaShieldAlt,
  FaBook,
  FaLifeRing,
  FaBug,
} from "react-icons/fa";
import { motion } from "framer-motion";

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-auto border-t border-neutral-800 bg-black/50 backdrop-blur-sm body"
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-700">
                <img
                  src="/favicon.png"
                  alt="DeployIO Logo"
                  className="w-6 h-6"
                />
              </div>
              <span className="text-xl font-bold text-white heading">
                DeployIO
              </span>
            </div>
            <p className="text-neutral-400 text-sm max-w-md mb-4 body">
              Your intelligent companion for seamless authentication and user
              management. Experience the future of secure, modern web
              applications.
            </p>{" "}
            <div className="flex items-center gap-4">
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-600 transition-colors duration-200"
                aria-label="GitHub"
              >
                <FaGithub className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-600 transition-colors duration-200"
                aria-label="Twitter"
              >
                <FaTwitter className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-600 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="w-4 h-4" />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 heading">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/health"
                  className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors duration-200 text-sm body"
                >
                  <FaShieldAlt className="w-3 h-3 flex-shrink-0" />
                  System Health
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors duration-200 text-sm body"
                >
                  <FaBook className="w-3 h-3 flex-shrink-0" />
                  Documentation
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@deployio.com"
                  className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors duration-200 text-sm body"
                >
                  <FaLifeRing className="w-3 h-3 flex-shrink-0" />
                  Support
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors duration-200 text-sm body"
                >
                  <FaBug className="w-3 h-3 flex-shrink-0" />
                  Report Bug
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4 heading">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/privacy"
                  className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm body"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm body"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/cookies"
                  className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm body"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-xs body">
            © {currentYear} DeployIO. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-neutral-500 text-xs body">
            <span>Made with</span>
            <FaHeart className="w-3 h-3 text-red-500 mx-1" />
            <span>for developers</span>
          </div>{" "}
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;
