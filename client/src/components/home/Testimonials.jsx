import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import {
  FaStar,
  FaQuoteLeft,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
} from "react-icons/fa";

const Testimonials = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Senior Full-Stack Developer",
      company: "TechCorp",
      avatar: "SC",
      rating: 5,
      content:
        "Deployio completely transformed our deployment process. What used to take hours now takes minutes.",
      highlight: "Reduced deployment time by 90%",
    },
    {
      name: "Marcus Rodriguez",
      role: "DevOps Engineer",
      company: "StartupXYZ",
      avatar: "MR",
      rating: 5,
      content:
        "As a small team, we couldn't afford a dedicated DevOps engineer. Deployio's AI handles everything for us.",
      highlight: "Replaced expensive DevOps consultant",
    },
    {
      name: "Priya Patel",
      role: "Lead Developer",
      company: "InnovateLabs",
      avatar: "PP",
      rating: 5,
      content:
        "The security features are outstanding. Automated vulnerability scanning gives us peace of mind.",
      highlight: "Enhanced security & faster deploys",
    },
    {
      name: "David Kim",
      role: "CTO",
      company: "CloudFirst",
      avatar: "DK",
      rating: 5,
      content:
        "Deployio's multi-cloud support is phenomenal. We deploy to AWS, Azure, and GCP with ease.",
      highlight: "Saved 40% on infrastructure costs",
    },
    {
      name: "Emily Johnson",
      role: "Backend Developer",
      company: "DevCorp",
      avatar: "EJ",
      rating: 5,
      content:
        "Zero learning curve. I went from knowing nothing about Docker to production deployment in a day.",
      highlight: "Zero to production in 1 day",
    },
    {
      name: "Alex Thompson",
      role: "Software Architect",
      company: "ScaleTech",
      avatar: "AT",
      rating: 5,
      content:
        "Handles complex microservices architectures perfectly. Auto-detects dependencies and optimizes.",
      highlight: "Simplified microservices deployment",
    },
    {
      name: "Lisa Wang",
      role: "Frontend Developer",
      company: "WebFlow",
      avatar: "LW",
      rating: 5,
      content:
        "As a frontend developer, I never thought I'd be deploying backend services. Deployio made it effortless.",
      highlight: "Frontend dev deploying backends",
    },
    {
      name: "James Miller",
      role: "Tech Lead",
      company: "DataStream",
      avatar: "JM",
      rating: 5,
      content:
        "The AI recommendations for performance optimization are spot-on. Our app runs 3x faster now.",
      highlight: "3x performance improvement",
    },
    {
      name: "Maria Garcia",
      role: "Product Manager",
      company: "AppLab",
      avatar: "MG",
      rating: 5,
      content:
        "Even non-technical team members can deploy feature branches for testing. It's democratized our workflow.",
      highlight: "Democratized deployment workflow",
    },
    {
      name: "Ryan Foster",
      role: "DevOps Consultant",
      company: "CloudWorks",
      avatar: "RF",
      rating: 5,
      content:
        "I use Deployio for all my client projects. It's like having a senior DevOps engineer on every team.",
      highlight: "Essential tool for consultants",
    },
    {
      name: "Jennifer Lee",
      role: "Startup Founder",
      company: "TechStart",
      avatar: "JL",
      rating: 5,
      content:
        "As a bootstrapped startup, Deployio saved us months of development time and thousands in infrastructure costs.",
      highlight: "Saved months of dev time",
    },
    {
      name: "Michael Brown",
      role: "Senior Engineer",
      company: "Enterprise Corp",
      avatar: "MB",
      rating: 5,
      content:
        "Enterprise-grade security and compliance features made it easy to get approval from our security team.",
      highlight: "Enterprise security approved",
    },
  ];
  // Auto-advance carousel with faster transition
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 3000); // Faster rotation for infinite feel

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const currentTestimonial = testimonials[currentIndex];
  return (
    <section
      className="py-12 sm:py-16 md:py-20 bg-neutral-950 relative overflow-hidden"
      id="testimonials"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(34,197,94,0.1)_0%,transparent_50%)]" />

        {/* Enhanced floating testimonial icons */}
        <div className="absolute top-16 left-16 text-blue-400/20 animate-float">
          <FaQuoteLeft className="w-5 h-5" />
        </div>
        <div className="absolute top-32 right-24 text-purple-400/20 animate-float delay-1000">
          <FaUsers className="w-6 h-6" />
        </div>
        <div className="absolute bottom-24 left-32 text-green-400/20 animate-float delay-2000">
          <FaStar className="w-5 h-5" />
        </div>
        <div className="absolute top-20 left-1/3 text-cyan-400/20 animate-float delay-500">
          <FaQuoteLeft className="w-4 h-4" />
        </div>
        <div className="absolute bottom-32 right-1/3 text-yellow-400/20 animate-float delay-1500">
          <FaStar className="w-6 h-6" />
        </div>
        <div className="absolute top-40 right-1/4 text-indigo-400/20 animate-float delay-2500">
          <FaUsers className="w-5 h-5" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {" "}
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-4">
            <FaUsers className="w-4 h-4 mr-2" />
            Trusted by developers worldwide
          </div>
          <h2 className="heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 px-4">
            What Developers Are{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400">
              Saying
            </span>
          </h2>{" "}
          <p className="body text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
            Real stories from developers who chose Deployio to supercharge their
            deployment workflow.
          </p>
        </motion.div>
        {/* Main Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative"
        >
          {" "}
          {/* Main Testimonial Card */}
          <div className="relative bg-gradient-to-r from-neutral-900/80 via-neutral-800/80 to-neutral-900/80 backdrop-blur-lg rounded-3xl border border-neutral-700/50 p-8 sm:p-12 md:p-16 shadow-2xl min-h-[400px] flex items-center mx-8 sm:mx-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                {" "}
                <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
                  {/* Testimonial Content */}
                  <div className="flex-1 max-w-3xl space-y-6 text-center lg:text-left">
                    <FaQuoteLeft className="text-4xl text-blue-400/50 mx-auto lg:mx-0" />
                    <blockquote className="text-xl sm:text-2xl md:text-3xl text-white leading-relaxed font-light">
                      &ldquo;{currentTestimonial.content}&rdquo;
                    </blockquote>

                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-green-300 text-sm font-medium">
                        {currentTestimonial.highlight}
                      </span>
                    </div>
                  </div>

                  {/* Author Info */}
                  <div className="flex lg:flex-col items-center lg:items-center space-x-4 lg:space-x-0 lg:space-y-4 flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {currentTestimonial.avatar}
                    </div>

                    <div className="text-center lg:text-center">
                      <h4 className="text-white font-bold text-lg">
                        {currentTestimonial.name}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {currentTestimonial.role}
                      </p>
                      <p className="text-blue-400 text-sm font-medium">
                        {currentTestimonial.company}
                      </p>

                      {/* Star Rating */}
                      <div className="flex justify-center lg:justify-center mt-2 space-x-1">
                        {[...Array(currentTestimonial.rating)].map((_, i) => (
                          <FaStar key={i} className="text-yellow-400 w-4 h-4" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>{" "}
            {/* Navigation Arrows */}
            <button
              onClick={prevTestimonial}
              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-neutral-800/80 backdrop-blur-sm border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-neutral-700 transition-all duration-300 group"
            >
              <FaChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-neutral-800/80 backdrop-blur-sm border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-neutral-700 transition-all duration-300 group"
            >
              <FaChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          {/* Dots Navigation */}
          <div className="flex justify-center mt-8 space-x-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-blue-500 scale-125"
                    : "bg-neutral-600 hover:bg-neutral-500"
                }`}
              />
            ))}
          </div>
        </motion.div>
        {/* Call to Action Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-12 mb-8"
        >
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 backdrop-blur-sm p-6 rounded-2xl border border-blue-500/20 max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Ready to Join These Happy Developers?
            </h3>
            <p className="text-gray-300 text-base sm:text-lg">
              Transform your deployment workflow today and experience the same
              success stories. Start your journey with our free plan - no credit
              card required.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
