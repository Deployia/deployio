import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaCheck } from "react-icons/fa";
import { Link } from "react-router-dom";

const Pricing = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "forever",
      description: "Perfect for personal projects and small applications",
      features: [
        "Up to 3 deployments per month",
        "Basic AI analysis",
        "Community support",
        "Standard monitoring",
        "Basic security scanning",
      ],
      cta: "Get Started",
      popular: false,
      gradient: "from-gray-500 to-gray-600",
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "Ideal for growing teams and production applications",
      features: [
        "Unlimited deployments",
        "Advanced AI optimization",
        "Priority support",
        "Real-time monitoring",
        "Advanced security features",
        "Multi-cloud deployment",
        "Auto-scaling",
        "Performance analytics",
      ],
      cta: "Start Free Trial",
      popular: true,
      gradient: "from-blue-500 to-purple-500",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large organizations with enterprise needs",
      features: [
        "Everything in Pro",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantees",
        "Advanced compliance",
        "On-premise deployment",
        "Custom AI models",
        "24/7 phone support",
      ],
      cta: "Contact Sales",
      popular: false,
      gradient: "from-purple-500 to-pink-500",
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
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="py-20 bg-neutral-900" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="heading text-4xl md:text-5xl font-bold text-white mb-6">
            Simple,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Transparent
            </span>{" "}
            Pricing
          </h2>
          <p className="body text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include our core
            AI-powered deployment features with no hidden costs.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative bg-neutral-800/50 backdrop-blur-sm p-8 rounded-2xl border transition-all duration-300 hover:transform hover:scale-105 ${
                plan.popular
                  ? "border-blue-500 shadow-lg shadow-blue-500/20"
                  : "border-neutral-700 hover:border-neutral-600"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-400 ml-2">{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="flex items-center space-x-3"
                  >
                    <FaCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="text-center">
                {plan.name === "Enterprise" ? (
                  <button
                    className={`w-full py-3 px-6 bg-gradient-to-r ${plan.gradient} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity`}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    to="/auth/register"
                    className={`block w-full py-3 px-6 bg-gradient-to-r ${plan.gradient} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-center`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="bg-neutral-800/50 p-6 rounded-lg">
              <h4 className="text-white font-semibold mb-3">
                Can I change plans anytime?
              </h4>
              <p className="text-gray-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div className="bg-neutral-800/50 p-6 rounded-lg">
              <h4 className="text-white font-semibold mb-3">
                Is there a free trial?
              </h4>
              <p className="text-gray-400 text-sm">
                Yes, all paid plans come with a 14-day free trial. No credit
                card required.
              </p>
            </div>
            <div className="bg-neutral-800/50 p-6 rounded-lg">
              <h4 className="text-white font-semibold mb-3">
                What payment methods do you accept?
              </h4>
              <p className="text-gray-400 text-sm">
                We accept all major credit cards, PayPal, and bank transfers for
                enterprise plans.
              </p>
            </div>
            <div className="bg-neutral-800/50 p-6 rounded-lg">
              <h4 className="text-white font-semibold mb-3">
                Do you offer refunds?
              </h4>
              <p className="text-gray-400 text-sm">
                Yes, we offer a 30-day money-back guarantee for all paid plans.
                No questions asked.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
