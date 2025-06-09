const fs = require("fs");
const path = require("path");

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
      console.error("Error loading email templates:", error);
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
      return `
        <div style="${actionConfig.style}">
          <div style="${actionConfig.topBar}"></div>
          <div style="${actionConfig.innerStyle}">${variables.otp}</div>
          <p style="color: #737373; font-size: 14px; margin: 16px 0 0 0; font-weight: 500;">${actionConfig.subtitle}</p>
        </div>
      `;
    } else if (actionConfig.type === "button") {
      const url = this.replaceVariables(actionConfig.url, variables);
      return `
        <div style="text-align: center; margin: 0 0 32px 0;">
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
      <div style="background: #1f1f1f; border: 1px solid #404040; border-radius: 12px; padding: 20px; margin: 0 0 32px 0;">
        <p style="color: #a3a3a3; font-size: 14px; line-height: 1.5; margin: 0; display: flex; align-items: flex-start; gap: 8px;">
          <span style="color: #fbbf24; font-size: 16px; margin-top: 1px;">${warningConfig.icon}</span>
          <span>${warningConfig.text}</span>
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
      <div style="background: #0f1419; border: 1px solid #374151; border-radius: 8px; padding: 16px;">
        <p style="color: #9ca3af; font-size: 13px; margin: 0; line-height: 1.4;">
          <strong style="color: #d1d5db;">${fallbackConfig.title}</strong><br>
          ${fallbackConfig.text} <br>
          <span style="color: #dc2626; word-break: break-all; font-family: monospace; font-size: 12px;">${url}</span>
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
      const content = templateConfig.content;

      // Build content HTML
      let contentHtml = `
        <h2 style="font-family: 'Space Grotesk', sans-serif; color: #f5f5f5; font-size: 24px; font-weight: 600; margin: 0 0 ${
          templateName === "otp" ? "8px" : "24px"
        } 0; letter-spacing: -0.02em;">${content.heading}</h2>
      `;

      // Add greeting for OTP
      if (content.greeting) {
        const greeting = this.replaceVariables(content.greeting, variables);
        contentHtml += `
          <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">${greeting}</p>
        `;
      }

      // Add message
      if (content.message) {
        contentHtml += `
          <p style="color: #d4d4d4; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">${content.message}</p>
        `;
      }

      // Add instruction (for password reset)
      if (content.instruction) {
        contentHtml += `
          <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">${content.instruction}</p>
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
      }

      // Prepare template variables
      const templateVariables = {
        title: templateConfig.title,
        headerGradient: templateConfig.headerGradient,
        icon: templateConfig.icon,
        iconColor: templateConfig.iconColor,
        brandColor: templateConfig.brandColor,
        content: contentHtml,
        currentYear: new Date().getFullYear(),
      };

      // Render final template
      return this.replaceVariables(this.baseTemplate, templateVariables);
    } catch (error) {
      console.error(`Error rendering email template '${templateName}':`, error);
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
