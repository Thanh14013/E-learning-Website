import sgMail from "@sendgrid/mail";

const frontendDomain = process.env.FRONTEND_URL || "";
const sendGridApiKey = process.env.SENDGRID_API_KEY || "";
const sendGridGromEmail = process.env.SENDGRID_FROM_EMAIL || "";

sgMail.setApiKey(sendGridApiKey);

export const sendVerificationEmail = async (email, fullName, token) => {
  const verifyUrl = `${frontendDomain}/verify-email/${token}`;

  const msg = {
    to: email,
    from: sendGridGromEmail,
    subject: "Xác thực tài khoản của bạn",
    html: `
            <h3>Hello ${fullName},</h3>
            <p>Thank you for registering an account. Please click the link below to verify your email:</p>
            <a href="${verifyUrl}" style="color:#1a73e8;">Verify your account</a>
            <br/><br/>
            <p>If you didn’t perform this request, there’s nothing else you need to do.</p>
        `,
  };

  await sgMail.send(msg);
};

/**
 * Generic email sending function
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
      from: sendGridGromEmail,
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
