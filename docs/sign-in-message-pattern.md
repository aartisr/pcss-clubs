# Sign-in message pattern

## Decision

Use a persistent, compact recovery message in the page flow after the navigation when a sign-in attempt fails. Keep the account page's existing recovery card as the only message on `/my`. Give people a retry or account choice, a path to public clubs, and help when the service is unavailable. Never time out the message. A toast is suitable for a short confirmation such as “Saved,” but this failure requires decisions and may need to be read again.

## Five design-system references

| Reference | Useful principle |
| --- | --- |
| [GOV.UK notification banner](https://design-system.service.gov.uk/components/notification-banner/) | Place a message near the page heading; use main page content for information directly tied to the user's task; avoid stacking banners. |
| [Material Design snackbar](https://m3.material.io/components/snackbar/overview) | A snackbar is a brief, noninterrupting update at the edge of the screen. |
| [Shopify messages and feedback](https://shopify.dev/docs/apps/design/user-experience/alerts) | Choose among a system banner, contextual inline alert, and toast based on scope and persistence. |
| [Atlassian message guidance](https://atlassian.design/foundations/content/designing-messages) | Inline messages fit required actions; flags fit event feedback; full banners are for critical system messages. |
| [GitHub Primer banner](https://primer.style/product/components/banner/guidelines/) | Keep messages concise, show one banner at a time, and avoid dismissing an unresolved critical issue by accident. |

The recovery message is a **contextual status rail**: the icon identifies the issue, one sentence explains it, and plainly named actions offer a next step. It moves with the page instead of covering controls. On `/my`, the same information belongs in the account entry card. Successful sign-in remains quiet; the destination itself confirms success.

## Behavior to preserve

- Retry stays available when the school account check has a temporary error.
- Organization-denied accounts can choose another Google account.
- Public club pages remain available without sign-in.
- Screen readers receive an alert when the message appears; links and buttons have distinct labels and touch-sized targets.
- The message does not auto-dismiss, and mobile actions wrap instead of overflowing.
