import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM;

    console.log({ smtpHost, smtpPort, smtpUser, smtpFrom, hasPass: !!smtpPass });

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    try {
        await transporter.sendMail({
            from: smtpFrom,
            to: 'modibiid@gmail.com', // test sending to self
            subject: 'Test Email OTP',
            text: 'This is a test email.',
        });
        console.log('Success');
    } catch (e) {
        console.error('Error:', e);
    }
}

testEmail();
