import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaStar } from "react-icons/fa";

const Testimonials = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Senior Full-Stack Developer",
      company: "TechCorp",
      avatar: "SC",
      rating: 5,
      content:
        "Deployio completely transformed our deployment process. What used to take hours now takes minutes. The AI analysis is incredibly accurate and the one-click deployment is a game-changer.",
    },
    {
      name: "Marcus Rodriguez",
      role: "DevOps Engineer",
      company: "StartupXYZ",
      avatar: "MR",
      rating: 5,
      content:
        "As a small team, we couldn't afford a dedicated DevOps engineer. Deployio's AI handles all the complex configurations for us. It's like having a DevOps expert on our team 24/7.",
    },
    {
      name: "Priya Patel",
      role: "Lead Developer",
      company: "InnovateLabs",
      avatar: "PP",
      rating: 5,
      content:
        "The security features are outstanding. Automated vulnerability scanning and compliance checks give us peace of mind. Our deployment time reduced by 80% while improving security.",
    },
    {
      name: "David Kim",
      role: "CTO",
      company: "CloudFirst",
      avatar: "DK",
      rating: 5,
      content:
        "Deployio's multi-cloud support is phenomenal. We can deploy to AWS, Azure, and GCP with the same ease. The cost optimization suggestions alone saved us 40% on infrastructure costs.",
    },
    {
      name: "Emily Johnson",
      role: "Backend Developer",
      company: "DataCorp",
      avatar: "EJ",
      rating: 5,
      content:
        "The real-time monitoring and analytics are incredible. We can track performance, identify bottlenecks, and scale automatically. Our application uptime improved to 99.99%.",
    },
    {
      name: "Alex Thompson",
      role: "Full-Stack Developer",
      company: "WebSolutions",
      avatar: "AT",
      rating: 5,
      content:
        "I was skeptical about AI-powered deployment, but Deployio proved me wrong. It understands our complex microservices architecture and optimizes everything perfectly.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <section className="py-20 bg-neutral-800" id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="heading text-4xl md:text-5xl font-bold text-white mb-6">
            Loved by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Developers
            </span>
          </h2>{" "}
          <p className="body text-xl text-gray-300 max-w-3xl mx-auto">
            Don&apos;t just take our word for it. Here&apos;s what developers
            and teams around the world are saying about Deployio.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-neutral-700/50 backdrop-blur-sm p-6 rounded-xl border border-neutral-600 hover:border-neutral-500 transition-all duration-300 hover:transform hover:scale-105"
            >
              {" "}
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FaStar key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>{" "}
              {/* Content */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}{" "}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
