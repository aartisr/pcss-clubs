# Sign-in quality audit

Reviewed November 22, 2026. This is an implementation review, not a certification or a claim that provider-controlled screens cannot fail.

| Standard or principle | Evidence in this repo | Remaining check |
| --- | --- | --- |
| [Google web-server OAuth guidance](https://developers.google.com/identity/protocols/oauth2/web-server) and [OAuth security best current practice](https://datatracker.ietf.org/doc/rfc9700/) | Authorization code with PKCE, random state and nonce, exact configured callback, ID token validation, short-lived transaction, and a server-checked school domain. | Confirm the exact registered callback and school OAuth audience in Google Cloud for every deployed origin. |
| [OWASP local redirect guidance](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html) | One shared URL validator handles task return paths on server and browser. Unsafe paths fall back to the directory. | Review redirects again whenever a new external provider or host is added. |
| [WCAG 2.2 status messages, focus, and reflow](https://www.w3.org/WAI/WCAG22/Understanding/) | Sign-in results use text and `role="alert"`; dismiss and retry are named buttons; the feedback notice fits narrow widths without shifting the page. | Run keyboard, screen reader, zoom, and mobile browser checks with real rendered pages. |
| Clear user control | The current account is visible in the header. Switching asks Google to show account choice; signing out clears the site session and the next login keeps offering the chooser until success. | Check school-managed Chrome's profile handoff with real accounts. |
| Recover the interrupted task | Failed or cancelled callbacks retain a safe local destination. Retrying a club request or editor task returns there after successful sign-in. | Verify the real Google callback round trip on localhost and staging. |
| Resilience | Account-check failures keep **Sign in** available. Selecting it retries the account check before starting Google sign-in. A repeated failure offers another attempt, public browsing, and Support while preserving the page. Direct sign-in with missing provider setup reaches a readable unavailable state. Up to four concurrent sign-in attempts can finish independently. | Test network loss, expired state, two tabs, and provider outage in a browser. |

The automated suite covers role decisions, wrong state, cancellation, token exchange failure, account switching, sign-out account choice, blocked account switching, task return paths, and two concurrent transactions. `npm run build` runs type checking, the test suite, generated page checks, and the public bundle budget.

## Boundaries

Google owns its account chooser and consent pages. Chrome or school policy can add a managed-profile prompt. Pioneer Clubs cannot suppress those screens or recover a Google-hosted error that never redirects back. A copied stateless session cookie remains valid until its eight-hour expiry; server-side revocation would require a session store. Do not describe the flow as foolproof or WCAG-conformant until live provider and accessibility checks pass.
