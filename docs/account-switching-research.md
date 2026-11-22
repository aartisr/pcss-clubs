# Account choice after sign-out

Reviewed November 22, 2026.

## Evidence

- [Google distinguishes its browser session from an application's session](https://developers.google.com/identity/gsi/web/guides/migration). Clearing the Pioneer Clubs cookie does not sign someone out of Google or Chrome. The same Google account can therefore be used on the next authorization request.
- [Google's OAuth web-server reference](https://developers.google.com/identity/protocols/oauth2/web-server) defines `prompt=select_account` to request account selection. It is a focused request; `prompt=consent` would ask for consent again, and `prompt=none` cannot offer a person a choice.
- [Google's OIDC reference](https://developers.google.com/identity/openid-connect/reference) treats `hd` in the request as an account-selection hint. The signed `hd` claim in the returned identity token must still be checked for school membership. Pioneer Clubs already performs that server check.
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html) describes `select_account` for a person with multiple identity-provider sessions. The provider presents the chooser, so its appearance and Chrome's school-profile prompts remain outside the app's control.

## Experience comparison

| Source | Useful pattern | Decision here |
| --- | --- | --- |
| [Figma account switching](https://help.figma.com/hc/en-us/articles/1500005165741-Switch-between-accounts) | Account choice sits under the current name. | Put **Switch school account** in the existing identity menu. |
| [GitHub account switching](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/switching-between-accounts) | The profile menu identifies the current account and holds account actions. | Show name and email immediately before navigation and account controls. |
| [Microsoft Copilot account experience](https://learn.microsoft.com/en-us/copilot/plan/copilot-app-overview) | Work and personal identities have visible context and separate content. | Keep the current school identity clear and preserve per-account saved clubs. |
| [Google multi-account help](https://support.google.com/accounts/answer/1721977) | Switching Google accounts does not require signing out first. | Offer a direct switch, while explaining that Pioneer Clubs and Google sessions differ. |
| [NN/g research on young adults](https://media.nngroup.com/media/reports/free/Designing_for_Young_Adults_3rd_Edition.pdf) | People need a visible signed-in state. | Keep the current name in the header; avoid an extra welcome banner. |

## Product behavior

The account menu offers **Switch school account** without asking the person to sign out first. It has two clear groups: destination links and account actions. My clubs and schedule stay inside My space, reducing menu choices. The switch starts a fresh PKCE authorization request and asks Google to show account choice. The existing Pioneer Clubs session stays valid while selection is in progress. On success, the new verified identity replaces it. If selection is cancelled or the chosen account is not eligible, the previous session remains and the app explains what happened. A signed-in person without editor access can switch directly from the editor access page; a person without request access can switch from the club request page.

After an explicit sign-out, the app deletes its own session and stores an HttpOnly account-choice marker. The next sign-in asks Google to show the chooser. The marker remains through a cancelled or rejected attempt and is removed only after an eligible account completes sign-in. This avoids the surprising immediate return to the previous Google account, while keeping ordinary returning sign-ins fast. The marker stores no identity and cannot be read by page JavaScript. It expires after 30 days if no sign-in occurs.

The client ignores session checks that began before sign-out completed, so a late response cannot restore the old name in the interface. Saved-club data remains scoped to the signed-in email in browser storage; changing accounts does not display another account's shortlist.

Sign-in outcomes use a compact dismissible notice outside document flow, so a recoverable error does not permanently push page content down. The sign-out state uses plain language on My space. Google and Chrome profile prompts remain external; the portal does not claim to sign someone out of either.

While sign-out is pending, the menu disables account actions and says **Signing out…**. If the request fails, the app rechecks the session before showing an inline retry message; it does not declare sign-out successful on an unconfirmed response.

## Verification limits

Automated tests cover default fast sign-in, an explicit account switch, the first sign-in after sign-out, and rejection of an ineligible account without clearing the prior session. A live Google Workspace round trip still needs testing in each deployment and browser profile. Google or school-managed Chrome may show additional account or profile screens.
