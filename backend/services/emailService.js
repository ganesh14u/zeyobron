import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter singleton
let transporter;

const initTransporter = async () => {
    if (transporter) return transporter;

    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim();
    const host = (process.env.EMAIL_HOST || 'smtp-relay.brevo.com').trim();
    const port = parseInt(process.env.EMAIL_PORT || '465');

    console.log(`📧 Initializing Mailer: ${host}`);

    if (user && pass) {
        console.log(`� Attempting to connect via Brevo Service...`);

        transporter = nodemailer.createTransport({
            service: 'Brevo',
            auth: { user, pass },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Test the connection immediately
        try {
            await transporter.verify();
            console.log('✅ SMTP Connection Verified - Ready to send emails');
        } catch (verifyError) {
            console.error('❌ SMTP Verification Failed:', verifyError.message);
            console.warn('⚠️ Manual Host Fallback initiated...');

            // If service fails, try one last manual configuration on port 2525
            transporter = nodemailer.createTransport({
                host: 'smtp-relay.brevo.com',
                port: 2525,
                secure: false,
                auth: { user, pass },
                tls: { rejectUnauthorized: false }
            });
        }
    } else {
        console.error('❌ DISASTER: No email credentials found in process.env!');
        console.error('⚠️ Falling back to Ethereal TEST service. EMAILS WILL NOT BE DELIVERED TO REAL INBOXES.');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    return transporter;
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
    try {
        const transporter = await initTransporter();

        let clientUrl = (process.env.CLIENT_URL || 'https://datasai.netlify.app').trim();
        if (clientUrl.endsWith('/')) {
            clientUrl = clientUrl.slice(0, -1);
        }

        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
        const fromEmail = (process.env.EMAIL_FROM || 'paladugusaiganesh@gmail.com').trim();

        console.log(`🔗 Reset URL generated: ${resetUrl}`);

        const mailOptions = {
            from: `"Data Sai Support" <${fromEmail}>`,
            to: email,
            subject: 'Password Reset Request - Data Sai',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000; color: #fff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000;">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111; border-radius: 8px; overflow: hidden; border: 1px solid #333;">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 30px 40px; text-align: center; background: linear-gradient(90deg, #e50914, #f40612);">
                                    <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: white;">DATA SAI</h1>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Password Reset Request</h2>
                                    
                                    <p style="margin: 0 0 20px 0; color: #ccc; font-size: 16px; line-height: 1.5;">
                                        Hello ${userName || 'User'},
                                    </p>
                                    
                                    <p style="margin: 0 0 20px 0; color: #ccc; font-size: 16px; line-height: 1.5;">
                                        We received a request to reset your password for your Data Sai account. 
                                        Click the button below to create a new password.
                                    </p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding: 30px 0;">
                                                <a href="${resetUrl}" 
                                                   style="display: inline-block; padding: 15px 30px; background: #e50914; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                                                    Reset Password
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="margin: 0 0 20px 0; color: #999; font-size: 14px; line-height: 1.5;">
                                        If you didn't request this, please ignore this email. Your password will remain unchanged.
                                    </p>
                                    
                                    <p style="margin: 0 0 20px 0; color: #999; font-size: 14px; line-height: 1.5;">
                                        This link will expire in 1 hour for security reasons.
                                    </p>
                                    
                                    <p style="margin: 0 0 10px 0; color: #999; font-size: 14px;">
                                        Having trouble clicking the button? Copy and paste this link into your browser:
                                    </p>
                                    <p style="margin: 0; color: #e50914; font-size: 12px; word-break: break-all;">
                                        ${resetUrl}
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 30px 40px; background-color: #1a1a1a; text-align: center; border-top: 1px solid #333;">
                                    <p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">
                                        © 2025 Data Sai. All rights reserved.
                                    </p>
                                    <p style="margin: 0; color: #999; font-size: 12px;">
                                        This email was sent to ${email} because a password reset was requested.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `
        };

        const result = await transporter.sendMail(mailOptions);

        console.log('✅ Password reset email sent successfully to:', email);
        return result;
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        console.error('Environment check - EMAIL_USER exists:', !!process.env.EMAIL_USER);
        console.error('Environment check - CLIENT_URL:', process.env.CLIENT_URL);
        throw new Error('Failed to send password reset email: ' + error.message);
    }
};

// Send welcome email
export const sendWelcomeEmail = async (email, userName) => {
    try {
        const transporter = await initTransporter();
        const fromEmail = (process.env.EMAIL_FROM || 'paladugusaiganesh@gmail.com').trim();

        const mailOptions = {
            from: `"Data Sai Team" <${fromEmail}>`,
            to: email,
            subject: 'Welcome to Data Sai!',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Data Sai</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000; color: #fff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000;">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111; border-radius: 8px; overflow: hidden; border: 1px solid #333;">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 30px 40px; text-align: center; background: linear-gradient(90deg, #e50914, #f40612);">
                                    <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: white;">DATA SAI</h1>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Welcome to Data Sai!</h2>
                                    
                                    <p style="margin: 0 0 20px 0; color: #ccc; font-size: 16px; line-height: 1.5;">
                                        Hi ${userName || 'there'},
                                    </p>
                                    
                                    <p style="margin: 0 0 20px 0; color: #ccc; font-size: 16px; line-height: 1.5;">
                                        Welcome to Data Sai! We're excited to have you join our streaming community.
                                    </p>
                                    
                                    <p style="margin: 0 0 20px 0; color: #ccc; font-size: 16px; line-height: 1.5;">
                                        Start exploring our vast collection of videos in the "Big Data Free" category and discover premium content.
                                    </p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding: 30px 0;">
                                                <a href="${process.env.CLIENT_URL}" 
                                                   style="display: inline-block; padding: 15px 30px; background: #e50914; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                                                    Start Watching
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="margin: 0 0 20px 0; color: #999; font-size: 14px; line-height: 1.5;">
                                        If you have any questions, feel free to contact our support team.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 30px 40px; background-color: #1a1a1a; text-align: center; border-top: 1px solid #333;">
                                    <p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">
                                        © 2025 Data Sai. All rights reserved.
                                    </p>
                                    <p style="margin: 0; color: #999; font-size: 12px;">
                                        This email was sent to ${email} as part of your account registration.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `
        };

        const result = await transporter.sendMail(mailOptions);

        console.log('✅ Welcome email sent successfully to:', email);
        return result;
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        throw new Error('Failed to send welcome email');
    }
};

export default {
    sendPasswordResetEmail,
    sendWelcomeEmail
};