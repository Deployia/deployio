import { motion } from "framer-motion";

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="mb-6 sm:mb-8">
      <nav className="flex overflow-x-auto scrollbar-hide space-x-1 bg-neutral-900/30 backdrop-blur-md border border-neutral-800/50 rounded-xl p-1">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                relative flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
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
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${
                    isActive ? "text-blue-400" : "text-gray-500"
                  }`}
                />
                <span className="hidden sm:inline">{category.name}</span>
                <span className="sm:hidden">{category.name.split(" ")[0]}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CategoryTabs;
