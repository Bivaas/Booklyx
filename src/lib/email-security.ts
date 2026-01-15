/**
 * Disposable Email Domain Blocking
 * 
 * Blocks signup attempts using known disposable/temporary email domains.
 * Sourced from open-source disposable-email-domains list.
 * Loaded once at server startup, cached in memory.
 */

// Common disposable email domains (sourced from disposable-email-domains)
// This is a curated list of the most common ones
const DISPOSABLE_DOMAINS = new Set([
  // Guerrilla Mail
  "guerrilla.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "pokemail.net",
  "spam4.me",
  "tempmail.com",
  "tempmail.org",
  
  // Mailinator
  "mailinator.com",
  "mintemail.com",
  "temp-mail.org",
  "throwaway.email",
  
  // Fake Mail
  "fakemail.net",
  "fakeinbox.com",
  "fakermail.com",
  "fakemailgenerator.com",
  "grr.la",
  "grrla.com",
  
  // 10-Minute Mail
  "10minutemail.com",
  "10minutemail.de",
  "10minutesmail.com",
  "tempmail.de",
  "maildrop.cc",
  "temp-mail.io",
  "temporary-mail.net",
  "temporaryemail.com",
  "tempmail.ninja",
  "tempmaildotcom.com",
  "emailondeck.com",
  
  // TempMail
  "tempmail.shop",
  "tempmail.us",
  "tempmail.xyz",
  "temp-mail.shop",
  "temp-mail.xyz",
  
  // Other common disposable services
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "mailnesia.com",
  "maileater.com",
  "spam4.me",
  "temp-mail.club",
  "temp-mail.io",
  "temp-mail.me",
  "temp-mail.org",
  "mailnesia.com",
  "mohmal.com",
  "getnada.com",
  "mail.tm",
  "tempmail.email",
  "maildrop.cc",
  "trashmail.com",
  "10minutemail.info",
  "ethereal.email",
  "mailsac.com",
  "sharklasers.com",
  "spam4me.com",
  "fakeinput.com",
  "testmail.info",
  "dropmail.me",
  "mytrashmail.com",
  "tempmail.ninja",
  "fakemailz.com",
  "mailbox.ai",
  "hide-email.com",
  "mytrashmail.com",
  "dispostable.com",
  "spam.la",
  "spamgourmet.com",
  "tempmail.club",
  "temp-mail.net",
  "mailnesia.com",
  "throwme.top",
  "itsmail.io",
  "mailheap.com",
  "inboxkitten.com",
  "temp-mail.zone",
  "maildom.net",
  "inboxmail.io",
  "mailtest.io",
  "tinyemail.io",
  "smtp4dev.com",
  "api.mailslurp.com",
  "fakemailgenerator.org",
  "ownmail.net",
  "moakt.com",
  "mailtrap.io",
  "sendgrid.net",
  "mailtester.com",
  "inbox.testmail.app",
  "api.mocha.dev",
  "temp.email",
  "mail.tm",
  "mailheap.com",
  "inboxkitten.com",
  "getnada.com",
  "mailsac.com",
  "getmail.nz",
  "trash-mail.com",
  "temporary-email.com",
  "disposablemail.com",
  "email.ms",
  "mailcheck.co",
  "create.proton.me",
  "proton.me",
  "hidemail.net",
  "hidemail.com",
  "cuvox.de",
  "sharklasers.com",
]);

/**
 * Check if an email domain is disposable
 * Returns true if domain is in the denylist (should be blocked)
 */
export function isDisposableEmailDomain(email: string): boolean {
  try {
    const domain = email.toLowerCase().split("@")[1];
    if (!domain) return false;
    
    // Check exact match
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return true;
    }
    
    // Check subdomain match (e.g., sub.tempmail.com matches tempmail.com)
    const domainParts = domain.split(".");
    for (let i = 1; i < domainParts.length; i++) {
      const parentDomain = domainParts.slice(i).join(".");
      if (DISPOSABLE_DOMAINS.has(parentDomain)) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Validate email domain security
 * Returns error message if domain is blocked, null if allowed
 */
export function validateEmailDomain(email: string): string | null {
  if (isDisposableEmailDomain(email)) {
    return "Email domain is not allowed for signups";
  }
  
  return null;
}
