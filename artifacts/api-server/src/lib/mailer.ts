import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env["SMTP_USER"],
    pass: process.env["SMTP_PASS"],
  },
});

export interface InviteEmailParams {
  toEmail: string;
  toName: string;
  companyName: string;
  tempPassword: string;
  loginUrl: string;
  invitedByName: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  company_admin: "Company Admin",
  ceoo: "Chief Executive Operations Officer",
  manager: "Manager",
  supervisor: "Supervisor",
  employee: "Employee",
};

export async function sendInviteEmail(params: InviteEmailParams): Promise<void> {
  const { toEmail, toName, companyName, tempPassword, loginUrl, invitedByName, role } = params;
  const roleLabel = ROLE_LABELS[role] ?? role;
  const firstName = toName.split(" ")[0];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to HRPay</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:8px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:14px;height:14px;border-radius:50%;background:#8bc34a;display:inline-block;"></td>
                        <td style="width:6px;"></td>
                        <td style="width:14px;height:14px;border-radius:50%;background:#1a1a1a;display:inline-block;"></td>
                      </tr>
                    </table>
                  </td>
                  <td style="font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px;">HRPay</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

              <!-- Green header bar -->
              <tr>
                <td style="background:#8bc34a;padding:32px 40px 28px;">
                  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#3a5200;text-transform:uppercase;letter-spacing:0.8px;">You're Invited</p>
                  <h1 style="margin:0;font-size:26px;font-weight:700;color:#1a1a1a;line-height:1.2;">Welcome to ${companyName}</h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">
                    Hi <strong>${firstName}</strong>,
                  </p>
                  <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">
                    <strong>${invitedByName}</strong> has invited you to join <strong>${companyName}</strong> on HRPay — your company's HR &amp; Payroll platform.
                  </p>

                  <!-- Credentials box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9f0;border:1px solid #d4e8a0;border-radius:12px;margin:24px 0;">
                    <tr>
                      <td style="padding:24px 28px;">
                        <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#5a7a00;text-transform:uppercase;letter-spacing:0.6px;">Your Login Credentials</p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding:8px 0;border-bottom:1px solid #e8f0d0;">
                              <p style="margin:0;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                              <p style="margin:4px 0 0;font-size:15px;color:#1a1a1a;font-weight:600;font-family:monospace;">${toEmail}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0 8px;border-bottom:1px solid #e8f0d0;">
                              <p style="margin:0;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</p>
                              <p style="margin:4px 0 0;font-size:18px;color:#1a1a1a;font-weight:700;font-family:monospace;letter-spacing:2px;">${tempPassword}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0 0;">
                              <p style="margin:0;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your Role</p>
                              <p style="margin:4px 0 0;font-size:14px;color:#1a1a1a;font-weight:600;">${roleLabel}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}"
                           style="display:inline-block;background:#8bc34a;color:#1a1a1a;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:12px;letter-spacing:0.2px;">
                          Sign In to HRPay →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 8px;font-size:13px;color:#888;line-height:1.6;">
                    For security, please change your password from <strong>Settings</strong> after your first login.
                  </p>
                  <p style="margin:0;font-size:13px;color:#bbb;">
                    This invitation was sent by ${invitedByName} on behalf of ${companyName}.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f7f9f7;border-top:1px solid #eee;padding:20px 40px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#aaa;">
                    © ${new Date().getFullYear()} HRPay · HR &amp; Payroll Platform
                  </p>
                </td>
              </tr>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

${invitedByName} has invited you to join ${companyName} on HRPay.

Your login credentials:
  Email:              ${toEmail}
  Temporary Password: ${tempPassword}
  Role:               ${roleLabel}

Sign in at: ${loginUrl}

Please change your password from Settings after your first login.

© ${new Date().getFullYear()} HRPay
  `.trim();

  await transporter.sendMail({
    from: `"HRPay" <${process.env["SMTP_USER"]}>`,
    to: `"${toName}" <${toEmail}>`,
    subject: `You're invited to join ${companyName} on HRPay`,
    text,
    html,
  });
}
