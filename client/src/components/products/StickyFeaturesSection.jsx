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
    <section ref={sectionRef} className="py-20 px-6 relative min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-6">{title}</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            {subtitle}
          </p>

          {/* Progress Indicator */}
          <div className="flex justify-center space-x-3">
            {features.map((_, index) => (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  activeFeature >= index
                    ? `w-12 h-3 bg-gradient-to-r ${gradient} rounded-full`
                    : "w-3 h-3 bg-gray-600 rounded-full"
                }`}
              />
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {" "}
          {/* Left Sidebar - Sticky Navigation */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6">
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
                        ? `bg-gradient-to-r ${gradient} shadow-lg`
                        : "bg-gray-800/40 hover:bg-gray-800/60 border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {" "}
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
                        <h3 className="text-base font-semibold text-white mb-1 truncate">
                          {feature.title}
                        </h3>
                        <p className="text-gray-200 text-xs line-clamp-2">
                          {feature.description}
                        </p>
                      </div>{" "}
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
            </div>{" "}
          </div>
          {/* Right Content - Scrollable Details */}
          <div className="space-y-20">
            {features.map((feature, index) => (
              <div
                key={index}
                ref={(el) => (featureDetailRefs.current[index] = el)}
                className="min-h-[80vh] flex items-center"
              >
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className={`w-full bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg border rounded-2xl p-8 transition-all duration-500 ${
                    activeFeature === index
                      ? "border-white/40 shadow-2xl shadow-white/10 scale-[1.02]"
                      : "border-gray-700/50"
                  }`}
                >
                  {/* Feature Header */}
                  <div className="mb-8">
                    <div
                      className={`p-4 bg-gradient-to-r ${gradient.replace(
                        "to-purple-500",
                        "/20 to-purple-500/20"
                      )} rounded-xl inline-block mb-6`}
                    >
                      {" "}
                      {React.createElement(feature.icon, {
                        className: "w-8 h-8 text-white",
                      })}
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {feature.details}
                    </p>
                  </div>
                  {/* Additional Info */}
                  {(feature.platforms || feature.techStacks) && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-white mb-4">
                        {feature.platforms
                          ? "Supported Platforms:"
                          : "Supported Technologies:"}
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {(feature.platforms || feature.techStacks || []).map(
                          (item, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-full text-sm text-gray-300 hover:border-white/50 transition-colors"
                            >
                              {item}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}{" "}
                  {/* Success Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div
                      className={`bg-gradient-to-r ${gradient} rounded-lg p-4 border border-white/30`}
                    >
                      <div className="text-white text-2xl font-bold">99.9%</div>
                      <div className="text-gray-200 text-sm">Success Rate</div>
                    </div>
                    <div
                      className={`bg-gradient-to-r ${gradient} rounded-lg p-4 border border-white/30`}
                    >
                      <div className="text-white text-2xl font-bold">
                        &lt;2min
                      </div>
                      <div className="text-gray-200 text-sm">Avg Time</div>
                    </div>
                  </div>
                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full px-6 py-4 bg-gradient-to-r ${gradient} text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg`}
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
