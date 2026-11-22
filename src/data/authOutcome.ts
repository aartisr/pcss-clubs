/** One public explanation for each provider callback outcome. */
const AUTH_OUTCOME_MESSAGES = {
  denied: 'That account cannot sign in here. Choose a PCSS school account, or keep browsing public clubs.',
  'switch-denied': 'That account cannot sign in here. Your previous account is still signed in, and public clubs remain open.',
  expired: 'Sign-in took too long. You can try again from Pioneer Clubs.',
  cancelled: 'Account choice was cancelled. Your account has not changed.',
  failed: 'Sign-in did not finish. You can try again from Pioneer Clubs.',
  setup: 'School sign-in needs a portal setup fix. You can still browse clubs, and the portal team can help.',
  unavailable: 'School sign-in is unavailable right now. Public club pages are still open.',
} as const;

export function authOutcomeMessage(result: string | null): string | undefined {
  if (!result || !Object.prototype.hasOwnProperty.call(AUTH_OUTCOME_MESSAGES, result)) return undefined;
  return AUTH_OUTCOME_MESSAGES[result as keyof typeof AUTH_OUTCOME_MESSAGES];
}
