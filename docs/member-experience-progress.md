# Member experience implementation progress

**Updated:** November 22, 2026  
**Source plan:** [member-experience-research-and-plan.md](member-experience-research-and-plan.md)  
**Status:** Member entry and browser-local experience implemented; later shared-data and approval phases remain open.

## Completed in this implementation

| Plan area | Result | Main modules |
| --- | --- | --- |
| Clear sign-in destination | The global desktop/mobile sign-in action returns to `/my`; task-specific sign-in still returns to the task. A signed-out club page offers **Sign in to save this club**. | `Navbar.tsx`, `ClubSitePage.tsx`, `AuthContext.tsx` |
| Avoid repeat Google prompts | A valid site session now short-circuits `/api/auth/start` to the requested page. The client also follows the task link directly when it already knows the user is authenticated. | `auth.ts`, `AuthContext.tsx`, `tests/auth.test.ts` |
| Choose a different account | The desktop/mobile account menu can request Google's account chooser. Sign-in after explicit sign-out keeps requesting it until an eligible account completes sign-in; an unsuccessful switch preserves the prior site session. | `auth.ts`, `AuthContext.tsx`, `AccountControl.tsx`, `Navbar.tsx`, `tests/auth.test.ts` |
| Simplify account choices | A shared account menu shows identity, My space, optional page management, switch, and sign-out. Editor and club-request access screens offer a direct switch when the current account lacks access. Sign-in errors use a compact dismissible notice. | `AccountMenuContent.tsx`, `AccountControl.tsx`, `ProtectedEditorRoute.tsx`, `SupportPage.tsx`, `AuthFeedback.tsx` |
| Recover from callback failures | Expired transactions, mismatched state, cancellation, and token-exchange failures return to My space with a plain-language retry path. Sign-in help explains how to restart after a Google-hosted 400. | `auth.ts`, `Navbar.tsx`, `supportCenter.ts`, `tests/auth.test.ts` |
| Preserve the interrupted task | Callback failures retain a validated local destination so retry can finish an editor or club-request action. A shared path validator prevents unsafe browser-side shortcuts. Multiple tabs can complete independent sign-in attempts. | `auth.ts`, `authReturn.ts`, `AuthFeedback.tsx`, `tests/auth.test.ts` |
| Separate editor entry | Authorized editors have **Manage pages** in the account menu and a protected `/editor` landing page. Direct editor links retain their destination. A signed-in member opening an editor link remains signed in and gets a route to My space. | `AccountControl.tsx`, `EditorLanding.tsx`, `ProtectedEditorRoute.tsx`, `App.tsx` |
| Server-derived member capabilities | `/api/auth/session` now returns `saveClubs`, `requestClubSite`, and `editPages` capabilities. Browser state defaults to no capabilities while loading or after an error/sign-out. Saving and club-site request entry use these flags. Editor access remains controlled by the server's allowlist. | `auth.ts`, `AuthContext.tsx`, `SavedClubsContext.tsx` |
| Member destinations | `/my`, `/my/clubs`, and `/my/schedule` share a page shell and use focused child components. The home view starts with a clear next step; saved clubs remain reversible bookmarks with a browser-only disclosure. | `MySpacePage.tsx`, `components/member/*` |
| Weekly plan preview | Saved clubs are grouped by day; malformed or missing times are separated; possible overlaps are explained in text. The UI explicitly says sample meeting details await school verification and does not call them confirmed. | `memberSchedule.ts`, `MemberSchedule.tsx` |
| Automated checks | Added range/conflict unit tests; updated the auth role response test. Typecheck, unit tests, generated-page checks, and bundle budget pass via `npm run build`. | `tests/member-schedule.test.ts`, `tests/auth.test.ts` |

## Current limits and why they remain

| Plan phase | Status | Required next input or infrastructure |
| --- | --- | --- |
| 0. School and content decisions | Open | A PCSS sponsor must approve real club facts, meeting owners/verification dates, member audience, data categories, and request handling. The checked-in clubs remain prototype examples and public indexing stays off. |
| 1. Member identity and roles | Code path implemented; live round trip unverified | Test the real Google Workspace flow on localhost and staging with visitor, member, editor, and wrong-domain accounts. Confirm the school-owned OAuth configuration. |
| 2. Shared favorites | Browser-local version works; shared version open | Select a school-approved database, retention/deletion process, stable Google `sub` account mapping, and server APIs. Current saved clubs do not sync between browsers. |
| 3. Reliable schedule | Preview works; confirmed schedule and `.ics` open | Add per-meeting approval owner/date, verified recurring or dated occurrences, timezone-aware export, and cancellation handling. No calendar download is offered for unverified prototype data. |
| 4. Better discovery | Existing directory filters and member empty states work; fit/orientation open | Verify content and test an optional interest/campus choice with students before adding another first-run step. Do not rank sample data as recommendations. |
| 5. Managed requests | Club website email draft exists; membership/correction workflow open | A school-approved recipient/reviewer, response process, shared private storage, abuse controls, and retention rules are needed. A draft is not a submitted request or club membership. |
| 6. Notices/events | Open | School-approved audience rules, protected API, approval and expiry workflow. Member-only information must never be shipped in static HTML. |
| 7. Shared publishing | Open | Reviewed versioned content store, approval/rollback process, server authorization, and audit trail. Puck currently saves only in the current browser. |

## Verification performed

- `npm run build` — typecheck, tests, production bundle, generated pages, and bundle budget passed.
- The schedule parser test checks valid ranges, reversed/unknown ranges, overlaps, and missing times.
- Repository tests cannot prove Google OAuth configuration, live account switching, small-screen visual behavior, or school approval. Run these checks with real PCSS identities on staging before release.

## Next implementation sequence

1. Confirm a PCSS sponsor, actual member audience, and verified club content. Keep the current prototype status visible until then.
2. Pilot the sign-in paths with a verified member and an editor on staging. Check the Google app name **PCSS Pioneer Clubs**, exact callback URI, return to My space, and direct editor denial.
3. Choose a school-approved shared store and account lifecycle. Build own-data favorites APIs keyed by issuer + Google `sub`; add server ownership and CSRF checks. Migrate browser-local favorites only with an explicit user action.
4. Add meeting verification metadata and a school-owned approval workflow. Then enable confirmed next-meeting cards and calendar export with timezone/DST tests.
5. Implement interest requests, correction reviews, notices, and publishing only after their owners, audiences, and retention rules are approved.
