import sgMail from "@sendgrid/mail";

const sendGridApiKey = process.env.SENDGRID_API_KEY || "";
const sendGridFromEmail = process.env.FROM_EMAIL || "";

sgMail.setApiKey(sendGridApiKey);

/**
 * Generic email sending function (used for password reset)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Email plain text content (optional)
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const msg = {
      to,
      from: sendGridFromEmail,
      subject,
      html,
      text: text || "",
    };

    await sgMail.send(msg);
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};
