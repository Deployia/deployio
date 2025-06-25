import { motion } from "framer-motion";
import { FaTools, FaCode, FaCloud } from "react-icons/fa";

const CategoryTabs = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: "all", name: "All Integrations", icon: FaTools },
    { id: "scm", name: "Source Control", icon: FaCode },
    { id: "cloud", name: "Cloud Providers", icon: FaCloud },
  ];

  return (
    <div className="mb-8">
      <nav className="flex space-x-1 bg-neutral-900/30 backdrop-blur-md border border-neutral-800/50 rounded-xl p-1">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "text-white bg-neutral-800/80 shadow-lg"
                    : "text-gray-400 hover:text-gray-300 hover:bg-neutral-800/40"
                }
              `}
            >
              {/* Active background animation */}
              {isActive && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-neutral-800/80 rounded-lg"
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* Content */}
              <div className="relative flex items-center gap-2">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-blue-400" : "text-gray-500"
                  }`}
                />
                <span>{category.name}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CategoryTabs;
