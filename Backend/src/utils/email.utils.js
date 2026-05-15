import nodemailer from "nodemailer";
import crypto from "crypto";

// ─── Transporter (lazy singleton) ─────────────────────────────────────────────
let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;

    const { SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_USER || !SMTP_PASS) {
        console.warn("[Email] ⚠️  SMTP_USER / SMTP_PASS missing — emails will be logged to console only.");
        console.warn("[Email]    Add your Gmail address and App Password to Backend/.env");
        return null;
    }

    // Uses nodemailer's built-in Gmail service (no host/port needed)
    _transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,   // Must be a Google App Password, NOT your Gmail password
        },
    });

    return _transporter;
}

// ─── Public sendEmail helper ───────────────────────────────────────────────────
export const sendEmail = async ({ to, subject, text, html }) => {
    const transporter = getTransporter();

    if (!transporter) {
        // Graceful fallback: log to console so development still works
        console.log(`\n[Email Fallback] ─────────────────────────────────`);
        console.log(`  To:      ${to}`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Body:    ${text || "(html only)"}`);
        console.log(`──────────────────────────────────────────────────\n`);
        return;
    }

    const from = process.env.EMAIL_FROM || "OrangeBite <no-reply@orangebite.com>";

    await transporter.sendMail({ from, to, subject, text, html });
    console.log(`[Email] ✅ Sent "${subject}" to ${to}`);
};

// ─── Token helper (unchanged) ──────────────────────────────────────────────────
export const generateRandomToken = () => {
    const token = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    return { token, hashedToken };
};
