import sgMail from '@sendgrid/mail';

const frontendDomain = process.env.FRONTEND_URL || '';
const sendGridApiKey = process.env.SENDGRID_API_KEY || '';
const sendGridGromEmail = process.env.SENDGRID_FROM_EMAIL || '';

sgMail.setApiKey(sendGridApiKey);

export const sendVerificationEmail = async (email, fullName, token) => {
    const verifyUrl = `${frontendDomain}/verify-email/${token}`;

    const msg = {
        to: email,
        from: sendGridGromEmail,
        subject: 'Xác thực tài khoản của bạn',
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