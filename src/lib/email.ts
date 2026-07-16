type ClubApprovedEmailInput = {
  clubName: string;
  organiserName?: string | null;
  dashboardUrl: string;
};

type ContactMessageEmailInput = {
  name: string;
  email: string;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildClubApprovedEmail({
  clubName,
  organiserName,
  dashboardUrl,
}: ClubApprovedEmailInput) {
  const safeClubName = escapeHtml(clubName);
  const safeName = escapeHtml(organiserName || "there");
  const safeDashboardUrl = escapeHtml(dashboardUrl);

  return {
    subject: `${clubName} has been approved on RunZW`,
    text: [
      `Hi ${organiserName || "there"},`,
      "",
      `${clubName} has been approved on RunZW.`,
      "You can now create, publish, and manage running events from your organiser dashboard.",
      "",
      `Open your dashboard: ${dashboardUrl}`,
    ].join("\n"),
    html: `<!doctype html>
<html>
  <body style="margin:0; background:#f5f4ef; color:#14171a; font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f4ef; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; overflow:hidden; border:1px solid #e2e0d8; border-radius:24px; background:#ffffff;">
            <tr>
              <td style="height:10px; background:linear-gradient(90deg,#1e8e3e,#f2b705,#d2262f);"></td>
            </tr>
            <tr>
              <td style="padding:32px 28px 12px;">
                <p style="margin:0 0 12px; color:#166b2f; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase;">RunZW organiser approval</p>
                <h1 style="margin:0; color:#14171a; font-size:30px; line-height:1.05; font-weight:900;">${safeClubName} is approved</h1>
                <p style="margin:18px 0 0; color:#666b66; font-size:16px; line-height:1.65;">Hi ${safeName}, your club has been approved on RunZW. You can now create events, publish listings, and manage registrations from your organiser dashboard.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:18px; background:#14171a;">
                  <tr>
                    <td style="padding:20px;">
                      <p style="margin:0 0 4px; color:#ffffff; font-size:14px; font-weight:800;">Next step</p>
                      <p style="margin:0; color:#d7e6df; font-size:14px; line-height:1.6;">Open your dashboard and add your first event.</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;">
                  <a href="${safeDashboardUrl}" style="display:inline-block; border-radius:999px; background:#1e8e3e; color:#ffffff; font-size:14px; font-weight:800; padding:13px 18px; text-decoration:none;">Open organiser dashboard</a>
                </p>
                <p style="margin:22px 0 0; color:#666b66; font-size:12px; line-height:1.5;">If the button does not work, paste this link into your browser:<br><span style="color:#166b2f; word-break:break-all;">${safeDashboardUrl}</span></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

export function buildContactMessageEmail({
  name,
  email,
  message,
}: ContactMessageEmailInput) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  return {
    subject: `New contact message from ${name}`,
    text: [
      `New message from the RunZW contact form.`,
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      message,
    ].join("\n"),
    html: `<!doctype html>
<html>
  <body style="margin:0; background:#f5f4ef; color:#14171a; font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f4ef; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; overflow:hidden; border:1px solid #e2e0d8; border-radius:24px; background:#ffffff;">
            <tr>
              <td style="height:10px; background:linear-gradient(90deg,#1e8e3e,#f2b705,#d2262f);"></td>
            </tr>
            <tr>
              <td style="padding:32px 28px 12px;">
                <p style="margin:0 0 12px; color:#166b2f; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase;">RunZW contact form</p>
                <h1 style="margin:0; color:#14171a; font-size:26px; line-height:1.15; font-weight:900;">New message from ${safeName}</h1>
                <p style="margin:18px 0 0; color:#666b66; font-size:14px; line-height:1.6;">Reply-to: <span style="color:#166b2f;">${safeEmail}</span></p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:18px; background:#f5f4ef; border:1px solid #e2e0d8;">
                  <tr>
                    <td style="padding:20px;">
                      <p style="margin:0; color:#14171a; font-size:14px; line-height:1.6;">${safeMessage}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}
