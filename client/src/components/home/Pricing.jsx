import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaCheck, FaRocket, FaStar, FaBuilding } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "forever",
      description: "Perfect for personal projects and learning",
      icon: FaRocket,
      features: [
        "Up to 3 deployments per month",
        "Basic AI stack detection",
        "Community support",
        "Standard monitoring",
        "Basic security scanning",
        "GitHub integration",
      ],
      cta: "Get Started Free",
      popular: false,
      gradient: "from-gray-500 to-gray-600",
      bgGradient: "from-gray-500/10 to-gray-600/10",
      borderColor: "border-gray-500/30",
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "Ideal for growing teams and production apps",
      icon: FaStar,
      features: [
        "Unlimited deployments",
        "Advanced AI optimization",
        "Priority support",
        "Real-time monitoring & alerts",
        "Advanced security features",
        "Multi-cloud deployment",
        "Auto-scaling & load balancing",
        "Performance analytics",
        "Custom domains",
        "Team collaboration tools",
      ],
      cta: "Start Free Trial",
      popular: true,
      gradient: "from-blue-500 to-purple-500",
      bgGradient: "from-blue-500/10 to-purple-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large organizations with custom needs",
      icon: FaBuilding,
      features: [
        "Everything in Pro",
        "Dedicated AI models",
        "24/7 enterprise support",
        "Private cloud deployment",
        "Custom integrations",
        "Advanced compliance features",
        "Dedicated account manager",
        "SLA guarantees",
        "On-premise options",
        "Custom training & onboarding",
      ],
      cta: "Contact Sales",
      popular: false,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10",
      borderColor: "border-green-500/30",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };
  return (
    <section
      className="py-12 sm:py-16 md:py-16 pb-8 sm:pb-12 md:pb-8 bg-black relative overflow-hidden"
      id="pricing"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(147,51,234,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(34,197,94,0.1)_0%,transparent_50%)]" />

        {/* Enhanced floating pricing icons */}
        <div className="absolute top-16 left-16 text-blue-400/20 animate-float">
          <FaStar className="w-5 h-5" />
        </div>
        <div className="absolute top-32 right-24 text-purple-400/20 animate-float delay-1000">
          <FaBuilding className="w-6 h-6" />
        </div>
        <div className="absolute bottom-24 left-32 text-green-400/20 animate-float delay-2000">
          <FaRocket className="w-5 h-5" />
        </div>
        <div className="absolute top-20 left-1/3 text-cyan-400/20 animate-float delay-500">
          <FaCheck className="w-4 h-4" />
        </div>
        <div className="absolute bottom-32 right-1/3 text-yellow-400/20 animate-float delay-1500">
          <FaStar className="w-6 h-6" />
        </div>
        <div className="absolute top-40 right-1/4 text-indigo-400/20 animate-float delay-2500">
          <FaBuilding className="w-5 h-5" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <FaStar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Simple, transparent pricing
          </div>

          <h2 className="heading text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 px-2 sm:px-4 leading-tight">
            Choose Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400">
              Perfect Plan
            </span>
          </h2>
          <p className="body text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
            Start free and scale as you grow. All plans include our AI-powered
            deployment automation and enterprise-grade security.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 xl:gap-12"
        >
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`relative bg-gradient-to-r ${
                  plan.bgGradient
                } backdrop-blur-lg rounded-xl sm:rounded-2xl md:rounded-3xl border ${
                  plan.borderColor
                } p-4 sm:p-6 md:p-8 lg:p-10 shadow-2xl transition-all duration-300 hover:transform hover:scale-105 ${
                  plan.popular
                    ? "ring-2 ring-blue-500/50 hover:ring-blue-400/70"
                    : "hover:border-opacity-50"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                      <span className="hidden sm:inline">Most Popular</span>
                      <span className="sm:hidden">Popular</span>
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-4 sm:mb-6 md:mb-8">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-r ${plan.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>

                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6">
                    {plan.description}
                  </p>

                  <div className="mb-4 sm:mb-6">
                    <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-400 ml-1 sm:ml-2 text-xs sm:text-sm md:text-base">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-6 sm:mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <FaCheck className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 leading-relaxed text-xs sm:text-sm md:text-base">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="text-center">
                  {plan.name === "Enterprise" ? (
                    <button
                      className={`w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r ${plan.gradient} text-white font-bold rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base`}
                    >
                      {plan.cta}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const currentPath = encodeURIComponent(
                          window.location.pathname + window.location.search
                        );
                        navigate(`/auth/register?next=${currentPath}`);
                      }}
                      className={`w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r ${
                        plan.gradient
                      } text-white font-bold rounded-xl sm:rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base ${
                        plan.popular
                          ? "hover:shadow-blue-500/25"
                          : "hover:shadow-gray-500/25"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-12 sm:mt-16"
        >
          <div className="bg-gradient-to-r from-neutral-900/80 to-neutral-800/80 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-neutral-700/50 p-4 sm:p-6 md:p-8 lg:p-12 max-w-4xl mx-auto">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
              30-Day Money-Back Guarantee
            </h3>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">
              Try Deployio risk-free. If you&apos;re not completely satisfied
              within 30 days, we&apos;ll refund your money, no questions asked.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center">
              <div className="flex items-center text-green-400 text-xs sm:text-sm md:text-base">
                <FaCheck className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center text-green-400 text-xs sm:text-sm md:text-base">
                <FaCheck className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center text-green-400 text-xs sm:text-sm md:text-base">
                <FaCheck className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
