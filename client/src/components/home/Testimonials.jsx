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
        "Deployio completely transformed our deployment process. What used to take hours now takes minutes. The AI analysis is incredibly accurate and the one-click deployment is a game-changer.",
      highlight: "Reduced deployment time by 90%",
    },
    {
      name: "Marcus Rodriguez",
      role: "DevOps Engineer",
      company: "StartupXYZ",
      avatar: "MR",
      rating: 5,
      content:
        "As a small team, we couldn't afford a dedicated DevOps engineer. Deployio's AI handles all the complex configurations for us. It's like having a DevOps expert on our team 24/7.",
      highlight: "Replaced expensive DevOps consultant",
    },
    {
      name: "Priya Patel",
      role: "Lead Developer",
      company: "InnovateLabs",
      avatar: "PP",
      rating: 5,
      content:
        "The security features are outstanding. Automated vulnerability scanning and compliance checks give us peace of mind. Our deployment time reduced by 80% while improving security.",
      highlight: "Enhanced security & faster deploys",
    },
    {
      name: "David Kim",
      role: "CTO",
      company: "CloudFirst",
      avatar: "DK",
      rating: 5,
      content:
        "Deployio's multi-cloud support is phenomenal. We can deploy to AWS, Azure, and GCP with the same ease. The cost optimization suggestions alone saved us 40% on infrastructure costs.",
      highlight: "Saved 40% on infrastructure costs",
    },
    {
      name: "Emily Johnson",
      role: "Backend Developer",
      company: "DevCorp",
      avatar: "EJ",
      rating: 5,
      content:
        "The learning curve was practically non-existent. I went from knowing nothing about Docker to deploying containerized apps in production within a day. The AI explanations are incredibly helpful.",
      highlight: "Zero to production in 1 day",
    },
    {
      name: "Alex Thompson",
      role: "Software Architect",
      company: "ScaleTech",
      avatar: "AT",
      rating: 5,
      content:
        "What impressed me most is how Deployio handles complex microservices architectures. It automatically detects service dependencies and creates optimized deployment strategies.",
      highlight: "Simplified microservices deployment",
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

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
      className="py-20 sm:py-24 md:py-32 bg-neutral-950 relative overflow-hidden"
      id="testimonials"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(34,197,94,0.1)_0%,transparent_50%)]" />

        {/* Floating testimonial icons */}
        <div className="absolute top-20 left-20 text-blue-400/30 animate-float">
          <FaQuoteLeft className="w-6 h-6" />
        </div>
        <div className="absolute top-40 right-32 text-purple-400/30 animate-float delay-1000">
          <FaUsers className="w-8 h-8" />
        </div>
        <div className="absolute bottom-32 left-40 text-green-400/30 animate-float delay-2000">
          <FaStar className="w-7 h-7" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6">
            <FaUsers className="w-4 h-4 mr-2" />
            Loved by developers worldwide
          </div>

          <h2 className="heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 px-4">
            What Developers Are{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400">
              Saying
            </span>
          </h2>
          <p className="body text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
            Join thousands of developers who have transformed their deployment
            workflow with our AI-powered platform.
          </p>
        </motion.div>

        {/* Main Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative"
        >
          {/* Main Testimonial Card */}
          <div className="relative bg-gradient-to-r from-neutral-900/80 via-neutral-800/80 to-neutral-900/80 backdrop-blur-lg rounded-3xl border border-neutral-700/50 p-8 sm:p-12 md:p-16 shadow-2xl min-h-[400px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <div className="grid lg:grid-cols-3 gap-8 items-center">
                  {/* Testimonial Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <FaQuoteLeft className="text-4xl text-blue-400/50" />
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
                  <div className="flex lg:flex-col items-center lg:items-center space-x-4 lg:space-x-0 lg:space-y-4">
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
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-neutral-800/80 backdrop-blur-sm border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-neutral-700 transition-all duration-300 group"
            >
              <FaChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>

            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-neutral-800/80 backdrop-blur-sm border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-neutral-700 transition-all duration-300 group"
            >
              <FaChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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

        {/* Mini Testimonials Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16"
        >
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
              }
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-neutral-900/50 backdrop-blur-sm p-6 rounded-2xl border border-neutral-700/50 hover:border-blue-500/30 transition-all duration-300 group"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="text-white font-semibold">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-400 text-sm">{testimonial.company}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex space-x-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FaStar key={i} className="text-yellow-400 w-3 h-3" />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
