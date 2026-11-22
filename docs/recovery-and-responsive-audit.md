# Sign-in recovery and responsive layout audit

Reviewed November 22, 2026.

## Recovery paths

The site checks `/api/auth/session` to determine whether a visitor has a school account session. A network error, non-JSON response, non-2xx response, or invalid server configuration can make that check fail. This is an availability problem, not proof that the visitor's identity was rejected. The production response was not observable from this workspace because its network proxy blocked access to `pcssclubs.org`; the exact deployed cause still needs an authorized network check.

- **First failure:** keep the familiar Sign in action. It checks the session again before starting Google sign-in.
- **Repeated failure:** leave the visitor on the current page and show a persistent, compact in-flow recovery message with Try sign-in again, Browse public clubs, and Get help. On My space, put these choices in the account card. Do not send visitors to an erroring OAuth endpoint or leave a button that appears to do nothing.
- **My space:** provide public browsing, a sign-in retry, and a Support link in the page itself.
- **Editor entry:** keep the public page and Support available even though the editor has no site navigation. Show a plain-language message after an unsuccessful retry.
- **Provider callback failure:** retain the original local destination for a later retry, and keep public browsing available.

This follows [W3C guidance on clear instructions and error messages](https://www.w3.org/WAI/tips/developing/) and [Nielsen Norman Group's error-message guidance](https://www.nngroup.com/articles/error-message-guidelines/): explain the problem in ordinary language and give a next action.

## Layout review

The public directory, campus and club pages, My space, Support, Credits, legal pages, account controls, and editor shell were inspected for fixed widths, wrapping, and narrow-screen actions. The layouts use single-column defaults and switch to multi-column layouts at named breakpoints. This pass tightened the sign-in recovery card, mobile search dialog, directory confirmation actions, editor header, and full-height editor drawer. Long content in site cards can wrap; modal content can scroll when the visible viewport is short. Motion remains disabled for visitors who prefer reduced motion.

[WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow) uses a 320 CSS pixel viewport as a useful minimum for vertical content. The design targets that width without requiring horizontal scrolling for ordinary page content. Automated type checking, public-page rendering, authentication-path tests, generated-page checks, and the bundle-budget check run in `npm run build`.

**Verification limit:** This environment exposed no interactive browser surface for viewport screenshots or device emulation. Physical-device and visual checks remain necessary before claiming compatibility with every mobile device, laptop, desktop, browser zoom level, and the third-party Puck editor. Test at 320, 375, 390, 768, 1024, and 1440 CSS pixels, plus a short mobile landscape viewport and 400% desktop zoom. Check navigation, search, sign-in recovery, editor controls, the request form, keyboard focus, and dark mode at each size.
