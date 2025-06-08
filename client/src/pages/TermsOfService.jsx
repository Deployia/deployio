import { motion } from "framer-motion";
import {
  FaGavel,
  FaUserCheck,
  FaExclamationTriangle,
  FaHandshake,
} from "react-icons/fa";

function TermsOfService() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black"
    >
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/10 rounded-2xl border border-purple-500/20 mb-6"
          >
            <FaGavel className="w-8 h-8 text-purple-400" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-4 heading">
            Terms of Service
          </h1>
          <p className="text-neutral-400 body max-w-2xl mx-auto">
            Please read these terms carefully before using our service. By
            accessing DeployIO, you agree to these terms.
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaHandshake className="w-5 h-5 text-green-400" />
              <h2 className="text-2xl font-semibold text-white heading">
                Acceptance of Terms
              </h2>
            </div>
            <div className="space-y-4 text-neutral-300 body">
              <p>
                By accessing and using DeployIO, you accept and agree to be
                bound by the terms and provision of this agreement. If you do
                not agree to abide by the above, please do not use this service.
              </p>
              <p>
                These terms may be updated from time to time. Continued use of
                the service constitutes acceptance of any changes.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaUserCheck className="w-5 h-5 text-blue-400" />
              <h2 className="text-2xl font-semibold text-white heading">
                User Accounts
              </h2>
            </div>
            <div className="space-y-4 text-neutral-300 body">
              <p>
                When you create an account with us, you must provide information
                that is accurate, complete, and current at all times.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  You are responsible for safeguarding your account credentials
                </li>
                <li>You must not share your account with others</li>
                <li>You must notify us immediately of any unauthorized use</li>
                <li>
                  You are responsible for all activities that occur under your
                  account
                </li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
          >
            <h2 className="text-2xl font-semibold text-white mb-4 heading">
              Acceptable Use
            </h2>
            <div className="space-y-4 text-neutral-300 body">
              <p>You agree not to use the service:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  For any unlawful purpose or to solicit others to perform
                  unlawful acts
                </li>
                <li>
                  To violate any international, federal, provincial, or state
                  regulations, rules, laws, or local ordinances
                </li>
                <li>
                  To infringe upon or violate our intellectual property rights
                  or the intellectual property rights of others
                </li>
                <li>
                  To harass, abuse, insult, harm, defame, slander, disparage,
                  intimidate, or discriminate
                </li>
                <li>To submit false or misleading information</li>
                <li>
                  To upload or transmit viruses or any other type of malicious
                  code
                </li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
          >
            <h2 className="text-2xl font-semibold text-white mb-4 heading">
              Service Availability
            </h2>
            <div className="space-y-4 text-neutral-300 body">
              <p>
                We strive to maintain high availability of our service, but we
                do not guarantee uninterrupted access. The service may be
                temporarily unavailable due to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Scheduled maintenance</li>
                <li>Emergency maintenance</li>
                <li>Technical difficulties</li>
                <li>Circumstances beyond our reasonable control</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="w-5 h-5 text-yellow-400" />
              <h2 className="text-2xl font-semibold text-white heading">
                Limitation of Liability
              </h2>
            </div>
            <div className="space-y-4 text-neutral-300 body">
              <p>
                In no event shall DeployIO, nor its directors, employees,
                partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, special, consequential, or punitive
                damages, including without limitation, loss of profits, data,
                use, goodwill, or other intangible losses, resulting from your
                use of the service.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
          >
            <h2 className="text-2xl font-semibold text-white mb-4 heading">
              Termination
            </h2>
            <div className="space-y-4 text-neutral-300 body">
              <p>
                We may terminate or suspend your account immediately, without
                prior notice or liability, for any reason whatsoever, including
                without limitation if you breach the Terms.
              </p>
              <p>
                Upon termination, your right to use the service will cease
                immediately. If you wish to terminate your account, you may
                simply discontinue using the service.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800"
          >
            <h2 className="text-2xl font-semibold text-white mb-4 heading">
              Contact Information
            </h2>
            <div className="text-neutral-300 body">
              <p>
                If you have any questions about these Terms of Service, please
                contact us at{" "}
                <a
                  href="mailto:legal@deployio.tech"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  legal@deployio.tech
                </a>
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}

export default TermsOfService;
