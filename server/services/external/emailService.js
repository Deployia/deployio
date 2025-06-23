const nodemailer = require("nodemailer");
const EmailTemplateRenderer = require("../../utils/EmailTemplateRenderer");
const NotificationTemplates = require("../notification/templates/notificationTemplates");
const logger = require("../../config/logger");

// Initialize template renderers
const templateRenderer = new EmailTemplateRenderer();
const notificationTemplates = new NotificationTemplates();

/**
 * Send email using nodemailer
 * @param {Object} options - Email options (to, subject, template, variables, text, html)
 * @returns {Promise<Object>} Result of sending email
 */
const sendEmail = async (options) => {
  try {
    // Validate required options
    if (!options || typeof options !== "object") {
      throw new Error("Email options are required");
    }

    if (!options.to) {
      throw new Error("Recipient email address is required");
    }

    if (!options.subject) {
      throw new Error("Email subject is required");
    }

    // Validate email environment variables
    if (
      !process.env.EMAIL_SERVICE ||
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASSWORD
    ) {
      throw new Error(
        "Email service configuration is incomplete. Check environment variables."
      );
    } // Create transporter with connection pooling and timeout settings
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    // Handle template rendering - check if it's a notification template first
    let html = options.html;
    let finalSubject = options.subject;

    if (options.template) {
      try {
        // First try our notification template system
        const notificationTemplate = notificationTemplates.getTemplate(
          options.template
        );

        if (notificationTemplate) {
          // Use our notification template system
          const rendered = notificationTemplates.render(
            options.template,
            options.variables || {}
          );
          html = rendered.html;
          finalSubject = rendered.subject; // Use template subject if not provided
          logger.info(`Using notification template: ${options.template}`);
        } else {
          // Fallback to old template renderer for backward compatibility
          html = templateRenderer.render(
            options.template,
            options.variables || {}
          );
          logger.info(`Using legacy template: ${options.template}`);
        }
      } catch (templateError) {
        logger.error(
          `Error rendering email template '${options.template}':`,
          templateError
        );
        throw new Error(
          `Error rendering email template: ${templateError.message}`
        );
      }
    }

    // Ensure we have either HTML or text content
    if (!html && !options.text) {
      throw new Error("Email must have either HTML or text content");
    } // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM
        ? `DeployIO <${process.env.EMAIL_FROM}>`
        : process.env.EMAIL_USER,
      to: options.to,
      subject: finalSubject || options.subject,
      text: options.text,
      html,
      // Add additional security headers
      headers: {
        "X-Priority": "3",
        "X-Mailer": "DeployIO Email Service",
        "X-Auto-Response-Suppress": "All",
      },
    };

    // Send email with retry logic
    const result = await transporter.sendMail(mailOptions);

    // Close the transporter connection
    transporter.close();

    // Return success result
    return {
      success: true,
      messageId: result.messageId,
      response: result.response,
      to: options.to,
      subject: options.subject,
    };
  } catch (error) {
    // Log the error for debugging (but don't expose sensitive details to the caller)
    logger.error("Email service error:", {
      error: error.message,
      to: options?.to,
      subject: options?.subject,
      template: options?.template,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    });

    // Throw a more user-friendly error
    if (error.code === "EAUTH") {
      throw new Error(
        "Email authentication failed. Please check email service configuration."
      );
    } else if (error.code === "ECONNECTION") {
      throw new Error(
        "Failed to connect to email service. Please try again later."
      );
    } else if (error.code === "EMESSAGE") {
      throw new Error("Invalid email message format.");
    } else {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
};

module.exports = { sendEmail };
