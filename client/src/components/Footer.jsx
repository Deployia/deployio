import { Link } from "react-router-dom";
import {
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaHeart,
  FaLifeRing,
  FaRocket,
} from "react-icons/fa";
import { motion } from "framer-motion";

function Footer() {
  const currentYear = new Date().getFullYear();

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-auto bg-neutral-900 border-t border-neutral-800/50 body"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <img
                  src="/favicon.png"
                  alt="Deployio Logo"
                  className="w-7 h-7"
                />
              </div>
              <span className="text-2xl font-bold text-white heading">
                Deployio
              </span>
            </div>

            <p className="text-gray-300 text-lg mb-6 body leading-relaxed max-w-md">
              Transform your deployment process with AI-powered automation. From
              code analysis to production deployment in minutes, not hours.
            </p>

            <div className="flex items-center gap-4 mb-6">
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-neutral-800 hover:bg-blue-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                aria-label="GitHub"
              >
                <FaGithub className="w-5 h-5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-neutral-800 hover:bg-blue-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                aria-label="Twitter"
              >
                <FaTwitter className="w-5 h-5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-neutral-800 hover:bg-blue-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="w-5 h-5" />
              </motion.a>
            </div>
          </div>

          {/* Product Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 heading flex items-center gap-2">
              <FaRocket className="w-5 h-5 text-blue-400" />
              Product
            </h3>{" "}
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => scrollToSection("#features")}
                  className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-blue-400 transition-colors" />
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("#pricing")}
                  className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-blue-400 transition-colors" />
                  Pricing
                </button>
              </li>
              <li>
                <Link
                  to="/health"
                  className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-green-400 transition-colors" />
                  System Status
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-purple-400 transition-colors" />
                  API Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 heading flex items-center gap-2">
              <FaLifeRing className="w-5 h-5 text-green-400" />
              Support
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-blue-400 transition-colors" />
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-green-400 transition-colors" />
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-yellow-400 transition-colors" />
                  Community
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-red-400 transition-colors" />
                  Report Bug
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-neutral-800/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-gray-400 body">
              <span>© {currentYear} Deployio. Made with</span>
              <FaHeart className="w-4 h-4 text-red-500 animate-pulse" />
              <span>for developers worldwide</span>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6">
              <Link
                to="/privacy-policy"
                className="text-gray-400 hover:text-white transition-colors duration-200 body text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-gray-400 hover:text-white transition-colors duration-200 body text-sm"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookie-policy"
                className="text-gray-400 hover:text-white transition-colors duration-200 body text-sm"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;
