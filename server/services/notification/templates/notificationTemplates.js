const logger = require("../../../config/logger");

class NotificationTemplates {
  constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }

  /**
   * Load all notification templates
   */
  loadTemplates() {
    // Deployment templates
    this.templates.set(
      "deployment-started",
      this.getDeploymentStartedTemplate()
    );
    this.templates.set(
      "deployment-success",
      this.getDeploymentSuccessTemplate()
    );
    this.templates.set("deployment-failed", this.getDeploymentFailedTemplate());
    this.templates.set(
      "deployment-stopped",
      this.getDeploymentStoppedTemplate()
    );

    // Project templates
    this.templates.set(
      "project-analysis-complete",
      this.getProjectAnalysisCompleteTemplate()
    );
    this.templates.set(
      "project-analysis-failed",
      this.getProjectAnalysisFailedTemplate()
    );
    this.templates.set(
      "project-collaborator-added",
      this.getProjectCollaboratorAddedTemplate()
    );

    // Security templates
    this.templates.set(
      "security-new-device-login",
      this.getSecurityNewDeviceLoginTemplate()
    );
    this.templates.set(
      "security-password-changed",
      this.getSecurityPasswordChangedTemplate()
    );
    this.templates.set(
      "security-2fa-enabled",
      this.getSecurity2FAEnabledTemplate()
    );
    this.templates.set(
      "security-2fa-disabled",
      this.getSecurity2FADisabledTemplate()
    );
    this.templates.set(
      "security-api-key-created",
      this.getSecurityApiKeyCreatedTemplate()
    );

    // System templates
    this.templates.set(
      "system-maintenance",
      this.getSystemMaintenanceTemplate()
    );
    this.templates.set("system-update", this.getSystemUpdateTemplate());
    this.templates.set(
      "system-quota-warning",
      this.getSystemQuotaWarningTemplate()
    );
    this.templates.set(
      "system-quota-exceeded",
      this.getSystemQuotaExceededTemplate()
    );

    // General templates
    this.templates.set("general-welcome", this.getGeneralWelcomeTemplate());
    this.templates.set(
      "general-announcement",
      this.getGeneralAnnouncementTemplate()
    );
    this.templates.set(
      "generic-notification",
      this.getGenericNotificationTemplate()
    );

    logger.info("Notification templates loaded", {
      templateCount: this.templates.size,
    });
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
   * Render template with variables
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
      const rendered = {
        html: this.interpolateString(template.html, variables),
        text: this.interpolateString(template.text, variables),
        subject: this.interpolateString(template.subject, variables),
      };

      return rendered;
    } catch (error) {
      logger.error("Template rendering failed", {
        templateName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Interpolate template string with variables
   * @param {string} template - Template string
   * @param {Object} variables - Variables to interpolate
   * @returns {string} Interpolated string
   */
  interpolateString(template, variables) {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(variables, path);
      return value !== undefined ? value : match;
    });
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {any} Value at path
   */
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Template definitions

  getDeploymentStartedTemplate() {
    return {
      subject: "🚀 Deployment Started - {{projectName}}",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deployment Started</title>
            ${this.getBaseStyles()}
        </head>
        <body>
            ${this.getHeader()}
            <div class="content">
                <div class="status-icon success">🚀</div>
                <h2>Deployment Started</h2>
                <p>Hi {{userName}},</p>
                <p>Your deployment for <strong>{{projectName}}</strong> has started successfully.</p>
                
                <div class="details">
                    <h3>Deployment Details</h3>
                    <ul>
                        <li><strong>Project:</strong> {{projectName}}</li>
                        <li><strong>Environment:</strong> {{environment}}</li>
                        <li><strong>Started:</strong> {{timestamp}}</li>
                    </ul>
                </div>

                <p>You'll receive another notification once the deployment is complete.</p>
                
                {{#if deploymentUrl}}
                <div class="cta">
                    <a href="{{deploymentUrl}}" class="button">View Deployment</a>
                </div>
                {{/if}}
            </div>
            ${this.getFooter()}
        </body>
        </html>
      `,
      text: `
Deployment Started - {{projectName}}

Hi {{userName}},

Your deployment for {{projectName}} has started successfully.

Deployment Details:
- Project: {{projectName}}
- Environment: {{environment}}
- Started: {{timestamp}}

You'll receive another notification once the deployment is complete.

{{#if deploymentUrl}}View Deployment: {{deploymentUrl}}{{/if}}

Best regards,
The DeployIO Team
      `.trim(),
    };
  }

  getDeploymentSuccessTemplate() {
    return {
      subject: "✅ Deployment Successful - {{projectName}}",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deployment Successful</title>
            ${this.getBaseStyles()}
        </head>
        <body>
            ${this.getHeader()}
            <div class="content">
                <div class="status-icon success">✅</div>
                <h2>Deployment Successful!</h2>
                <p>Hi {{userName}},</p>
                <p>Great news! Your deployment for <strong>{{projectName}}</strong> has completed successfully.</p>
                
                <div class="details">
                    <h3>Deployment Details</h3>
                    <ul>
                        <li><strong>Project:</strong> {{projectName}}</li>
                        <li><strong>Environment:</strong> {{environment}}</li>
                        <li><strong>Completed:</strong> {{timestamp}}</li>
                        {{#if duration}}<li><strong>Duration:</strong> {{duration}}</li>{{/if}}
                    </ul>
                </div>

                <p>Your application is now live and accessible to users.</p>
                
                {{#if deploymentUrl}}
                <div class="cta">
                    <a href="{{deploymentUrl}}" class="button">View Live Application</a>
                </div>
                {{/if}}
            </div>
            ${this.getFooter()}
        </body>
        </html>
      `,
      text: `
Deployment Successful - {{projectName}}

Hi {{userName}},

Great news! Your deployment for {{projectName}} has completed successfully.

Deployment Details:
- Project: {{projectName}}
- Environment: {{environment}}
- Completed: {{timestamp}}
{{#if duration}}- Duration: {{duration}}{{/if}}

Your application is now live and accessible to users.

{{#if deploymentUrl}}View Live Application: {{deploymentUrl}}{{/if}}

Best regards,
The DeployIO Team
      `.trim(),
    };
  }

  getDeploymentFailedTemplate() {
    return {
      subject: "❌ Deployment Failed - {{projectName}}",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deployment Failed</title>
            ${this.getBaseStyles()}
        </head>
        <body>
            ${this.getHeader()}
            <div class="content">
                <div class="status-icon error">❌</div>
                <h2>Deployment Failed</h2>
                <p>Hi {{userName}},</p>
                <p>Unfortunately, your deployment for <strong>{{projectName}}</strong> has failed.</p>
                
                <div class="details">
                    <h3>Deployment Details</h3>
                    <ul>
                        <li><strong>Project:</strong> {{projectName}}</li>
                        <li><strong>Environment:</strong> {{environment}}</li>
                        <li><strong>Failed:</strong> {{timestamp}}</li>
                    </ul>
                </div>

                {{#if errorMessage}}
                <div class="error-details">
                    <h3>Error Details</h3>
                    <p class="error-message">{{errorMessage}}</p>
                </div>
                {{/if}}

                <p>Please check the deployment logs for more details and try again.</p>
                
                <div class="cta">
                    {{#if logsUrl}}
                    <a href="{{logsUrl}}" class="button">View Logs</a>
                    {{/if}}
                    <a href="{{appUrl}}/projects/{{projectName}}" class="button secondary">Go to Project</a>
                </div>
            </div>
            ${this.getFooter()}
        </body>
        </html>
      `,
      text: `
Deployment Failed - {{projectName}}

Hi {{userName}},

Unfortunately, your deployment for {{projectName}} has failed.

Deployment Details:
- Project: {{projectName}}
- Environment: {{environment}}
- Failed: {{timestamp}}

{{#if errorMessage}}
Error Details:
{{errorMessage}}
{{/if}}

Please check the deployment logs for more details and try again.

{{#if logsUrl}}View Logs: {{logsUrl}}{{/if}}
Go to Project: {{appUrl}}/projects/{{projectName}}

Best regards,
The DeployIO Team
      `.trim(),
    };
  }

  getDeploymentStoppedTemplate() {
    return {
      subject: "⏹️ Deployment Stopped - {{projectName}}",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deployment Stopped</title>
            ${this.getBaseStyles()}
        </head>
        <body>
            ${this.getHeader()}
            <div class="content">
                <div class="status-icon warning">⏹️</div>
                <h2>Deployment Stopped</h2>
                <p>Hi {{userName}},</p>
                <p>Your deployment for <strong>{{projectName}}</strong> has been stopped.</p>
                
                <div class="details">
                    <h3>Deployment Details</h3>
                    <ul>
                        <li><strong>Project:</strong> {{projectName}}</li>
                        <li><strong>Environment:</strong> {{environment}}</li>
                        <li><strong>Stopped:</strong> {{timestamp}}</li>
                        <li><strong>Reason:</strong> {{reason}}</li>
                    </ul>
                </div>

                <p>You can restart the deployment from your project dashboard.</p>
                
                <div class="cta">
                    <a href="{{appUrl}}/projects/{{projectName}}" class="button">Go to Project</a>
                </div>
            </div>
            ${this.getFooter()}
        </body>
        </html>
      `,
      text: `
Deployment Stopped - {{projectName}}

Hi {{userName}},

Your deployment for {{projectName}} has been stopped.

Deployment Details:
- Project: {{projectName}}
- Environment: {{environment}}
- Stopped: {{timestamp}}
- Reason: {{reason}}

You can restart the deployment from your project dashboard.

Go to Project: {{appUrl}}/projects/{{projectName}}

Best regards,
The DeployIO Team
      `.trim(),
    };
  }

  getSecurityNewDeviceLoginTemplate() {
    return {
      subject: "🔐 New Device Login Detected",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Device Login</title>
            ${this.getBaseStyles()}
        </head>
        <body>
            ${this.getHeader()}
            <div class="content">
                <div class="status-icon warning">🔐</div>
                <h2>New Device Login Detected</h2>
                <p>Hi {{userName}},</p>
                <p>We detected a login to your DeployIO account from a new device.</p>
                
                <div class="details">
                    <h3>Login Details</h3>
                    <ul>
                        <li><strong>Time:</strong> {{loginTime}}</li>
                        <li><strong>Device:</strong> {{deviceInfo}}</li>
                        <li><strong>Location:</strong> {{location}}</li>
                        <li><strong>IP Address:</strong> {{ipAddress}}</li>
                    </ul>
                </div>

                <p>If this was you, you can safely ignore this email. If you don't recognize this login, please secure your account immediately.</p>
                
                <div class="cta">
                    <a href="{{securityUrl}}" class="button">Review Security Settings</a>
                </div>
            </div>
            ${this.getFooter()}
        </body>
        </html>
      `,
      text: `
New Device Login Detected

Hi {{userName}},

We detected a login to your DeployIO account from a new device.

Login Details:
- Time: {{loginTime}}
- Device: {{deviceInfo}}
- Location: {{location}}
- IP Address: {{ipAddress}}

If this was you, you can safely ignore this email. If you don't recognize this login, please secure your account immediately.

Review Security Settings: {{securityUrl}}

Best regards,
The DeployIO Team
      `.trim(),
    };
  }

  getGeneralWelcomeTemplate() {
    return {
      subject: "🎉 Welcome to DeployIO!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to DeployIO</title>
            ${this.getBaseStyles()}
        </head>
        <body>
            ${this.getHeader()}
            <div class="content">
                <div class="status-icon success">🎉</div>
                <h2>Welcome to DeployIO!</h2>
                <p>Hi {{userName}},</p>
                <p>Welcome to DeployIO! We're excited to have you on board.</p>
                
                <p>DeployIO makes it easy to deploy, manage, and scale your applications. Here's what you can do:</p>
                
                <div class="features">
                    <div class="feature">
                        <h3>🚀 Easy Deployments</h3>
                        <p>Deploy your applications with just a few clicks</p>
                    </div>
                    <div class="feature">
                        <h3>📊 Real-time Monitoring</h3>
                        <p>Monitor your applications and get instant alerts</p>
                    </div>
                    <div class="feature">
                        <h3>🔒 Secure by Default</h3>
                        <p>Built-in security features to keep your apps safe</p>
                    </div>
                </div>

                <p>Ready to get started? Check out our getting started guide or explore your dashboard.</p>
                
                <div class="cta">
                    <a href="{{gettingStartedUrl}}" class="button">Getting Started Guide</a>
                    <a href="{{dashboardUrl}}" class="button secondary">Go to Dashboard</a>
                </div>
            </div>
            ${this.getFooter()}
        </body>
        </html>
      `,
      text: `
Welcome to DeployIO!

Hi {{userName}},

Welcome to DeployIO! We're excited to have you on board.

DeployIO makes it easy to deploy, manage, and scale your applications. Here's what you can do:

🚀 Easy Deployments - Deploy your applications with just a few clicks
📊 Real-time Monitoring - Monitor your applications and get instant alerts  
🔒 Secure by Default - Built-in security features to keep your apps safe

Ready to get started? Check out our getting started guide or explore your dashboard.

Getting Started Guide: {{gettingStartedUrl}}
Go to Dashboard: {{dashboardUrl}}

Best regards,
The DeployIO Team
      `.trim(),
    };
  }

  getGenericNotificationTemplate() {
    return {
      subject: "{{notificationTitle}}",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{notificationTitle}}</title>
            ${this.getBaseStyles()}
        </head>
        <body>
            ${this.getHeader()}
            <div class="content">
                <h2>{{notificationTitle}}</h2>
                <p>Hi {{userName}},</p>
                <p>{{notificationMessage}}</p>
                
                {{#if action}}
                <div class="cta">
                    <a href="{{action.url}}" class="button">{{action.label}}</a>
                </div>
                {{/if}}
            </div>
            ${this.getFooter()}
        </body>
        </html>
      `,
      text: `
{{notificationTitle}}

Hi {{userName}},

{{notificationMessage}}

{{#if action}}{{action.label}}: {{action.url}}{{/if}}

Best regards,
The DeployIO Team
      `.trim(),
    };
  }

  // Add other template methods (keeping them concise for brevity)
  getProjectAnalysisCompleteTemplate() {
    return {
      subject: "✅ Project Analysis Complete - {{projectName}}",
      html: `${this.getBaseHTML(
        "✅",
        "Project Analysis Complete",
        "Your project analysis for <strong>{{projectName}}</strong> has completed successfully."
      )}`,
      text: `Project Analysis Complete - {{projectName}}\n\nHi {{userName}},\n\nYour project analysis for {{projectName}} has completed successfully.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getProjectAnalysisFailedTemplate() {
    return {
      subject: "❌ Project Analysis Failed - {{projectName}}",
      html: `${this.getBaseHTML(
        "❌",
        "Project Analysis Failed",
        "Unfortunately, the analysis for <strong>{{projectName}}</strong> has failed."
      )}`,
      text: `Project Analysis Failed - {{projectName}}\n\nHi {{userName}},\n\nUnfortunately, the analysis for {{projectName}} has failed.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getProjectCollaboratorAddedTemplate() {
    return {
      subject: "👥 New Collaborator Added - {{projectName}}",
      html: `${this.getBaseHTML(
        "👥",
        "New Collaborator Added",
        "<strong>{{collaboratorName}}</strong> has been added as a collaborator to <strong>{{projectName}}</strong>."
      )}`,
      text: `New Collaborator Added - {{projectName}}\n\nHi {{userName}},\n\n{{collaboratorName}} has been added as a collaborator to {{projectName}}.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getSecurityPasswordChangedTemplate() {
    return {
      subject: "🔑 Password Changed Successfully",
      html: `${this.getBaseHTML(
        "🔑",
        "Password Changed Successfully",
        "Your password has been changed successfully."
      )}`,
      text: `Password Changed Successfully\n\nHi {{userName}},\n\nYour password has been changed successfully.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getSecurity2FAEnabledTemplate() {
    return {
      subject: "🔐 Two-Factor Authentication Enabled",
      html: `${this.getBaseHTML(
        "🔐",
        "Two-Factor Authentication Enabled",
        "Two-factor authentication has been enabled for your account."
      )}`,
      text: `Two-Factor Authentication Enabled\n\nHi {{userName}},\n\nTwo-factor authentication has been enabled for your account.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getSecurity2FADisabledTemplate() {
    return {
      subject: "⚠️ Two-Factor Authentication Disabled",
      html: `${this.getBaseHTML(
        "⚠️",
        "Two-Factor Authentication Disabled",
        "Two-factor authentication has been disabled for your account."
      )}`,
      text: `Two-Factor Authentication Disabled\n\nHi {{userName}},\n\nTwo-factor authentication has been disabled for your account.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getSecurityApiKeyCreatedTemplate() {
    return {
      subject: "🔑 New API Key Created",
      html: `${this.getBaseHTML(
        "🔑",
        "New API Key Created",
        "A new API key <strong>{{keyName}}</strong> has been created for your account."
      )}`,
      text: `New API Key Created\n\nHi {{userName}},\n\nA new API key {{keyName}} has been created for your account.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getSystemMaintenanceTemplate() {
    return {
      subject: "🔧 Scheduled Maintenance Notice",
      html: `${this.getBaseHTML(
        "🔧",
        "Scheduled Maintenance Notice",
        "We have scheduled maintenance for {{maintenanceStart}}."
      )}`,
      text: `Scheduled Maintenance Notice\n\nHi {{userName}},\n\nWe have scheduled maintenance for {{maintenanceStart}}.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getSystemUpdateTemplate() {
    return {
      subject: "🚀 System Update Available",
      html: `${this.getBaseHTML(
        "🚀",
        "System Update Available",
        "A new system update ({{updateVersion}}) is available."
      )}`,
      text: `System Update Available\n\nHi {{userName}},\n\nA new system update ({{updateVersion}}) is available.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getSystemQuotaWarningTemplate() {
    return {
      subject: "⚠️ Usage Quota Warning",
      html: `${this.getBaseHTML(
        "⚠️",
        "Usage Quota Warning",
        "You have used {{usagePercentage}}% of your {{quotaType}} quota."
      )}`,
      text: `Usage Quota Warning\n\nHi {{userName}},\n\nYou have used {{usagePercentage}}% of your {{quotaType}} quota.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getSystemQuotaExceededTemplate() {
    return {
      subject: "🚨 Usage Quota Exceeded",
      html: `${this.getBaseHTML(
        "🚨",
        "Usage Quota Exceeded",
        "You have exceeded your {{quotaType}} quota."
      )}`,
      text: `Usage Quota Exceeded\n\nHi {{userName}},\n\nYou have exceeded your {{quotaType}} quota.\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  getGeneralAnnouncementTemplate() {
    return {
      subject: "📢 DeployIO Announcement",
      html: `${this.getBaseHTML(
        "📢",
        "DeployIO Announcement",
        "{{announcementContent}}"
      )}`,
      text: `DeployIO Announcement\n\nHi {{userName}},\n\n{{announcementContent}}\n\nBest regards,\nThe DeployIO Team`,
    };
  }

  // Helper methods
  getBaseHTML(icon, title, content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          ${this.getBaseStyles()}
      </head>
      <body>
          ${this.getHeader()}
          <div class="content">
              <div class="status-icon">${icon}</div>
              <h2>${title}</h2>
              <p>Hi {{userName}},</p>
              <p>${content}</p>
              
              {{#if action}}
              <div class="cta">
                  <a href="{{action.url}}" class="button">{{action.label}}</a>
              </div>
              {{/if}}
          </div>
          ${this.getFooter()}
      </body>
      </html>
    `;
  }

  getBaseStyles() {
    return `
      <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .status-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
          .status-icon.success { color: #10b981; }
          .status-icon.error { color: #ef4444; }
          .status-icon.warning { color: #f59e0b; }
          h2 { color: #1f2937; margin-bottom: 20px; font-size: 24px; font-weight: 600; }
          .details { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .details h3 { margin-top: 0; color: #374151; font-size: 16px; font-weight: 600; }
          .details ul { margin: 10px 0; padding-left: 20px; }
          .details li { margin: 5px 0; }
          .error-details { background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .error-message { font-family: monospace; background-color: #ffffff; padding: 10px; border-radius: 4px; margin: 10px 0; }
          .features { margin: 20px 0; }
          .feature { margin: 15px 0; }
          .feature h3 { margin: 0 0 5px 0; font-size: 16px; font-weight: 600; }
          .feature p { margin: 0; color: #6b7280; }
          .cta { text-align: center; margin: 30px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px; }
          .button.secondary { background: #6b7280; }
          .button:hover { background: #2563eb; }
          .button.secondary:hover { background: #4b5563; }
          .footer { padding: 30px 20px; text-align: center; font-size: 14px; color: #6b7280; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
          .footer a { color: #3b82f6; text-decoration: none; }
          .footer a:hover { text-decoration: underline; }
      </style>
    `;
  }

  getHeader() {
    return `
      <div class="header">
          <h1>DeployIO</h1>
      </div>
    `;
  }

  getFooter() {
    return `
      <div class="footer">
          <p>You received this email because you have notifications enabled.</p>
          <p><a href="{{unsubscribeUrl}}">Manage notification preferences</a> | <a href="{{supportEmail}}">Contact Support</a></p>
          <p>© 2024 DeployIO. All rights reserved.</p>
      </div>
    `;
  }
}

module.exports = NotificationTemplates;
