import "server-only";
import { Resend } from "resend";

/**
 * Newsletter provider synchronisation — FR-15.4.
 *
 * The requirement's reasoning matters more than the mechanism: the database
 * is the record of the list, and the provider holds a copy. That way a
 * provider change is an export and an import, not the loss of an audience the
 * client spent years building — and unsubscribes stay honoured locally even
 * if the provider is unreachable.
 *
 * Campaigns are still composed and sent in the provider's own interface
 * (FR-15.6). Nothing here sends anything; it only keeps the contact list in
 * step.
 *
 * Every call is best-effort. A provider outage must never fail a signup or,
 * worse, block an unsubscribe: the local state is authoritative, and
 * providerSyncedAt records what the provider has actually seen so a later
 * reconciliation can find the gaps.
 */
const apiKey = process.env.NEWSLETTER_PROVIDER_API_KEY ?? process.env.RESEND_API_KEY;
const audienceId = process.env.NEWSLETTER_LIST_ID;
const client = apiKey ? new Resend(apiKey) : null;

export function providerConfigured() {
  return Boolean(client && audienceId);
}

/** Add or update a confirmed subscriber. Returns true when the provider took it. */
export async function syncSubscriber(email: string, locale: "en" | "id"): Promise<boolean> {
  if (!client || !audienceId) {
    console.info(`[newsletter sync skipped — provider not configured] ${email}`);
    return false;
  }
  try {
    await client.contacts.create({
      audienceId,
      email,
      unsubscribed: false,
      // The provider needs the language to send the right campaign; it is the
      // only subscriber attribute the site has that a campaign would use.
      firstName: locale === "id" ? "ID" : "EN",
    });
    return true;
  } catch (error) {
    console.error("[newsletter sync failed]", email, error);
    return false;
  }
}

/** Mark a contact unsubscribed at the provider, so a campaign cannot reach them. */
export async function unsubscribeAtProvider(email: string): Promise<boolean> {
  if (!client || !audienceId) return false;
  try {
    await client.contacts.update({ audienceId, email, unsubscribed: true });
    return true;
  } catch (error) {
    // Logged, not thrown: the local status is already UNSUBSCRIBED and that is
    // what the site honours. A failure here is a reconciliation problem, not a
    // reason to tell someone their unsubscribe did not work.
    console.error("[newsletter unsubscribe sync failed]", email, error);
    return false;
  }
}
