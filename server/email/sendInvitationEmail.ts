import { resend, FROM_EMAIL, APP_URL } from "./client";
import {
  getInvitationEmailHTML,
  getInvitationEmailText,
  type InvitationEmailData,
} from "./templates/invitation";
import type { Invitation, Organization, User } from "@shared/schema";

/**
 * Send an invitation email to a user
 *
 * @param invitation - The invitation record from database
 * @param organization - The organization the user is being invited to
 * @param inviter - The user who sent the invitation
 *
 * @throws Error if Resend API key is not configured
 *
 * @example
 * await sendInvitationEmail(invitation, organization, inviter);
 */
export async function sendInvitationEmail(
  invitation: Invitation,
  organization: Organization,
  inviter: User | null
): Promise<void> {
  try {
    // Format expiration date
    const expirationDate = new Date(invitation.expiresAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Get inviter name (fallback to email or "An administrator")
    const inviterName = inviter
      ? `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim() || inviter.email || "An administrator"
      : "An administrator";

    // Format role with proper capitalization
    const role = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);

    // Generate invitation link
    const invitationLink = `${APP_URL}/accept-invitation/${invitation.token}`;

    // Prepare template data
    const templateData: InvitationEmailData = {
      organizationName: organization.name,
      inviterName,
      role,
      invitationLink,
      expirationDate,
    };

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: invitation.email,
      subject: `You've been invited to join ${organization.name} on BeehaviorAI`,
      html: getInvitationEmailHTML(templateData),
      text: getInvitationEmailText(templateData),
    });

    if (error) {
      console.error("Failed to send invitation email:", error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }

    console.log("Invitation email sent successfully:", data);
  } catch (error) {
    console.error("Error sending invitation email:", error);
    // Don't throw - we don't want to block invitation creation if email fails
    // The invitation will still be created in the database
  }
}
