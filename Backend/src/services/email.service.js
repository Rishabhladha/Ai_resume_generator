const nodemailer = require('nodemailer');

/**
 * Sends a 6-digit OTP to the given email address.
 * Uses a Vercel Bridge in production to bypass Render's firewall.
 */
async function sendOtpEmail(email, otp) {
    // If we are running on Render (production), send the email through the Vercel Bridge
    if (process.env.NODE_ENV === 'production') {
        const vercelUrl = process.env.FRONTEND_URL;
        if (!vercelUrl) {
            throw new Error("FRONTEND_URL must be set in Render for the email bridge to work!");
        }
        const response = await fetch(`${vercelUrl}/api/sendEmail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Vercel Bridge failed: ${error.error || response.statusText}`);
        }
        return;
    }

    // If we are running on localhost, just use Nodemailer directly (SMTP is not blocked locally)
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
            <div style="margin-bottom: 32px; text-align: center;">
                <img src="https://ai-interview-os.vercel.app/logo.png" alt="CareerOS Logo" style="max-height: 50px; display: inline-block; vertical-align: middle; margin-right: 10px;" />
                <span style="font-size: 24px; font-weight: 800; color: #fff; vertical-align: middle;">CareerOS</span>
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

    await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };

