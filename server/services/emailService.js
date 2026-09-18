const nodemailer = require('nodemailer');

/**
 * Sends a 2FA One-Time Password (OTP) to the specified email address.
 * Logs the code to the console for development and local testing.
 * @param {string} email - Destination email address
 * @param {string} otp - 6-digit verification code
 * @param {string} [purpose='login'] - Purpose of the OTP ('login' or 'registration')
 */
const sendOTP = async (email, otp, purpose = 'login') => {
    // Log the OTP only outside production so local demos work without SMTP.
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] OTP (${purpose}) for ${email}: ${otp}`);
    }

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

            const isRegister = purpose === 'registration';
            const subject = isRegister 
                ? 'Verify Your Secure Evidence Account' 
                : 'Your Security Verification Code';
            
            const messageText = isRegister
                ? 'Welcome to the Secure Evidence System! Please use the verification code below to verify your email address and complete your account registration.'
                : 'A login attempt was made on your Secure Evidence account. Please use the verification code below to complete your sign-in.';

            const warningText = isRegister
                ? 'This code will expire in 5 minutes. If you did not make this request, please ignore this email.'
                : 'This code will expire in 5 minutes. If you did not make this request, please secure your account immediately.';

            const mailOptions = {
                from: EMAIL_FROM || '"Secure Evidence System" <no-reply@secureevidence.com>',
                to: email,
                subject,
                text: `${messageText}\n\nCode: ${otp}\n\n${warningText}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; color: #333333;">
                        <h2 style="color: #1d4ed8; text-align: center;">Secure Evidence Management</h2>
                        <hr style="border: 0; border-top: 1px solid #e0e0e0;" />
                        <p>Hello,</p>
                        <p>${messageText}</p>
                        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">${warningText}</p>
                        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin-top: 30px;" />
                        <p style="font-size: 12px; color: #9ca3af; text-align: center;">This is an automated security notification. Please do not reply to this email.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`[emailService] Verification email sent successfully to ${email}`);
        } catch (error) {
            console.error(`[emailService] Failed to send email to ${email}:`, error.message);
            if (process.env.NODE_ENV === 'production') {
                throw new Error('Unable to send verification email. Please try again later.');
            }
        }
    } else if (process.env.NODE_ENV === 'production') {
        throw new Error('Email service is not configured');
    } else {
        console.log('[emailService] SMTP not configured; OTP printed above for local testing.');
    }
};

module.exports = { sendOTP };
