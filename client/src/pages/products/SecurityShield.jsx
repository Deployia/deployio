import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaLock,
  FaKey,
  FaEye,
  FaUserShield,
  FaCloud,
  FaServer,
  FaCheck,
  FaBug,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import SEO from "@components/SEO";

const SecurityShield = () => {
  const securityFeatures = [
    {
      icon: FaLock,
      title: "End-to-End Encryption",
      description:
        "All data encrypted in transit and at rest using AES-256 encryption",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      icon: FaKey,
      title: "Multi-Factor Authentication",
      description: "Secure access with 2FA, TOTP, and hardware security keys",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      icon: FaEye,
      title: "Vulnerability Scanning",
      description:
        "Automated security scans for dependencies and code vulnerabilities",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      icon: FaUserShield,
      title: "Role-Based Access Control",
      description:
        "Granular permissions and access control for teams and projects",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      icon: FaCloud,
      title: "Cloud Security Posture",
      description: "Monitor and enforce cloud security best practices",
      color: "text-cyan-600",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
    },
    {
      icon: FaServer,
      title: "Infrastructure Protection",
      description:
        "Secure your infrastructure with automated compliance checks",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ];

  const complianceStandards = [
    { name: "SOC 2 Type II", icon: FaCheckCircle },
    { name: "ISO 27001", icon: FaCheckCircle },
    { name: "GDPR", icon: FaCheckCircle },
    { name: "HIPAA", icon: FaCheckCircle },
    { name: "PCI DSS", icon: FaCheckCircle },
    { name: "FedRAMP", icon: FaCheckCircle },
  ];

  const threatDetection = [
    {
      type: "Critical",
      count: 0,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
      description: "Immediate action required",
    },
    {
      type: "High",
      count: 2,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      description: "High priority issues",
    },
    {
      type: "Medium",
      count: 5,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      description: "Moderate risk issues",
    },
    {
      type: "Low",
      count: 12,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      description: "Low risk informational",
    },
  ];

  const securityMetrics = [
    { label: "Security Score", value: "98%", trend: "+2%" },
    { label: "Vulnerabilities Fixed", value: "847", trend: "+15%" },
    { label: "Compliance Rating", value: "A+", trend: "stable" },
    { label: "Response Time", value: "< 2min", trend: "-30%" },
  ];

  return (
    <>
      {" "}
      <SEO page="securityShield" />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-6">
                <FaShieldAlt className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Security
                <span className="text-red-600 dark:text-red-400"> Shield</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                Enterprise-grade security for your deployments. Automated
                vulnerability scanning, compliance monitoring, and threat
                detection built for modern DevOps.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors">
                  Start Security Scan
                </button>
                <button className="px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-semibold transition-colors">
                  View Security Report
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Security Metrics Dashboard */}
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Security Dashboard
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Real-time security monitoring and threat detection
              </p>
            </motion.div>

            {/* Security Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {securityMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {metric.label}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </span>
                    <span
                      className={`text-sm ${
                        metric.trend.startsWith("+")
                          ? "text-green-600"
                          : metric.trend.startsWith("-")
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {metric.trend}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Threat Detection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Threat Detection Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {threatDetection.map((threat, index) => (
                  <div key={threat.type} className="text-center">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${threat.bgColor} mb-4`}
                    >
                      <span className={`text-2xl font-bold ${threat.color}`}>
                        {threat.count}
                      </span>
                    </div>
                    <h4
                      className={`text-lg font-semibold ${threat.color} mb-2`}
                    >
                      {threat.type}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {threat.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Comprehensive Security Features
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Protect every aspect of your deployment pipeline
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
                  >
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${feature.bgColor} mb-6`}
                    >
                      <Icon className={`w-7 h-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Compliance Section */}
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Compliance & Certifications
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Meet industry standards and regulatory requirements
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {complianceStandards.map((standard, index) => {
                const Icon = standard.icon;
                return (
                  <motion.div
                    key={standard.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl transition-shadow"
                  >
                    <Icon className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {standard.name}
                    </h3>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-12 text-white"
            >
              <FaShieldAlt className="w-16 h-16 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Secure Your Deployments Today
              </h2>
              <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
                Don't wait for a security incident. Start protecting your
                applications with enterprise-grade security features designed
                for modern DevOps teams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Start Free Security Audit
                </button>
                <button className="px-8 py-4 border border-red-300 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                  Contact Security Team
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SecurityShield;
