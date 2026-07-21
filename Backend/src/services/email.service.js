/**
 * Sends a 6-digit OTP to the given email address using Brevo HTTP API.
 * Bypasses Render's strict SMTP blocking.
 * @param {string} email - Recipient email
 * @param {string} otp   - 6-digit OTP string
 */
async function sendOtpEmail(email, otp) {
    const htmlContent = `
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
    `;

    const payload = {
        sender: {
            name: "CareerOS Security",
            email: "rishabhladha456@gmail.com" // Must be a verified sender in Brevo
        },
        to: [{ email: email }],
        subject: `${otp} is your CareerOS password reset code`,
        htmlContent: htmlContent
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Brevo API Error:", errorData);
        throw new Error(`Brevo API failed: ${errorData.message || response.statusText}`);
    }
}

module.exports = { sendOtpEmail }

