import { Resend } from "resend";
import twilio from "twilio";
import { buildClubApprovedEmail } from "@/lib/email";

function getEmailFrom() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.FROM_EMAIL) return `RunZW <${process.env.FROM_EMAIL}>`;
  return "RunZW <noreply@example.com>";
}

export async function sendOtp(
  contact: string,
  channel: "email" | "sms",
  code: string,
): Promise<void> {
  const body = `Your RunZW verification code is ${code}. It expires in 10 minutes.`;

  if (channel === "email") {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: getEmailFrom(),
      to: contact,
      subject: "Your RunZW code",
      text: body,
    });
    return;
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );
  await client.messages.create({
    from: process.env.TWILIO_FROM,
    to: contact,
    body,
  });
}

export async function sendClubApprovedEmail({
  to,
  clubName,
  organiserName,
  dashboardUrl,
}: {
  to: string;
  clubName: string;
  organiserName?: string | null;
  dashboardUrl: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const email = buildClubApprovedEmail({
    clubName,
    organiserName,
    dashboardUrl,
  });

  await resend.emails.send({
    from: getEmailFrom(),
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}
