const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Connect to Gmail SMTP (Vercel allows port 465)
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"CareerOS Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${otp} is your CareerOS password reset code`,
        html: `
        <div style="font-family: Arial, sans-serif; background: #050914; color: #f1f5f9; padding: 40px; max-width: 520px; margin: 0 auto; border-radius: 16px;">
            <div style="margin-bottom: 32px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px; font-weight: 800; color: #fff; vertical-align: middle;">CareerOS</span>
            </div>
            <h2 style="font-size: 24px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px;">Password Reset Request</h2>
            <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                We received a request to reset your password. Use the code below — it expires in <strong style="color: #f1f5f9;">10 minutes</strong>.
            </p>
            <div style="background: rgba(124, 58, 237, 0.12); border: 2px solid rgba(124, 58, 237, 0.3); border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 32px;">
                <div style="font-size: 52px; font-weight: 900; letter-spacing: 14px; color: #8b5cf6; font-family: 'Courier New', monospace;">${otp}</div>
                <p style="color: #94a3b8; font-size: 13px; margin: 10px 0 0;">Your 6-digit one-time code</p>
            </div>
            <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0;">
                If you did not request a password reset, please ignore this email. Your account is safe.<br/><br/>
                — CareerOS Security Team
            </p>
        </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('SMTP Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
