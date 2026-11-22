# Pioneer Clubs implementation status

**Reviewed:** November 20, 2026

**Scope:** This repository and current working tree. This is a code audit, not a verification of Google Cloud, Vercel, DNS, or the live site.

**Related plan:** [School-member experience research and implementation plan](member-experience-research-and-plan.md).

## Status key

| Label | Meaning |
| --- | --- |
| **Implemented** | Code exists in this working tree. It may still require environment configuration or deployment. |
| **Partial** | Some supporting code exists, but the user-facing feature or shared workflow is incomplete. |
| **Remaining** | The feature is proposed in the plan and has no working implementation in this repository. |
| **Unverified externally** | The repository cannot establish whether an external account, service, or deployment is configured and working. |

The Edit-button visibility changes from the earlier authentication work are **uncommitted working-tree changes** as of this review. The status below describes the files on disk, including those changes. Do not read **Implemented** as “deployed to `pcssclubs.org`.”

## What is implemented

| Area | Current behavior | Evidence / limit |
| --- | --- | --- |
| Public club discovery | Visitors can browse the directory and campus/club pages, search and filter clubs by campus, category, and meeting day. | `src/pages/PortalDirectoryPage.tsx`, `src/pages/ClubSitePage.tsx`, `src/data/registrySelectors.ts`. The records are examples pending school verification. |
| Public page routes | Home, campus, credits, and club routes render from the Puck page model; editor routes exist. | `src/App.tsx`, `src/puck/pageModel.ts`, `src/pages/PuckDocumentPage.tsx`. |
| Page metadata and generated pages | The build generates route-specific HTML, metadata, `robots.txt`, and a sitemap from checked-in content. | `scripts/generate-search-pages.ts`, `tests/generated-pages.test.ts`. The publication flag is currently `false`, so club content is held from indexing. |
| Club page information | Club pages can show description, advisor/contact, and meeting details where fields are populated. | `src/pages/ClubSitePage.tsx`, `src/data/registry.ts`. Data quality and permission to publish are not established by the code. |
| Theme and quick search | Light/dark theme and command search are present. | `src/context/ThemeContext.tsx`, `src/components/CommandSearchModal.tsx`. |
| Editor OAuth flow | Server code supports OIDC Authorization Code with PKCE, state, nonce, validated ID token, encrypted HttpOnly session cookie, sign-in, session check, and logout. | `src/server/auth.ts`, `api/auth/*`, `src/server/index.ts`, `tests/auth.test.ts`. Real Google sign-in requires correct credentials and callbacks; not verified here. |
| Editor allowlist | An approved email or subject may edit; a configured Workspace `hd` claim is checked. With no allowlist or explicit open policy, sign-ins are denied. | `src/server/auth.ts`. Do **not** use `OIDC_EDIT_POLICY=authenticated` for the proposed member/editor split. |
| Puck access gate | `/editor/*` loads Puck only when the session reports `canEdit`. | `src/components/ProtectedEditorRoute.tsx`. There is no shared publishing API behind Puck. |
| Edit-control visibility | Navigation, club page, directory-card, and quick-search Edit controls are hidden unless `canEdit` is true. Directory management controls are also hidden. | Current working-tree edits in `src/components/Navbar.tsx`, `src/pages/ClubSitePage.tsx`, `src/pages/PortalDirectoryPage.tsx`, `src/components/CommandSearchModal.tsx`. These changes are not yet committed or confirmed deployed. |
| Signed-in account display | An editor session shows an account control in the desktop header and an identity card in the mobile drawer, with name, email, role, and Sign out. | Current working-tree edits in `src/components/AccountControl.tsx` and `src/components/Navbar.tsx`; see [account display research](account-identity-ux.md). School-member sessions are still missing. |
| Local editor drafts | Puck layouts and directory changes save in browser `localStorage`; Puck JSON and registry snapshots can be imported/exported. | `src/puck/pageLayoutStore.ts`, `src/context/RegistryContext.tsx`, `src/pages/EditorPage.tsx`, `src/components/AddEntityDrawer.tsx`. Changes do not sync across browsers or publish to visitors. |
| Automated project checks | Type checking, auth/registry/Puck tests, build, generated-page tests, and public-bundle checks are configured. | `package.json`, `tests/*`, `.github/workflows/ci.yml`. These do not replace a live Google OAuth or browser interaction test. |

## What is partial or remains

