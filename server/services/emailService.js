const nodemailer = require("nodemailer");

// Common HTML email templates
const templates = {
  otp: ({ username, otp }) => `
    <div style="background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #c7d2fe 100%); padding: 32px; border-radius: 16px; max-width: 400px; margin: 0 auto; font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif; border: 1px solid #a78bfa; box-shadow: 0 8px 32px 0 rgba(80, 0, 120, 0.08);">
      <div style="background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%); padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 50%; width: 48px; height: 48px; line-height: 48px; color: #fff; font-size: 1.5rem; font-weight: bold;">D!</span>
        <h2 style="color: #fff; font-size: 1.25rem; font-weight: bold; margin: 8px 0 0 0;">Verify your DeployIO account</h2>
      </div>
      <p style="color: #6d28d9; font-size: 1rem; margin-bottom: 16px;">Hi <b>${username}</b>,</p>
      <p style="color: #4b5563; font-size: 1rem; margin-bottom: 16px;">Your One-Time Password (OTP) for account verification is:</p>
      <div style="background: #ede9fe; color: #7c3aed; font-size: 2rem; font-weight: bold; text-align: center; padding: 16px; border-radius: 8px; letter-spacing: 4px; margin-bottom: 16px;">${otp}</div>
      <p style="color: #6b7280; font-size: 0.95rem;">This OTP is valid for 10 minutes. If you did not sign up, please ignore this email.</p>
      <p style="color: #a78bfa; font-size: 0.85rem; margin-top: 24px; text-align: center;">&copy; ${new Date().getFullYear()} DeployIO</p>
    </div>
  `,
  passwordReset: ({ resetLink }) => `
    <div style="background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #c7d2fe 100%); padding: 32px; border-radius: 16px; max-width: 400px; margin: 0 auto; font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif; border: 1px solid #a78bfa; box-shadow: 0 8px 32px 0 rgba(80, 0, 120, 0.08);">
      <div style="background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%); padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 50%; width: 48px; height: 48px; line-height: 48px; color: #fff; font-size: 1.5rem; font-weight: bold;">D!</span>
        <h2 style="color: #fff; font-size: 1.25rem; font-weight: bold; margin: 8px 0 0 0;">Reset your DeployIO password</h2>
      </div>
      <p style="color: #6d28d9; font-size: 1rem; margin-bottom: 16px;">You are receiving this email because you (or someone else) has requested the reset of a password.</p>
      <p style="color: #4b5563; font-size: 1rem; margin-bottom: 16px;">Please click on the following link to reset your password:</p>
      <div style="background: #ede9fe; color: #7c3aed; font-size: 1rem; font-weight: bold; text-align: center; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <a href="${resetLink}" style="color: #7c3aed; text-decoration: underline;">Reset Password</a>
      </div>
      <p style="color: #6b7280; font-size: 0.95rem;">This link is valid for 30 minutes only. If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p style="color: #a78bfa; font-size: 0.85rem; margin-top: 24px; text-align: center;">&copy; ${new Date().getFullYear()} DeployIO</p>
    </div>
  `,
};

/**
 * Send email using nodemailer
 * @param {Object} options - Email options (to, subject, template, variables, text, html)
 * @returns {Promise} Result of sending email
 */
const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // If a template is specified, generate HTML from template and variables
  let html = options.html;
  if (options.template && templates[options.template]) {
    html = templates[options.template](options.variables || {});
  }

  // Define email options
  const mailOptions = {
    from: `DeployIO <${process.env.EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail, templates };
