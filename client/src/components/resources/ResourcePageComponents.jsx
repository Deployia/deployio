import React from "react";
import { motion } from "framer-motion";
import { FaExternalLinkAlt } from "react-icons/fa";

/**
 * Reusable header component for resource pages
 * Follows dashboard theme design patterns
 */
const ResourcePageHeader = ({ icon: Icon, title, description, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-blue-500/20 rounded-xl">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white heading">{title}</h1>
          <p className="text-gray-400 body mt-1">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
};

/**
 * Reusable card component for resource pages
 * Follows dashboard theme design patterns
 */
const ResourceCard = ({
  children,
  className = "",
  hover = true,
  delay = 0,
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`
        bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6
        ${
          hover
            ? "hover:border-neutral-700/50 hover:bg-neutral-800/50 transition-all cursor-pointer"
            : ""
        }
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

/**
 * Reusable sidebar navigation component
 * Follows dashboard theme design patterns
 */
const ResourceSidebar = ({
  title,
  items,
  activeItem,
  onItemClick,
  children,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="lg:col-span-1"
    >
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 sticky top-24">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <nav className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeItem === item.id
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-300 hover:bg-neutral-800/50 hover:text-white"
              }`}
            >
              {item.icon && <item.icon className="flex-shrink-0 w-4 h-4" />}
              <span className="font-medium">{item.title}</span>
            </button>
          ))}
        </nav>
        {children}
      </div>
    </motion.div>
  );
};

/**
 * Reusable search bar component
 * Follows dashboard theme design patterns
 */
const ResourceSearchBar = ({ placeholder, value, onChange, icon: Icon }) => {
  return (
    <div className="relative max-w-2xl">
      <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
      />
    </div>
  );
};

/**
 * Reusable quick links component
 * Follows dashboard theme design patterns
 */
const ResourceQuickLinks = ({ links }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link, index) => (
        <motion.a
          key={index}
          href={link.href}
          target={link.href.startsWith("http") ? "_blank" : "_self"}
          rel={link.href.startsWith("http") ? "noopener noreferrer" : ""}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + index * 0.05 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg hover:border-neutral-700/50 hover:bg-neutral-800/50 transition-all group"
        >
          <link.icon className="text-gray-400 group-hover:text-white transition-colors" />
          <span className="text-gray-300 group-hover:text-white transition-colors">
            {link.title}
          </span>
          {link.href.startsWith("http") && (
            <FaExternalLinkAlt className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors" />
          )}
        </motion.a>
      ))}
    </div>
  );
};

/**
 * Reusable CTA section component
 * Follows dashboard theme design patterns
 */
const ResourceCTA = ({
  title,
  description,
  primaryButton,
  secondaryButton,
  gradient = "from-blue-600 via-purple-600 to-blue-600",
  delay = 0.4,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-r ${gradient} rounded-xl p-8 text-white text-center relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-blue-600/90 backdrop-blur-sm" />
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">{description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {primaryButton}
          {secondaryButton}
        </div>
      </div>
    </motion.div>
  );
};

export {
  ResourcePageHeader,
  ResourceCard,
  ResourceSidebar,
  ResourceSearchBar,
  ResourceQuickLinks,
  ResourceCTA,
};
