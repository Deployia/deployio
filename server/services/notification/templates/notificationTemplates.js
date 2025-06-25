const logger = require("../../../config/logger");
const path = require("path");
const fs = require("fs");
const Handlebars = require("./html/helpers");

// Register partials
const partialsDir = path.join(__dirname, "html", "partials");
fs.readdirSync(partialsDir).forEach((file) => {
  if (file.endsWith(".hbs")) {
    const partialName = path.basename(file, ".hbs");
    const partialContent = fs.readFileSync(
      path.join(partialsDir, file),
      "utf8"
    );
    Handlebars.registerPartial(partialName, partialContent);
  }
});

class NotificationTemplates {
  constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }

  /**
   * Load all notification templates
   */
  loadTemplates() {
    // Map template keys to Handlebars file names and text/subject
    this.templates.set("auth.otp_verification", {
      hbs: "otp.hbs",
      subject: "🔐 Verify your DeployIO account - OTP: {{otp}}",
      text: `Verify your DeployIO account\n\nHi {{username}},\n\nYour Verification Code: {{otp}}\n\nThis code will expire in {{expiresIn}}.\n\nImportant: Keep this code secure and do not share it with anyone.\n\nVerify your account: {{actionUrl}}\n\nIf you didn't request this verification code, please ignore this email.\n\nBest regards,\nThe DeployIO Team`,
    });
    this.templates.set("auth.password_reset", {
      hbs: "passwordReset.hbs",
      subject: "🔑 Reset your DeployIO password",
      text: `Password Reset Request\n\nHi {{username}},\n\nYou requested a password reset for your DeployIO account.\nReset your password: {{resetLink}}\n\nThis link will expire in {{expiresIn}}.\nIf you didn't request this reset, please ignore this email.\nYour password will remain unchanged until you create a new one.\n\nBest regards,\nThe DeployIO Team`,
    });
    this.templates.set("auth.welcome", {
      hbs: "welcome.hbs",
      subject: "🎉 Welcome to DeployIO! Your account is ready",
      text: `Welcome to DeployIO!\n\nHi {{username}},\n\nCongratulations! Your DeployIO account has been successfully verified and is now ready to use.\n\nWhat you can do with DeployIO:\n- Deploy applications with just a few clicks\n- Monitor performance with real-time analytics\n- Secure infrastructure with built-in security features\n- Scale effortlessly based on demand\n\nReady to get started? Access your dashboard: {{dashboardUrl}}\n\nBest regards,\nThe DeployIO Team`,
    });
    this.templates.set("deployment.success", {
      hbs: "deploymentSuccess.hbs",
      subject: "✅ Deployment Successful - {{projectName}}",
      text: `Deployment Successful - {{projectName}}\n\nHi {{userName}},\n\nGreat news! Your deployment for {{projectName}} has completed successfully.\n\nDeployment Details:\n- Project: {{projectName}}\n- Environment: {{environment}}\n- Completed: {{timestamp}}\n- Duration: {{duration}}\n\nYour application is now live and accessible to users.\n\nBest regards,\nThe DeployIO Team`,
    });
    this.templates.set("deployment.failed", {
      hbs: "deploymentFailed.hbs",
      subject: "❌ Deployment Failed - {{projectName}}",
      text: `Deployment Failed - {{projectName}}\n\nHi {{userName}},\n\nUnfortunately, your deployment for {{projectName}} has failed.\n\nDeployment Details:\n- Project: {{projectName}}\n- Environment: {{environment}}\n- Failed: {{timestamp}}\n- Reason: {{reason}}\n\nPlease check the deployment logs for more details and try again.\n\nBest regards,\nThe DeployIO Team`,
    });
    this.templates.set("deployment.started", {
      hbs: "deploymentStarted.hbs",
      subject: "🚀 Deployment Started - {{projectName}}",
      text: `Deployment Started - {{projectName}}\n\nHi {{userName}},\n\nYour deployment for {{projectName}} has started successfully.\n\nDeployment Details:\n- Project: {{projectName}}\n- Environment: {{environment}}\n- Started: {{timestamp}}\n\nYou'll receive another notification once the deployment is complete.\n\nBest regards,\nThe DeployIO Team`,
    });
    this.templates.set("deployment.stopped", {
      hbs: "deploymentStopped.hbs",
      subject: "⏹️ Deployment Stopped - {{projectName}}",
      text: `Deployment Stopped - {{projectName}}\n\nHi {{userName}},\n\nYour deployment for {{projectName}} has been stopped.\n\nDeployment Details:\n- Project: {{projectName}}\n- Environment: {{environment}}\n- Stopped: {{timestamp}}\n- Reason: {{reason}}\n\nYou can restart the deployment from your project dashboard.\n\nBest regards,\nThe DeployIO Team`,
    });
    // ...add more as needed...
  }

  /**
   * Get template by name
   * @param {string} templateName - Template name
   * @returns {Object|null} Template object
   */
  getTemplate(templateName) {
    return this.templates.get(templateName) || null;
  }

  /**
   * Render template with variables using Handlebars for HTML, string replace for text/subject
   * @param {string} templateName - Template name
   * @param {Object} variables - Template variables
   * @returns {Object} Rendered template
   */
  render(templateName, variables = {}) {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }
    try {
      // Render HTML with Handlebars
      let html = "";
      if (template.hbs) {
        const hbsPath = path.join(__dirname, "html", template.hbs);
        const hbsContent = fs.readFileSync(hbsPath, "utf8");
        const compiled = Handlebars.compile(hbsContent);
        // Render into base layout
        const basePath = path.join(__dirname, "html", "base.hbs");
        const baseContent = fs.readFileSync(basePath, "utf8");
        const baseCompiled = Handlebars.compile(baseContent);
        const body = compiled(variables);
        html = baseCompiled({ ...variables, body });
      }
      // Render text and subject with simple interpolation
      const text = this.interpolateString(template.text, variables);
      const subject = this.interpolateString(template.subject, variables);
      return { html, text, subject };
    } catch (error) {
      logger.error("Template rendering failed", {
        templateName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Simple interpolation for text/subject
   */
  interpolateString(template, variables) {
    if (!template) return "";
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }
}

module.exports = NotificationTemplates;
