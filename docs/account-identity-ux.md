# Signed-in account display: research and design

**Reviewed:** November 20, 2026

**Scope:** How Pioneer Clubs identifies the current user in its interface. The account control for the current editor session is implemented in this working tree; school-member sign-in is still planned. See [implementation status](implementation-status.md).

## Recommendation

Use a compact **account control in the global header**. Its closed state shows an initials avatar (or a person icon when no name is supplied) and the signed-in display name. Activating it reveals a small panel with the full name, school email, an explicit account role, and **Sign out**. On mobile, put the same information in a clearly labeled account card at the top of the navigation drawer. Keep the full email out of the persistent header, where it is more likely to be exposed in screenshots or on a shared display.

This is an account identity cue, not a public profile. It should answer three questions without taking over the page: **Am I signed in? Which account is this? What can I do here?** The edit action stays next to the current page for the editor; the account panel explains the role and handles session actions.

### What the research supports

| Source and observed guidance | Pioneer Clubs decision |
| --- | --- |
| [Carbon's profile-menu pattern](https://www.carbondesignsystem.com/building-blocks/core/patterns/disclosures) places an avatar or icon in the global toolbar and account/session details in a popover. It identifies sign-out and settings as natural account actions. | Put a compact account trigger in the header and full identity in a disclosure panel. Use initials rather than requiring a Google profile image. |
| The [U.S. Web Design System header guidance](https://designsystem.digital.gov/components/header/) favors clear labels, consistent navigation, click/keyboard-operated dropdowns, and testing in the actual project. Its [sign-in guidance](https://designsystem.digital.gov/templates/authentication-pages/sign-in/) recommends a clear Sign in entry in the header. | Keep **Sign in** visible to signed-out visitors when configured; replace it with the account control after a valid session. Use a visible name, not an unlabeled icon alone. |
| The [W3C disclosure navigation example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/) uses a button with `aria-expanded`, ordinary links/buttons in the panel, Tab navigation, and Escape to close. It warns that typical navigation does not need the more complex ARIA `menu` widget. | Use a disclosure pattern rather than `role="menu"`. Keep normal tab order, Escape-to-close, and a visible focus indicator. |
| [Google's OIDC reference](https://developers.google.com/identity/openid-connect/reference) says `name` and `picture` may be absent, while `sub` is the stable account identifier. | Never depend on a photo or display name for authentication. Fall back to a generic account label and icon; use validated server session data for role and identity. |
| [WCAG 2.2 target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) requires adequate pointer targets, with a 24 CSS pixel AA minimum subject to exceptions. | Aim for a comfortably larger, roughly 44-pixel-high account trigger and sign-out target, especially on touch devices. |
| [U.S. Department of Education student-privacy guidance](https://studentprivacy.ed.gov/faq/i-want-use-online-tool-or-application-part-my-course-however-i-am-worried-it-violation-ferpa) asks schools to review online services handling student identity information. | Display account information only to that signed-in browser session. Do not turn the identity cue into a public student profile or roster. |

These sources describe patterns and constraints; the exact Pioneer Clubs layout and copy below are design inferences. They do not establish measured usability for PCSS students. Test with students and school staff before calling the design final.

### Alternatives considered

| Pattern | Strength | Problem for this site | Decision |
| --- | --- | --- | --- |
| Bare **Sign out** text in the header | Very small implementation | Does not answer which account is active; the current implementation hid the email in a tooltip. | Replace. |
| Avatar only | Compact on mobile | Initials alone can be ambiguous, and a missing Google photo leaves no reliable identity cue. | Use an avatar **with a name** on desktop; use a labeled account card on mobile. |
| Full name and email always visible | Clear identity | Crowds the existing search/theme/Edit header and exposes more student information on shared displays. | Put full details inside the account panel. |
| Name or initials + account disclosure | Recognizable identity with detailed confirmation on demand | Requires careful keyboard, focus, and outside-click behavior. | **Chosen**, using a native button and ordinary panel controls. |

The site already has a dense header with campus navigation, search, theme, and an editor action. A short account trigger is a better fit than a permanent profile block. On a phone, the existing navigation drawer has space for a complete account card, so a second nested popover would add unnecessary interaction.

## Information hierarchy

| Location | Show | Purpose / rule |
| --- | --- | --- |
| Desktop header, signed out | **Sign in** | Clear entry; do not imply an account is required for public browsing. |
| Desktop header, signed in | Initials/person icon + display name + down chevron | Immediate recognition. Truncate long names visually, while keeping an accessible full label. No full email in the closed trigger. |
| Open account panel | Name, full school email if provided, role label, **Sign out** | Confirm the exact account and authorization without crowding the header. Role is text, not color alone. |
| Mobile navigation, signed in | Full account card with icon, name, email, role, and full-width **Sign out** | No tiny hover target or second nested menu. Place before campus navigation. |
| Club or page context, editor only | **Edit This Page / Edit Club Page** | Keep the primary editing action near the page it edits, separate from identity. |
| Future member home | Optional “Welcome, [name]” once per page | Useful orientation; do not repeat full email or role badges throughout content. |

**Current role copy:** “Pioneer Clubs editor” for `canEdit=true`; “School account” is reserved for a future signed-in non-editor session. Avoid “Admin” in the interface unless an actual application-admin permission exists. Google Cloud project administration is a different role.

**Name fallback:** If Google does not provide a usable name, say “School account” and use a person icon. Do not manufacture a friendly name from the email local part. The complete email remains available in the open account panel when Google provides it. The app's server currently returns `name` and `email`, not the Google profile photo.

## State-by-state behavior

| State | Account area | Expected action |
| --- | --- | --- |
| Session check in progress | Reserve the control's space or show a quiet placeholder; no Edit control. | Avoid a flash of the wrong account or privileged action. |
| Auth is not configured | **Sign in** remains available. | Recheck the session endpoint on click; if setup is still unavailable, explain it in the page and offer public browsing and Support. Never replace the primary action with a help link. |
| Signed out, auth configured | **Sign in**. | Start Google sign-in and return to the intended page. |
| Signed in as robotics editor | Account control with name and “Pioneer Clubs editor”; page-level Edit control visible. | Open panel for email and Sign out; open Puck separately. |
| Future signed-in school member | Account control with name and “School account”; no Edit controls. | Open future My Clubs / My Schedule from primary navigation when those features exist. |
| Auth service failure | No stale privileged controls. | Show a retry path in the relevant protected flow; public browsing continues. |
| Session expires | Identity control disappears after refresh; protected page closes. | Explain expiry at the point of the attempted member/editor action. |
| User signs out | Clear account display and protected UI promptly. | Return from an editor page to the public site; do not leave sensitive data visibly cached. |

The **future member** row is a specification, not a feature in the current app. Today `src/server/auth.ts` creates a session only for users on the editor allowlist. Other `pioneercss.org` accounts are redirected to `/?auth=denied`.

## Interaction and accessibility contract

1. The desktop trigger is a native button with an accessible account label and `aria-expanded`. The panel is a disclosure with ordinary focusable controls; it is not an ARIA menu widget. This keeps familiar Tab and Shift+Tab behavior.
2. Enter or Space opens/closes the panel. Escape closes it and returns focus to the trigger. A pointer press outside or a route change closes it. The panel stays open while its content is used.
3. Sign out is a visible text action, not an unlabeled icon. Both the trigger and sign-out target have generous hit areas and visible focus rings.
4. Long names are visually truncated in the header; full details remain in the panel. Long email addresses wrap instead of overflowing the panel. Test at 200% zoom and at narrow mobile widths.
5. The role label is always text. Do not rely on avatar color, an icon, or initials to convey permission. Screen readers should encounter the account name, role, email when present, and Sign out in logical order.
6. Keep the mobile account card inside the existing navigation drawer, with no second account dropdown. Closing the drawer or navigating should remove the card from interaction until reopened.
7. Test with keyboard, touch, and at least one screen reader. Test empty name/email claims, long names, shared robotics account branding, editor sign-out, and slow session response.

## Current implementation and next steps

**Implemented in this working tree:** `src/components/AccountControl.tsx` provides the desktop disclosure and mobile account card. `src/components/Navbar.tsx` shows it when the existing session returns a user, replacing a bare Sign out link. It keeps full email inside the disclosure/card and uses `canEdit` only for the role label and page editing controls. No new Google scopes, photos, or profile database are required.

**Remaining before this serves ordinary school members:** Complete Phase 1 in the [member-experience plan](member-experience-research-and-plan.md): validate a school-member session separately from editor authorization, expose an explicit role/capability response, and update account copy and navigation from that server decision. Then add My Clubs/My Schedule links only when those destinations exist. Do not set `OIDC_EDIT_POLICY=authenticated` to make members appear signed in; that would grant edit access.

**Verification:** Run the repo build and test the panel in a real browser on localhost with the robotics account. Confirm open/close, Escape, focus, long-email wrapping, mobile drawer, and sign-out. Repeat on staging before release. The current repository cannot prove the external Google sign-in round trip without configured credentials.
