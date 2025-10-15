import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

// Initialize SendGrid API key from environment variable
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.warn(
    "Warning: SENDGRID_API_KEY is not set. Sending emails will fail until it is configured."
  );
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Function to send an email using SendGrid
const sendEmail = async (
  to,
  subject = "No subject",
  text = "hello",
  options = {}
) => {
  if (!SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY not configured");
  }

  const msg = {
    to,
    from: options.from || process.env.FROM_EMAIL || "no-reply@example.com",
    subject,
    text,
    html: options.html,
  };

  try {
    const result = await sgMail.send(msg);
    // sgMail.send returns an array of responses when sending to multiple recipients
    console.log("SendGrid: email sent to", to);
    return result;
  } catch (error) {
    console.error(
      "SendGrid: failed to send email:",
      error?.response?.body || error.message || error
    );
    throw error;
  }
};

export default sendEmail;
