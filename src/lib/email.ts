// src/lib/email.ts
import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD!;

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  throw new Error("Email credentials not configured");
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
}
