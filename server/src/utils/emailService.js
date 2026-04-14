import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using SMTP transport
// Falls back to terminal logging if SMTP is not provided for local dev
let transporter;

const initializeTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback
    console.warn('⚠️ No SMTP credentials found in .env. Initializing Ethereal Email for testing...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log(`📧 Ethereal Email test account created: ${testAccount.user}`);
    } catch (err) {
      console.error('Failed to create Ethereal test account, will just log to console', err);
      // Mock transporter
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('\n================== EMAIL SIMULATION ==================');
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Body:\n${mailOptions.text || mailOptions.html}`);
          console.log('======================================================\n');
          return { messageId: 'mock-id' };
        }
      };
    }
  }
};

initializeTransporter();

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"HealthCore HMS" <noreply@healthcore.com>`, // sender address
      to,
      subject,
      text,
      html,
    });

    console.log(`📨 Message sent to ${to}: ${info.messageId}`);
    
    // Preview URL only available when sending through an Ethereal account
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    console.error('❌ Error sending email: ', error);
    throw error;
  }
};
