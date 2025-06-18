import nodemailer from 'nodemailer';
import { compile } from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: any;
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Load and compile email templates
const templates: { [key: string]: HandlebarsTemplateDelegate } = {};

async function loadTemplate(name: string) {
  if (templates[name]) {
    return templates[name];
  }

  const templatePath = path.join(__dirname, `../../templates/emails/${name}.hbs`);
  const template = await fs.readFile(templatePath, 'utf-8');
  templates[name] = compile(template);
  return templates[name];
}

export async function sendEmail({ to, subject, template, data }: EmailOptions) {
  try {
    const compiledTemplate = await loadTemplate(template);
    const html = compiledTemplate(data);

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Email templates
export const emailTemplates = {
  teamInvitation: {
    subject: 'Team Invitation',
    template: 'team-invitation',
    data: {
      teamName: string;
      inviterName: string;
      role: string;
      acceptUrl: string;
    }
  },
  passwordReset: {
    subject: 'Password Reset',
    template: 'password-reset',
    data: {
      resetUrl: string;
    }
  },
  welcome: {
    subject: 'Welcome to Zenith',
    template: 'welcome',
    data: {
      name: string;
      loginUrl: string;
    }
  }
}; 