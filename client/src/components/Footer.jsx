import { Link } from "react-router-dom";
import {
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaHeart,
  FaLifeRing,
  FaRocket,
  FaDownload,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { footerNavigation } from "@constants/navigation";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-auto bg-neutral-900/70 backdrop-blur-lg border-t border-neutral-800/30 body"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {" "}
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            {" "}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                <img src="/favicon.png" alt="Deployio Logo" />
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
          </div>{" "}
          {/* Products Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 heading flex items-center gap-2">
              <FaRocket className="w-5 h-5 text-blue-400" />
              Products
            </h3>
            <ul className="space-y-4">
              {footerNavigation.products.map((item, index) => {
                const colorMap = ["blue", "green", "cyan", "orange", "red"];
                const color = colorMap[index % colorMap.length];

                return (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                    >
                      <span
                        className={`w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-${color}-400 transition-colors`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>{" "}
          {/* Downloads Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 heading flex items-center gap-2">
              <FaDownload className="w-5 h-5 text-cyan-400" />
              Downloads
            </h3>
            <ul className="space-y-4">
              {footerNavigation.downloads.map((item, index) => {
                const colorMap = ["cyan", "purple", "gray"];
                const color = colorMap[index % colorMap.length];

                return (
                  <li key={item.label}>
                    {item.href.startsWith("http") ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                      >
                        <span
                          className={`w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-${color}-400 transition-colors`}
                        />
                        <span className="flex items-center gap-2">
                          {item.label}
                          {item.comingSoon && (
                            <span className="px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 rounded-full">
                              {item.comingSoon}
                            </span>
                          )}
                        </span>
                      </a>
                    ) : (
                      <Link
                        to={item.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                      >
                        <span
                          className={`w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-${color}-400 transition-colors`}
                        />
                        <span className="flex items-center gap-2">
                          {item.label}
                          {item.comingSoon && (
                            <span className="px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 rounded-full">
                              {item.comingSoon}
                            </span>
                          )}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>{" "}
          {/* Resources Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 heading flex items-center gap-2">
              <FaLifeRing className="w-5 h-5 text-green-400" />
              Resources
            </h3>
            <ul className="space-y-4">
              {footerNavigation.resources.map((item, index) => {
                const colorMap = ["blue", "green", "yellow", "purple"];
                const color = colorMap[index % colorMap.length];

                return (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 body flex items-center gap-2 group"
                    >
                      <span
                        className={`w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-${color}-400 transition-colors`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
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
