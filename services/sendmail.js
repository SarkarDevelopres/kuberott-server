import nodemailer from "nodemailer";
import dotenv from "dotenv";
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail(to, subject, code) {
    const templatePath = path.join(process.cwd(), 'services', "activation-email.ejs");
    const html = await ejs.renderFile(templatePath, { code: code });
    await transporter.sendMail({
        from: `"Pairr" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    });
}
