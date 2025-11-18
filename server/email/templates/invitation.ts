/**
 * Email Template: Invitation to Join Organization
 *
 * Variables:
 * - organizationName: Name of the organization
 * - inviterName: Name of the person who sent the invitation
 * - role: Role being assigned (Admin, Teacher, Staff)
 * - invitationLink: Full URL to accept the invitation
 * - expirationDate: Formatted date when invitation expires
 */

export interface InvitationEmailData {
  organizationName: string;
  inviterName: string;
  role: string;
  invitationLink: string;
  expirationDate: string;
}

/**
 * HTML version of invitation email
 * Uses inline CSS for maximum email client compatibility
 */
export function getInvitationEmailHTML(data: InvitationEmailData): string {
  const { organizationName, inviterName, role, invitationLink, expirationDate } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${organizationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #3b82f6; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                BeehaviorAI
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600;">
                You've been invited!
              </h2>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.
              </p>

              <p style="margin: 0 0 32px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                BeehaviorAI is a comprehensive behavior management system for K-12 schools. Click the button below to accept your invitation and get started.
              </p>

              <!-- Accept Button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #3b82f6; border-radius: 6px;">
                          <a href="${invitationLink}" target="_blank" style="display: block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Or copy link -->
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 32px; color: #3b82f6; font-size: 14px; line-height: 1.5; word-break: break-all;">
                ${invitationLink}
              </p>

              <!-- Expiration notice -->
              <div style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 32px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>Note:</strong> This invitation expires on ${expirationDate}
                </p>
              </div>

              <!-- Security notice -->
              <div style="padding: 16px; background-color: #f3f4f6; border-radius: 4px;">
                <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                  If you didn't expect this invitation, you can safely ignore this email. If you're concerned about your account's safety, please contact your school administrator.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                Sent by <strong>BeehaviorAI</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                A comprehensive behavior management system for K-12 schools
              </p>
            </td>
          </tr>
        </table>

        <!-- Unsubscribe notice -->
        <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
          This is an invitation email. You received this because someone at ${organizationName} invited you to join their organization.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text version of invitation email
 * For email clients that don't support HTML
 */
export function getInvitationEmailText(data: InvitationEmailData): string {
  const { organizationName, inviterName, role, invitationLink, expirationDate } = data;

  return `
You've been invited to join ${organizationName}!

${inviterName} has invited you to join ${organizationName} as a ${role}.

BeehaviorAI is a comprehensive behavior management system for K-12 schools.

To accept your invitation, click the link below or copy and paste it into your browser:

${invitationLink}

IMPORTANT: This invitation expires on ${expirationDate}

---

If you didn't expect this invitation, you can safely ignore this email. If you're concerned about your account's safety, please contact your school administrator.

Sent by BeehaviorAI
A comprehensive behavior management system for K-12 schools
  `.trim();
}
