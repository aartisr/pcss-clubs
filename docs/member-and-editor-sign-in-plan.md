# PCSS member and editor sign-in: research and implementation plan

**Prepared:** November 22, 2026  
**Status:** Proposed design; no sign-in behavior is changed by this document.  
**Scope:** Pioneer Clubs sign-in entry points, post-sign-in destinations, role language, and access-denied states.

## Decision

Give students and editors **different entry points and destinations, backed by the same PCSS Google sign-in**. A student chooses **Sign in to My space** and lands at `/my`. An authorized content editor chooses **Open editor** from a page they intend to change, or visits a dedicated `/editor` landing route. Both routes use the existing Google OIDC flow. The server, not the chosen button, determines whether the account may edit.

Call the privileged area **Editor** or **Manage pages** in the interface. The current permission is `canEdit`, which grants Puck and browser-local directory controls; it is not a school administrator role, a Google Workspace administrator role, or a publishing permission. Introduce **Admin** only if a distinct, approved application-administrator permission is later implemented.

This is a navigation and authorization separation, not two password systems. It avoids making a student choose between “normal” and “admin” accounts when they have one school identity. An editor can still use member features in My space.

## What the repository does today

| Area | Observed behavior | UX consequence |
| --- | --- | --- |
| Identity | `src/server/auth.ts` starts one OIDC Authorization Code flow; the callback accepts verified school members or allowlisted editors and returns `role: member/editor` from `/api/auth/session`. | The technical role split already exists. A second provider or password database is unnecessary. |
| Global entry | `src/components/Navbar.tsx` shows **School sign in** on desktop and sends users back to the current public URL. | After global sign-in, a student may see nearly the same page and wonder what changed. Mobile entry should be reviewed alongside desktop. |
| Account cue | `src/components/AccountControl.tsx` shows name, email, role, My space, and Sign out after sign-in. | Useful confirmation exists, but it appears only after the user notices and opens the account control. |
| Member destination | `/my` exists in `src/App.tsx` and `src/pages/MySpacePage.tsx`, with saved-club and request links. | This is the natural default destination for a general sign-in. Saved clubs are browser-local, so copy must not promise cross-device sync. |
| Editing | Page-level Edit links are shown only when `canEdit`; `/editor/*` is guarded by `ProtectedEditorRoute.tsx`. A signed-out visitor opening an editor URL sees “Sign in to edit this page.” | Editor wording is appropriate only when the person has deliberately entered an editor route. It should not be the general sign-in experience. |
| Management | `PortalDirectoryPage.tsx` can start sign-in from a manage/add action and return to a `?manage=` URL. | This is an editor-intent path and should use the editor-specific language and access result. |
| Denial | A rejected identity returns to `/?auth=denied`; a signed-in member on an editor URL sees an editor-access message. | The banner should distinguish an ineligible school sign-in from a member who lacks edit permission. |
| Google screen | Google displays one OAuth application name, documented in `docs/authentication.md` as **PCSS Pioneer Clubs**. | We control the local pre-sign-in context and return destination; we cannot make Google's shared consent/account chooser become two independently branded app screens with the same client. |

The older `docs/implementation-status.md`, `docs/account-identity-ux.md`, and portions of `docs/authentication.md` still describe member sessions as future work. Source code now implements the member session and `/my`. Update those documents during implementation so the plan and actual behavior agree.

## Research: five relevant product patterns

These are documented product behaviors, not measured rankings or claims that their UX outcomes are superior. The PCSS adaptation is our inference.

