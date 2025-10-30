import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendVerificationEmail = async (email, fullName, token) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Xác thực tài khoản của bạn',
        html: `
            <h3>Xin chào ${fullName},</h3>
            <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào liên kết dưới đây để xác thực email:</p>
            <a href="${verifyUrl}" style="color:#1a73e8;">Xác thực tài khoản</a>
            <br/><br/>
            <p>Nếu bạn không thực hiện hành động này, hãy bỏ qua email này.</p>
        `,
    };

    await sgMail.send(msg);
};