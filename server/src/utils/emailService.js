import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporterPromise = null;

async function getTransporter() {
  if (env.isTest) {
    return null;
  }

  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      });
      console.log('📧 Email service initialized with configured SMTP server');
      return { transporter, isEthereal: false };
    }

    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📧 Email service initialized with Ethereal development inbox');
      return { transporter, isEthereal: true };
    } catch {
      console.warn('⚠️  SMTP not configured and Ethereal unavailable; emails will be logged in development mode.');
      return null;
    }
  })();

  return transporterPromise;
}

export async function sendEmail({ to, subject, html, text }) {
  if (env.isTest) {
    return { mocked: true, to, subject };
  }

  const service = await getTransporter();
  if (!service) {
    if (!env.isProduction) {
      console.log(`\n[DEV EMAIL] To: ${to} | Subject: ${subject}\n${text || '(HTML email)'}\n`);
    }
    return { mocked: true, to, subject };
  }

  const info = await service.transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html
  });

  if (service.isEthereal) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📨 Ethereal email preview: ${previewUrl}`);
    }
  }

  return info;
}
