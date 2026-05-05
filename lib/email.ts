import { env } from "@/lib/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!env.EMAIL_API_KEY) {
    console.log(
      `[shipnote] email skipped (no API key). To: ${to}, Subject: ${subject}`
    );
    return { skipped: true };
  }

  if (!env.EMAIL_FROM) {
    console.warn(
      "[shipnote] SHIPNOTE_EMAIL_FROM not set. Cannot send email."
    );
    return { skipped: true };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.EMAIL_API_KEY);

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[shipnote] email send error:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return { skipped: false };
}
