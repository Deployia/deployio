import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

const StickyFeaturesSection = ({
  title,
  subtitle,
  features,
  gradient = "from-blue-500 to-purple-500",
}) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef(null);
  const featureDetailRefs = useRef([]);

  // Handle scrolling to specific feature
  const scrollToFeature = (index) => {
    const targetElement = featureDetailRefs.current[index];
    if (targetElement) {
      const elementTop = targetElement.offsetTop;
      const offset = window.innerHeight / 2 - 200; // Center the element
      window.scrollTo({
        top: elementTop - offset,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !featureDetailRefs.current.length) return;

      const windowHeight = window.innerHeight;

      // Find which feature detail is currently in view
      let newActiveFeature = 0;
      let minDistance = Infinity;

      featureDetailRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const elementCenter = rect.top + rect.height / 2;
          const viewportCenter = windowHeight / 2;
          const distance = Math.abs(elementCenter - viewportCenter);

          if (
            distance < minDistance &&
            rect.top < windowHeight &&
            rect.bottom > 0
          ) {
            minDistance = distance;
            newActiveFeature = index;
          }
        }
      });

      setActiveFeature(newActiveFeature);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, [features.length]);
  return (
    <section
      ref={sectionRef}
      className="py-4 sm:py-8 md:py-12 px-4 md:px-6 relative"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8 md:mb-12"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
            {title}
          </h2>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-4 sm:mb-6">
            {subtitle}
          </p>
        </motion.div>

        <div className="block lg:grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Sidebar - Sticky Navigation (hidden on mobile, inline on mobile) */}
          <div className="hidden lg:block lg:sticky lg:top-16 lg:self-start">
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl p-4 md:p-5">
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    onClick={() => scrollToFeature(index)}
                    className={`group cursor-pointer p-4 rounded-lg transition-all duration-300 ${
                      activeFeature === index
                        ? `bg-gradient-to-r ${gradient}/10 shadow-lg`
                        : "bg-gray-800/40 hover:bg-gray-800/60 border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          activeFeature === index
                            ? "bg-white/20"
                            : "bg-gray-700/50 group-hover:bg-gray-700/80"
                        }`}
                      >
                        {React.createElement(feature.icon, {
                          className: `w-5 h-5 ${
                            activeFeature === index
                              ? "text-white"
                              : "text-gray-400 group-hover:text-gray-300"
                          }`,
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white mb-1 truncate">
                          {feature.title}
                        </h3>
                        <p className="text-gray-200 text-xs line-clamp-2">
                          {feature.description}
                        </p>
                      </div>
                      <FaArrowRight
                        className={`w-3 h-3 transition-all duration-300 flex-shrink-0 ${
                          activeFeature === index
                            ? "text-white translate-x-1"
                            : "text-gray-500 group-hover:text-gray-400"
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Scrollable Details */}
          <div className="space-y-8 sm:space-y-12 md:space-y-16">
            {features.map((feature, index) => (
              <div
                key={index}
                ref={(el) => (featureDetailRefs.current[index] = el)}
                className="min-h-[40vh] sm:min-h-[50vh] lg:min-h-[60vh] flex items-center"
              >
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className={`w-full bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg border rounded-xl p-4 sm:p-6 transition-all duration-500 ${
                    activeFeature === index
                      ? "border-white/40 shadow-xl shadow-white/10 scale-[1.01]"
                      : "border-gray-700/50"
                  }`}
                >
                  {/* Feature Header */}
                  <div className="mb-4 sm:mb-6">
                    <div
                      className={`p-2 sm:p-3 bg-gradient-to-r ${gradient}/10 rounded-lg inline-block mb-3 sm:mb-4`}
                    >
                      {React.createElement(feature.icon, {
                        className: "w-5 h-5 sm:w-6 sm:h-6 text-white",
                      })}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      {feature.details}
                    </p>
                  </div>

                  {/* Additional Info */}
                  {(feature.platforms || feature.techStacks) && (
                    <div className="mb-4 sm:mb-6">
                      <h4 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">
                        {feature.platforms
                          ? "Supported Platforms:"
                          : "Supported Technologies:"}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(feature.platforms || feature.techStacks || []).map(
                          (item, idx) => (
                            <span
                              key={idx}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-700/50 border border-gray-600 rounded-full text-xs text-gray-300 hover:border-white/50 transition-colors"
                            >
                              {item}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Success Metrics */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                    <div
                      className={`bg-gradient-to-r ${gradient} rounded-lg p-3 md:p-4 border border-white/30`}
                    >
                      <div className="text-white text-xl md:text-2xl font-bold">
                        99.9%
                      </div>
                      <div className="text-gray-200 text-xs md:text-sm">
                        Success Rate
                      </div>
                    </div>
                    <div
                      className={`bg-gradient-to-r ${gradient} rounded-lg p-3 md:p-4 border border-white/30`}
                    >
                      <div className="text-white text-xl md:text-2xl font-bold">
                        &lt;2min
                      </div>
                      <div className="text-gray-200 text-xs md:text-sm">
                        Avg Time
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r ${gradient} text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg text-sm md:text-base`}
                  >
                    Try {feature.title}
                  </motion.button>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StickyFeaturesSection;
