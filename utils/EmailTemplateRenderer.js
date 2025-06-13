const fs = require("fs");
const path = require("path");
const logger = require("../config/logger"); // Added logger

/**
 * Email template renderer using base template and configuration
 */
class EmailTemplateRenderer {
  constructor() {
    this.templatesDir = path.join(__dirname, "../templates/email");
    this.baseTemplate = null;
    this.config = null;
    this.loadTemplates();
  }

  /**
   * Load base template and configuration
   */
  loadTemplates() {
    try {
      // Load base template
      const baseTemplatePath = path.join(this.templatesDir, "base.html");
      this.baseTemplate = fs.readFileSync(baseTemplatePath, "utf-8");

      // Load configuration
      const configPath = path.join(this.templatesDir, "config.json");
      this.config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (error) {
      logger.error("Error loading email templates:", {
        error: error.message,
        stack: error.stack,
      }); // Replaced console.error
      throw new Error("Failed to load email templates");
    }
  }

  /**
   * Replace template variables with values
   * @param {string} template - Template string
   * @param {Object} variables - Variables to replace
   * @returns {string} Rendered template
   */
  replaceVariables(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Render main action content based on type
   * @param {Object} actionConfig - Action configuration
   * @param {Object} variables - Template variables
   * @returns {string} Rendered action HTML
   */
  renderMainAction(actionConfig, variables) {
    if (actionConfig.type === "otp") {
      return `        <div style="${actionConfig.style}">
          <div style="${actionConfig.innerStyle}">${variables.otp}</div>
          <p style="color: #737373; font-size: 14px; margin: 10px 0 0 0; text-align: center; font-family: 'DM Sans', sans-serif;">${actionConfig.subtitle}</p>
        </div>
      `;
    } else if (actionConfig.type === "button") {
      const url = this.replaceVariables(actionConfig.url, variables);
      return `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${url}" style="${actionConfig.style}">
            ${actionConfig.text}
          </a>
        </div>
      `;
    }
    return "";
  }
  /**
   * Render warning box
   * @param {Object} warningConfig - Warning configuration
   * @returns {string} Rendered warning HTML
   */
  renderWarning(warningConfig) {
    return `
      <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0; backdrop-filter: blur(8px);">
        <p style="font-size: 14px; line-height: 1.5; margin: 0; color: #a3a3a3;">
          ${warningConfig.text}
        </p>
      </div>
    `;
  }
  /**
   * Render fallback section for password reset
   * @param {Object} fallbackConfig - Fallback configuration
   * @param {Object} variables - Template variables
   * @returns {string} Rendered fallback HTML
   */
  renderFallback(fallbackConfig, variables) {
    if (!fallbackConfig) return "";

    const url = this.replaceVariables(fallbackConfig.url, variables);
    return `
      <div style="background-color: rgba(23, 23, 23, 0.5); border: 1px solid #404040; border-radius: 8px; padding: 16px; margin: 20px 0; backdrop-filter: blur(8px);">
        <p style="color: #a3a3a3; font-size: 14px; margin: 0; line-height: 1.4;">
          <strong style="color: #ffffff;">${fallbackConfig.title}</strong><br>
          ${fallbackConfig.text} <br>
          <span style="color: #a855f7; word-break: break-all; font-family: 'Space Grotesk', monospace; font-size: 12px;">${url}</span>
        </p>
      </div>
    `;
  }

  /**
   * Render email template
   * @param {string} templateName - Name of the template (otp, passwordReset)
   * @param {Object} variables - Variables to replace in template
   * @returns {string} Rendered HTML email
   */
  render(templateName, variables = {}) {
    try {
      if (!this.config[templateName]) {
        throw new Error(`Template '${templateName}' not found`);
      }

      const templateConfig = this.config[templateName];
      const content = templateConfig.content; // Build content HTML
      let contentHtml = `
        <h2 style="font-family: 'Space Grotesk', sans-serif; color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: -0.04em;">${content.heading}</h2>
      `;

      // Add greeting
      if (content.greeting) {
        const greeting = this.replaceVariables(content.greeting, variables);
        contentHtml += `
          <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; font-family: 'DM Sans', sans-serif;">${greeting}</p>
        `;
      }

      // Add message
      if (content.message) {
        contentHtml += `
          <p style="color: #d4d4d4; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; font-family: 'DM Sans', sans-serif;">${content.message}</p>
        `;
      }

      // Add main action
      if (content.mainAction) {
        contentHtml += this.renderMainAction(content.mainAction, variables);
      }

      // Add warning
      if (content.warning) {
        contentHtml += this.renderWarning(content.warning);
      }

      // Add fallback (for password reset)
      if (content.fallback) {
        contentHtml += this.renderFallback(content.fallback, variables);
      } // Add support text if available
      if (content.support) {
        contentHtml += `
          <p style="color: #737373; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0; text-align: center; font-family: 'DM Sans', sans-serif;">${content.support.text}</p>
        `;
      }

      // Prepare template variables
      const templateVariables = {
        title: templateConfig.title,
        content: contentHtml,
        currentYear: new Date().getFullYear(),
      };

      // Render final template
      return this.replaceVariables(this.baseTemplate, templateVariables);
    } catch (error) {
      logger.error(`Error rendering email template '${templateName}':`, {
        error: error.message,
        stack: error.stack,
        templateName,
      }); // Replaced console.error
      throw new Error(`Failed to render email template: ${error.message}`);
    }
  }

  /**
   * Get list of available templates
   * @returns {string[]} Array of template names
   */
  getAvailableTemplates() {
    return Object.keys(this.config);
  }

  /**
   * Reload templates from disk (useful for development)
   */
  reloadTemplates() {
    this.loadTemplates();
  }
}

module.exports = EmailTemplateRenderer;