| Product and primary source | Observed pattern | What PCSS should use |
| --- | --- | --- |
| [Google Admin console](https://support.google.com/edu/setup/answer/182076) | `admin.google.com` is a separate management destination; only accounts with administrator access can enter. | A memorable editor destination with an explicit permission check. Do not copy Google's “admin” title for a role PCSS has not defined. |
| [Microsoft 365 admin center](https://learn.microsoft.com/en-us/microsoft-365/admin/admin-overview/admin-center-overview?view=o365-worldwide) | People sign in with their work account; the Admin app appears only when they have permission, and `admin.microsoft.com` is a direct entry. | One school identity, role-aware navigation, and a direct management URL for authorized people. |
| [Shopify customer accounts](https://help.shopify.com/en/manual/customers/customer-accounts/manage) and [Shopify admin login](https://help.shopify.com/en/manual/your-account/logging-in/log-in) | The storefront offers a customer account link for customer tasks; store operators enter the admin workspace for management tasks. | Make the global PCSS sign-in about student tasks. Put content management in the editor workflow, not beside every student's account action. |
| [WordPress dashboard](https://developer.wordpress.org/advanced-administration/security/logging-in/) | Visiting `/wp-admin/` while signed out starts authentication and returns to the dashboard; [dashboard guidance](https://learn.wordpress.org/lesson/getting-started-with-the-wordpress-dashboard/) describes a way back to the public site. | Preserve the intended edit destination after sign-in and provide **View public page** from the editor. |
| [GitHub organizations](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/about-organizations) and [organization roles](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/using-organization-roles) | People use personal accounts; owner and other permissions are assigned to those accounts, and management settings depend on the role. | Grant explicit editor capabilities to verified PCSS identities. Avoid a shared “admin login” credential or a button that grants privilege by intent. |

Cross-cutting guidance: [USWDS sign-in](https://designsystem.digital.gov/templates/authentication-pages/sign-in/) favors a clear, uncluttered entry and consistent “sign in” language; when a third-party identity service is used, its sign-in flow should remain the actual credential flow. [Google's OIDC reference](https://developers.google.com/identity/openid-connect/reference) says to identify accounts by stable `sub` and use the signed `hd` claim for Workspace membership, not an email suffix alone. [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) calls for default deny and permission checks on every protected request.

## Recommended journeys and copy

### 1. Public visitor wants a personal space

Global header: **Sign in** (mobile and desktop). Its accessible name or adjacent microcopy should clarify **“Use your PCSS school account for My space.”** If a dedicated `/sign-in` bridge page is useful, keep it to one headline, one Google button, and one “Continue browsing” link; do not present a student/admin choice card. The header can also go directly into Google after a clear label.

After successful global sign-in, land at `/my`. Show a short, dismissible, text-only arrival cue such as **“Welcome to My space. Save clubs here to build your list on this browser.”** Show the signed-in name/account in the header. Do not imply club membership or cross-device syncing.

If sign-in began from a specific task (save a club, request a club website), return to that task and show its next step. A generic header sign-in should not return to a visually unchanged public page.

### 2. Editor deliberately wants to change a page

An authorized editor sees **Edit this page** on an editable public page. A direct `/editor` landing page can say **“Manage Pioneer Clubs pages”** with links to the home, credits, campus, and club editors, plus **View public site**. A signed-out person opening an editor URL sees **“Sign in to edit this page”**, the school-account Google action, and **View this page**. Google returns the person to that exact editor URL only after the server validates the account.

An authorized editor entering through the ordinary header sign-in still lands in My space and sees an unobtrusive **Manage pages** link in the account menu. No automatic editor takeover occurs.

### 3. Signed-in student opens an editor URL

Keep the member signed in. Say **“This account can use My space, but it cannot edit pages.”** Offer **Go to My space** and **View public page**. If account switching is needed, offer **“Use a different school account”** as an explicit sign-out-and-sign-in action; do not repeatedly launch Google from the denial state. Do not use “administrator” in the denial copy.

### 4. Non-PCSS or failed sign-in

For an unverified or non-PCSS identity, explain **“Use a PCSS school account to sign in. You can still browse clubs without an account.”** Show **Try another account** and **Browse clubs**. For a network or provider error, say the sign-in could not finish and offer retry. Keep these states distinct from “signed in without editor access.” Do not expose allowlist membership or account details in a public error.

| Entry | Signed-out result | Member result | Editor result |
| --- | --- | --- | --- |
| Header **Sign in** | Google school sign-in | `/my` | `/my`, with **Manage pages** available |
| Save a club / request page | Google sign-in, return to task | Complete task | Complete task |
| `/editor` or a page Edit action | Google sign-in, return to intended editor route | Clear no-edit-access state, still signed in | Intended editor or editor landing |
| Public page direct visit | Public page | Public page with account cue | Public page with edit control only where editable |

## Implementation plan

1. **Define entry intents.** Add a small typed contract such as `member`, `task`, and `editor` to the app's sign-in helper. Keep a single `/api/auth/start` and callback. Derive the post-auth destination from a server-validated, relative return path; the intent is for copy and routing only, never authorization. Preserve the current state/nonce/PKCE protections. Restrict or validate return destinations so an external or malformed URL cannot be used as a redirect. Preserve fragments needed for `/support#request-club-site`.
2. **Make the header member-first.** Change the signed-out header and mobile drawer to **Sign in** with PCSS school-account context, defaulting to `/my`. Keep task-triggered sign-in contextual. Make the signed-in account control immediately communicate that sign-in succeeded; keep full email and role in the account panel. Add **Manage pages** only for `canEdit=true`, separate from **My space**.
3. **Create the editor entry.** Add a protected `/editor` landing route or use an explicit editor gateway that lists management tasks. Keep `/editor/home`, `/editor/credits`, campus, and club deep links functional. Page-level edit links remain contextual and visible only to editors. Route all add/manage actions through the same editor-intent helper and copy.
4. **Harden outcomes.** Extend `ProtectedEditorRoute` with the member-specific two-action state. Handle wrong account, expired session, auth unavailable, and already-signed-in editor without loops. The global `?auth=denied` banner should name school-account eligibility rather than imply editing was attempted.
5. **Keep the permission boundary server-derived.** Preserve the explicit editor allowlist and signed Workspace claim check. Never treat `/editor`, query `intent=editor`, a Google OAuth test user, or a school email suffix as proof of editor access. If a shared publishing API is added later, enforce editor capability on every server write and record an audit trail. Current Puck drafts remain browser-local until a separate publishing workflow exists.
6. **Align Google branding and documentation.** Keep the OAuth app name broad: **PCSS Pioneer Clubs**, not **Pioneer Clubs Editor**. Confirm the deployed Google branding, callback URLs, school-owned support contact, and app audience with the PCSS Workspace administrator. Update stale auth/status docs after code changes.

## Verification and success criteria

- Test on desktop and phone with three identities: signed-out visitor, verified PCSS member without editor permission, and allowlisted editor. Include a non-PCSS account when the Google audience permits it.
- Verify header, mobile drawer, account menu, `/my`, `/editor`, direct `/editor/*` links, task-return URLs, fragments, sign-out, session expiry, and back-button behavior. A member must never see an edit action or enter Puck; an editor must be able to reach the intended page without an extra choice screen.
- Automated tests cover callback destination validation, role outcomes, editor deep-link denial, and no privilege change from an `editor` intent parameter. Browser testing covers Google account switching and the actual provider screen, which repository tests cannot prove.
- Ask a small group of PCSS students and editors to perform two tasks: **“sign in to save a club”** and **“open the page editor.”** Record whether they choose the right path, understand their landing page, and can recover from a wrong-account state. Revise labels before release if they hesitate or mistake “editor” for school administration.

**Decision to confirm during implementation:** Whether PCSS wants a visible **Manage pages** link in an editor's account menu, or only page-level Edit controls plus a bookmarked `/editor` URL. The recommended default is both, shown only when `canEdit=true`.
