// Quick test for email template system
const EmailTemplateRenderer = require("./utils/EmailTemplateRenderer");

console.log("Testing EmailTemplateRenderer...");

try {
  const renderer = new EmailTemplateRenderer();

  console.log("✅ EmailTemplateRenderer initialized successfully");
  console.log("Available templates:", renderer.getAvailableTemplates());

  // Test OTP template
  const otpHtml = renderer.render("otp", {
    firstName: "John",
    otp: "123456",
  });
  console.log("✅ OTP template rendered successfully");

  // Test password reset template
  const resetHtml = renderer.render("passwordReset", {
    firstName: "John",
    resetUrl: "https://deployio.com/reset/abc123",
  });
  console.log("✅ Password reset template rendered successfully");

  console.log("\n🎉 All email templates working perfectly!");
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
