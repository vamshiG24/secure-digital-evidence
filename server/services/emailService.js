const nodemailer = require('nodemailer');

/**
 * Sends a 2FA One-Time Password (OTP) to the specified email address.
 * Logs the code to the console for development and local testing.
 * @param {string} email - Destination email address
 * @param {string} otp - 6-digit verification code
 */
const sendOTP = async (email, otp) => {
    // 1. Always log the OTP to the console for development/demo ease
    console.log(`\n==================================================`);
    console.log(`[DEV/SECURITY DEBUG] OTP Code for ${email} is: ${otp}`);
    console.log(`==================================================\n`);

    // 2. Read SMTP settings from environment variables
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

    // Send email only if minimal SMTP config is present
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: Number(SMTP_PORT) || 587,
                secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports (like 587)
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS
                }
            });

            const mailOptions = {
                from: EMAIL_FROM || '"Secure Evidence System" <no-reply@secureevidence.com>',
                to: email,
                subject: 'Your 2FA Verification Code',
                text: `Your security verification code is: ${otp}. It will expire in 5 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; color: #333333;">
                        <h2 style="color: #1d4ed8; text-align: center;">Secure Evidence Management</h2>
                        <hr style="border: 0; border-top: 1px solid #e0e0e0;" />
                        <p>Hello,</p>
                        <p>You are receiving this email because a login attempt or security change requested a Two-Factor Authentication (2FA) verification code.</p>
                        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">This code will expire in 5 minutes. If you did not make this request, please secure your account immediately.</p>
                        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin-top: 30px;" />
                        <p style="font-size: 12px; color: #9ca3af; text-align: center;">This is an automated security notification. Please do not reply to this email.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`[emailService] Verification email sent successfully to ${email}`);
        } catch (error) {
            console.error(`[emailService] Failed to send email to ${email}:`, error.message);
        }
    } else {
        console.log(`[emailService] SMTP config missing from env variables. Real email not sent.`);
    }
};

module.exports = { sendOTP };
