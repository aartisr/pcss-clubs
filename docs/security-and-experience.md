# Security and experience boundaries

Pioneer Clubs keeps public discovery open. A visitor can read the directory, campus pages, club pages, support, and policies without signing in. A verified school member can use personal features; editor actions require separate server-side permission. The interface explains these choices before sign-in and gives people a route back to public pages when sign-in fails.

## Controls in this repository

- OAuth uses Authorization Code with PKCE, state, nonce, verified identity claims, a short-lived flow, and an encrypted HttpOnly session cookie. The server checks editor permission. A client-side button is never proof of access.
- Authentication responses are not cached. Logout requires a same-origin POST. HTTPS sessions use Secure cookies.
- Express and Vercel send matching browser headers for MIME sniffing, framing, referrers, device permissions, and a narrow CSP for framing, base URLs, and embedded objects. The CSP deliberately does not yet restrict scripts or styles; that needs an editor and development-mode compatibility review before enforcement.
- Editable links are restricted to web URLs, same-site paths, or permitted page fragments. Invalid links are not made clickable.
- `.gitignore` excludes local environment files, private keys, credentials, build output, deployment state, reports, and editor noise. It keeps example environment files visible. Ignore rules do not remove files already committed or protect against forced additions, so review staged files before committing.
- Browser-stored Puck and registry edits are local drafts. They do not grant access or publish to everyone. Public publication still requires reviewed deployment and school approval of content.

## Review before launch

Verify the configured Google OAuth consent screen, authorized domains, callback URLs, and real school-account flow in each environment. Check the browser console and Puck editor before strengthening script and style CSP directives. Confirm published club data, school permission, privacy text, and the approval status before enabling public indexing.