| Priority | Feature / work | Status | What is missing | Dependency / acceptance result |
| --- | --- | --- | --- | --- |
| P0 | Real club-content verification | **Partial** | School-approved names, schedules, contacts, media, content owners, and verification dates. | Keep the publication flag closed until reviewed real facts replace examples. |
| P0 | Google OAuth on localhost and deployment | **Unverified externally** | Confirm Google web clients, exact callback URIs, `.env.local`/Vercel secrets, Workspace account claims, and a full sign-in round trip. | Test editor and non-editor accounts on the exact host for each environment. Never put secrets in Git. |
| P0 | School-member session | **Remaining** | Today a valid `pioneercss.org` account outside the editor allowlist is redirected to `/?auth=denied` and gets no member session. | Refactor `src/server/auth.ts` so verified Workspace identity can be authenticated with `canEdit=false`; retain editor allowlist. |
| P0 | Role and capability model | **Remaining** | No `school_member` role, member capabilities, scoped reviewer role, or server authorization helper. | Add server-derived role/capabilities and tests for visitor/member/editor, wrong domain, expiry, and revocation. |
| P0 | Member account UI | **Remaining** | No member account menu, `/my` route, or signed-in “no editor access” state. | Member sees own identity and useful navigation; direct `/editor/*` access remains denied. |
| P1 | Shared account and club data | **Remaining** | No database, stable account records keyed by Google `sub`, or shared source for member data. | Choose school-approved storage, environments, backup, retention, and ownership. Use stable club IDs across slug changes. |
| P1 | Favorites / My Clubs | **Remaining** | No Save/Unsave button, `/my/clubs` route, favorites API, or cross-device persistence. | A member sees only their favorites in two browsers; another member cannot access them. |
| P1 | Reliable personal schedule | **Remaining** | No verified meeting ownership/freshness, `/my/schedule`, conflict detection, or missing-time states. | Never invent a time; flag conflicts only when times are known. |
| P1 | Calendar download | **Remaining** | No `.ics` endpoint or confirmed occurrence model. | Download only approved event/meeting details with correct timezone and audience. |
| P2 | New-member orientation and transparent club fit | **Remaining** | No optional interest selection, explanatory recommendations, or first-use member dashboard. | Members can dismiss/clear preferences; all clubs remain discoverable. |
| P2 | Club interest requests | **Remaining** | No request form, status model, assigned recipient, review queue, notifications, or retention policy. | School approves the workflow; request status is never confused with membership. |
| P2 | Correction suggestions | **Remaining** | No member submission or review flow. | Suggestions cannot directly change public content; only assigned reviewers can act. |
| P3 | Member-only notices | **Remaining** | No protected notice store, audience checks, approval/expiry workflow, or protected read API. | Private notice content never appears in public HTML, bundles, or APIs. |
| P3 | Dated events and RSVP | **Remaining** | No event model, capacity/eligibility rules, RSVP state, or cancellation workflow. | Implement only if school confirms the need and data policy. |
| P3 | Shared Puck publishing | **Remaining** | Editor changes stay in one browser; there is no draft/review/publish backend or rollback. | A reviewed change becomes consistent across browsers and public pages; audit and rollback work. |
| Cross-cutting | Privacy, accessibility, and operations review | **Partial** | The plan defines gates, but no school sign-off, member-flow accessibility test, data retention/deletion workflow, or shared-data backup rehearsal is recorded. | Complete each gate before launching the feature that depends on it. |

## Current access behavior by persona

| Persona | What works now | What does not work now |
| --- | --- | --- |
| Public visitor | Browses public pages and searches/filters clubs. Can see a Sign in entry if auth is configured. | Cannot open Puck, use directory management, or save a personal club list. |
| Other `pioneercss.org` account | Can browse like a visitor. | Cannot retain a signed-in member session or access member-only features; current callback denies non-editor accounts. |
| `pcss2robotics@pioneercss.org` editor | Can obtain an editor session if Google and server environments are correctly configured; can open Puck and browser-local management controls. | Cannot publish a shared content change from Puck or access a member dashboard that has not been built. |

## Recommended next sequence

1. **Verify the external setup and content.** Confirm the actual Workspace account, localhost Google OAuth round trip, and approved real club facts. Keep sample content unindexed.
2. **Implement Phase 1 of the member plan.** Add member sessions while preserving editor-only Puck access, then add the member account state and `/my` empty page. Test three personas and denial cases.
3. **Approve and introduce shared storage.** Agree on data categories, provider, retention, backup, and deletion; then build favorites as the first private member feature.
4. **Make schedules dependable.** Add verified meeting data, personal schedule, conflict/missing-data states, and calendar downloads.
5. **Add higher-trust workflows only after ownership is assigned.** Interest requests, correction review, notices, events, and shared publishing each need their own approval and access controls.

For feature detail, evidence, schema, candidate APIs, and phase exit gates, use the [member-experience plan](member-experience-research-and-plan.md). For the existing Google setup and role matrix, use [authentication](authentication.md). Update this status document when code is merged and again when a deployed environment is independently verified.
