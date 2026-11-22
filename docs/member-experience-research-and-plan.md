# Pioneer Clubs: school-member experience research and implementation plan

**Research date:** November 20, 2026

**Status:** Product proposal and implementation plan. Section 3 records current behavior; all member-experience designs and phases are proposed.

**Audience:** Pioneer Charter School of Science students and staff with verified `pioneercss.org` Google Workspace accounts; the separately authorized robotics editor; school reviewers.

**Decision owner:** PCSS school sponsor for student-data, content, and communication policy.

For a current code audit and outstanding-work list, see [Implementation status](implementation-status.md).

## 1. Executive decision

Build a school-member experience around one promise: **find a club, understand the commitment, and take the next step with confidence**. A member's first screen should answer: *What fits me? When can I go? What happens if I ask to join?* The app should preserve open browsing, add a personal workspace after sign-in, and keep Puck and directory editing exclusive to the editor account.

Recommended first release: **school-member session + verified club information + favorites + a personal weekly plan + calendar download**. This can deliver real value without collecting membership rosters or sending messages. Add interest requests, correction suggestions, and member-only notices after a school-approved workflow and shared backend exist. Do not equate a favorite, an interest request, an RSVP, and approved club membership.

This is a design recommendation based on publicly accessible product and school documentation, not a claim that a particular competitor has superior measured outcomes. University systems are useful pattern references, but their data and social features are not automatically appropriate for a K–12 school.

## 2. Research method and evidence

I reviewed public club pages, product help, and school guidance from the sources below. I compared the tasks available to a visitor, a signed-in member, and an organizer; the information shown before a user commits; and the way a product handles schedules, joining, contact, and privacy. I did not access private accounts, measure conversion, or run usability sessions. Claims below refer to the linked source; the proposed adaptation is our inference.

| Reference | Observed pattern | Pioneer Clubs adaptation | Caution |
| --- | --- | --- | --- |
| [MIT Engage club page](https://engage.mit.edu/bsf/home/) and [MIT organization signup](https://engage.mit.edu/club_signup?view=all) | Organization pages show purpose, upcoming events, benefits, team, and a join path. Directory entries expose categories and descriptions. | Give each club a crisp purpose, commitment, next meeting, eligibility, and one next action. | An empty event module or generic benefit text weakens trust; show an honest empty state or hide an unmaintained section. |
| [Anthology Engage organization joining](https://help.anthology.com/engage/en/joining-an-organization.html) | Joining may be automatic or may become an approval request; restricted organizations may offer contact instead. | Label the action **Ask to join** until PCSS defines an approval process; show the request's status. | Never represent a submitted request as confirmed membership. |
| [Anthology Engage contact flow](https://help.anthology.com/engage/en/contacting-an-organization.html) and [primary contacts](https://help.anthology.com/engage/en/organization-primary-contacts.html) | Contact can work before membership; personal contact details can be withheld from unauthenticated visitors. | Route questions through a moderated contact path; do not publish a student's personal address to everyone. | Requires an assigned adult or approved school inbox and a response expectation. |
| [Anthology Corq](https://help.anthology.com/engage/en/using-corq.html) and [orientation guide](https://help.anthology.com/engage/en/using-engage-for-orientation-and-new-student-programs.html) | Mobile discovery, event filters, calendar saving, and RSVP connect browsing to attendance. | Make the site mobile first; provide a weekly meeting view and standards-based `.ics` download before adding calendar permissions. | A saved event is not attendance; a calendar entry does not update itself after a schedule change. |
| [Anthology event RSVP settings](https://help.anthology.com/engage/en/configuring-your-event-rsvp-settings.html) | Events can control who may RSVP, capacity, and guest rules. | Model each event's audience and RSVP policy explicitly if events are added. | Avoid collecting guest, attendance, or health data without a school-approved purpose. |
| [FIRST Dashboard update](https://www.firstinspires.org/community-blog/2026-2027-season-pricing-and-registration-updates) | Team-associated dashboard and visible outstanding tasks for coaches. | Use a small **Your next step** panel and visible request status; add advisor task views only after roles are assigned. | A generic school login cannot prove someone is an advisor or coach. |
| [NYU student-life description of Engage](https://publichealth.nyu.edu/students/current/student-life-resources) and [Harvard student organization guidance](https://families.college.harvard.edu/resources) | Large directories pair discovery with direct routes to leaders, events, and organization management. | Keep public discovery broad while making signed-in actions personal and role-specific. | These are higher-education examples; avoid importing open rosters and social feeds into a K–12 setting. |

### Patterns to adopt

1. **The next action is explicit.** Every club page should say whether a student can attend a meeting, ask a question, or request to join. Show any prerequisites before the action.
2. **Schedules are usable, not just displayed.** A signed-in member should see saved clubs in one weekly view with conflicts and missing-time warnings.
3. **State is honest.** Use distinct labels: *Saved*, *Interested*, *Request sent*, *Approved*, *Waitlisted*, *Declined*, *Cancelled*. Never use *Member* without an approved membership record.
4. **Information has an owner and freshness date.** Show who approved meeting details and when they were checked. Unknown information should be visibly unknown, not silently filled with sample data.
5. **Contact is purposeful.** Offer a supervised route to an advisor or school-approved club contact, not an unmoderated student-to-student messaging network.

### Patterns to defer or reject

| Pattern | Decision | Reason |
| --- | --- | --- |
| Public member rosters, student leader email addresses, or open profiles | Reject for initial release | A school-domain login alone is too broad a basis for disclosing student information. |
| Open direct messaging, comments, or social feed | Defer | Requires moderation, reporting, retention rules, and adult ownership. The core club-discovery task does not need it. |
| Points, streaks, public rankings, and attendance leaderboards | Defer | Could pressure students or expose participation patterns; no demonstrated need for this portal. |
| AI-generated club matches from personal student data | Defer | A transparent, deterministic fit explanation can work with far less data and oversight. |
| Google Calendar, Gmail, or Drive OAuth scopes | Reject for MVP | `.ics` export and in-app status require only current `openid profile email` sign-in scopes. |
| Automatic membership from a favorite or click | Reject | Misstates status and bypasses school and club approval rules. |

## 3. Current product baseline and hard constraints

| Area | Current repo behavior | Consequence for member work |
| --- | --- | --- |
| Sign-in | `src/server/auth.ts` creates a session only for the editor allowlist; other school accounts go to `/?auth=denied`. | Split verified school identity from editor authorization before building member-only pages. |
| Roles | Browser state exposes `canEdit`; no member role or capability model. | Add server-derived capabilities. Do not infer role from an email suffix or front-end state. |
| Content | Two example campuses and eight example clubs are checked into `src/data/registry.ts`; publication flag is off. | Verify real club details and ownership before inviting students to depend on schedules or join links. |
| Persistence | Registry edits and Puck drafts live in browser `localStorage`; generated public HTML comes from checked-in defaults. | Shared favorites, requests, notices, and approvals need a backend. A local Puck change cannot feed a shared member experience. |
| Routes | Public directory, campus, credits, club pages, and editor routes exist. | Reuse the directory and club models; add `/my`, `/my/clubs`, and `/my/schedule` only after member auth works. |
| Events | Club records have meeting-day/time fields; there is no approved one-time event or RSVP system. | Build weekly plans from verified recurring meetings first. Model dated events separately later. |
| Hosting | Vite/React front end with Express local server and Vercel auth functions. | Keep local and deployed auth behavior consistent; choose a shared data store before server writes. |

The existing [authentication matrix](authentication.md#access-matrix-public-school-members-and-editors) is the source of truth for current versus proposed access. This document expands the proposed member experience and the delivery sequence.

## 4. Product design: what the member sees

### 4.1 Navigation and first visit

**Public navigation:** Clubs, Campuses, Credits, Sign in. Public search and club pages remain useful without an account. Only verified public content is shown.

**School-member navigation:** Explore, My Clubs, My Schedule, account menu. The account menu shows the signed-in name, school account, privacy/data controls when available, and Sign out. There are no Edit or directory-management links.

**Editor navigation:** Member navigation plus Edit This Page, Manage Directory, and a future review queue. Editor controls remain visually distinct from member actions.

**First signed-in visit:** Show one short, skippable orientation panel: (1) choose campus or “all campuses”; (2) choose up to three interests, optional; (3) save a club or dismiss. Do not ask for grade, date of birth, phone, or friends. If the account has no saved clubs, show a useful discovery empty state rather than an empty dashboard. Remember only choices needed for the feature, with a way to clear them.

**Member home `/my`:** A mobile-first sequence: **Next meeting** (or “No confirmed meetings yet”), **Your clubs**, **Explore one new club**, and **Your requests** only after requests exist. Each card has one primary action. A member should reach a club page or next meeting in at most two deliberate actions from this screen. This is a design target to test, not a measured current result.

### 4.2 Club discovery and detail

Directory cards should answer **what**, **where**, **when**, and **how to begin**. Use category and campus labels, a one-sentence description, next verified meeting, commitment level if approved, and a clear **View club** action. Signed-in users also see **Save**. When schedule details are unknown, show “Meeting time not confirmed.” Avoid invented meeting or membership numbers.

Club pages should have: mission, who can participate, meeting pattern and location, what happens at a first meeting, equipment or cost if applicable, approved advisor/contact channel, current notices, and a visible “Details checked on [date]” label. Place **Save**, **Add to calendar** (when a dated meeting is confirmed), and **Ask to join** (when enabled) near the top. If a club is not accepting requests, explain the status and show an approved contact route.

### 4.3 My Clubs and transparent fit

**Save** is a reversible personal bookmark, not an enrollment. `/my/clubs` lists saved clubs with campus, next verified meeting, and status. Members can unsave without affecting any request or membership. Default sort: next confirmed meeting, then club name; offer campus and category filters.

An optional **Find my fit** control can rank clubs using explicit interests, campus, meeting-day availability, and disclosed prerequisites. Every recommendation must explain itself, such as “Matches robotics interest; meets Thursday; no schedule conflict.” Users can clear interests and use the ordinary directory instead. Do not score students, infer protected traits, or hide clubs because of a recommendation.

### 4.4 My Schedule

Show a list view first and an optional weekly grid. Include saved clubs with verified recurring meeting details, one-time events when added, and the school timezone. Detect overlap only when both start and end times are known. A club with a day but no time goes under **Time to confirm**, not on an invented slot. When a meeting changes, mark the saved plan as needing review. Export an individual confirmed occurrence as `.ics`; explain that a downloaded calendar file will not automatically receive updates. A subscribed calendar feed is a later feature and needs a stable, private token design.

### 4.5 Interest requests, suggestions, and notices

**Interest request:** A member chooses **Ask to join** and sees the club's actual process and recipient. The minimum form is a short optional note. The confirmation includes what happens next and an expected response window set by the school. A private status page shows *Sent → Under review → Approved/Declined/Withdrawn*. The school must decide whether a club advisor, staff member, or central coordinator receives and responds to requests. Do not send messages until that ownership is assigned.

**Correction suggestion:** On any club page, a member can flag an incorrect meeting, description, contact, or accessibility detail. The suggestion goes to a review queue, never directly into public content. The submitter can see *Received*, *Reviewing*, *Resolved*, or *Closed* without exposing reviewer notes that may contain private information. Rate limits and abuse handling are required.

**Notices:** Separate *Public* from *School members*. A cancellation or room change should appear only to its intended audience and retain an author, approval, publish time, and expiry. Member-only notices must come from a protected response, not from hidden public HTML or a browser bundle. Start with in-app notices; email or push notifications need separate preferences and school approval.

### 4.6 Interaction and copy contract

| Situation | Interface behavior | Example wording |
| --- | --- | --- |
| Visitor opens a club | Show all approved public facts and a purposeful sign-in entry only when a member action is available. | “Sign in with your school account to save this club.” |
| Member has no favorites | Show campus/category exploration and two or three verified clubs, with no fabricated popularity ranking. | “Your club list is empty. Save a club to build your schedule.” |
| Favorite saves | Update the button immediately, then confirm the server write; restore the prior state if it fails. | “Saved to My Clubs.” / “Could not save. Try again.” |
| Meeting time is missing or stale | Keep the club visible but omit it from time-grid placement and calendar export. | “Meeting time needs confirmation.” |
| Two saved meetings overlap | Show both entries; state the overlap in text and offer links to both club pages. | “Robotics and Art Club overlap on Thursday.” |
| Request is submitted | Show its status, recipient/workflow, and withdrawal option if allowed. | “Request sent. This does not confirm club membership.” |
| Member opens an editor URL | Keep session intact and show a clear return path. | “You are signed in, but this account cannot edit pages.” |
| Session expires during a write | Preserve safe unsent form content locally for the active tab, ask for sign-in, then retry only after user action. | “Your session ended. Sign in to finish.” |
| Service is unavailable | Preserve public browsing and previously loaded non-sensitive context; do not imply a save succeeded. | “Your saved clubs are unavailable right now. Public club pages still work.” |

Navigation, labels, and error messages should be tested with students before launch. The copy above is proposed product text, not current UI text.

## 5. Access and content policy

| Operation | Visitor | Verified school member | Robotics editor | Future assigned advisor/reviewer |
| --- | --- | --- | --- | --- |
| Read approved public club data | Yes | Yes | Yes | Yes |
| Read school-only notices | No | Yes | Yes | As assigned |
| Create/read/delete own saved clubs | No | Own only | Own only | Own only |
| Create/read/withdraw own interest request | No | Own only | Own only | Own only |
| Read another student's request | No | No | Only if explicitly assigned | Assigned clubs/queue only |
| Submit a correction | No initially | Yes | Yes | Yes |
| Review requests or corrections | No | No | Only if explicitly assigned | Assigned scope only |
| Open Puck or mutate directory records | No | No | Yes | No, unless separately granted |
| Publish approved content to everyone | No | No | Not yet implemented | Not yet implemented |

**Identity rule:** Validate Google's ID token; require `email_verified=true` and signed `hd=pioneercss.org` for a school-member session. Store the issuer and immutable Google `sub` as the account key. Compare the editor account separately against a reviewed subject allowlist (or the existing verified-email allowlist until its `sub` is recorded). Google explicitly cautions that an email suffix alone does not prove Workspace membership and recommends `sub` for account identity: [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect). A Google Cloud project admin or OAuth test user is not automatically an application admin.

**Authorization rule:** Each API request checks the current session and the requested action/object on the server. Default deny. UI capability flags are for presentation only. If a member deep-links to `/editor/*`, show a signed-in **No editor access** state rather than another sign-in prompt. Never set `OIDC_EDIT_POLICY=authenticated` for this design. [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

**Role assignment:** `school_member` is derived from current validated Workspace identity; `editor` is explicit. Any later `advisor` or `reviewer` role must be assigned by an authorized school administrator to an account and a scope (campus/club), with an auditable approval and revocation path. The Google domain does not reveal a user's employment, age, campus, or club affiliation.

## 6. Privacy, safety, and accessibility gates

The school sponsor should decide what data this portal may collect, who may see it, how long it is kept, and how families or students request correction/deletion before personal request workflows launch. The U.S. Department of Education advises schools to review online-service approval and uses of education-record PII; the FTC's COPPA guidance limits school-authorized data collection to an educational purpose. These are design gates, not a conclusion that any proposed feature is legally cleared. [Student Privacy Policy Office](https://studentprivacy.ed.gov/faq/i-want-use-online-tool-or-application-part-my-course-however-i-am-worried-it-violation-ferpa), [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions).

| Data or interaction | Default rule | Launch decision needed |
| --- | --- | --- |
| Account identity | Keep `issuer`, `sub`, verified email, and optional display name; no Google provider tokens in browser JavaScript. | Confirm school approval of the service and data processor/storage location. |
| Favorites and interests | Private to the account; interests optional; no public profile. | Retention and account-deletion policy. |
| Requests and suggestions | Private to submitter and assigned adult reviewers; minimize free text; prevent attachments at first. | Reviewer, response process, retention, escalation, and abuse policy. |
| Club rosters and attendance | Do not collect in MVP. | Separate approval and access design. |
| Advisor/student contact | Use approved school contact routes; no public student email or phone by default. | Content approval and contact ownership. |
| Analytics | Aggregate task outcomes; avoid individual engagement scores or third-party ad tracking. | School-approved analytics method and retention. |
| Calendar | Download only confirmed event details; no external account access. | Who may see school-only event locations. |

Build to **WCAG 2.2 AA** as a product target: keyboard-complete navigation, visible focus, semantic labels, readable contrast, accessible status messages, usable touch targets, no color-only schedule conflicts, and reduced-motion support. Test sign-in, save/unsave, schedules, errors, and dialogs with keyboard and a screen reader. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/). Keep a responsive list view even if a calendar grid is offered.

## 7. Implementation architecture

### 7.1 Auth and capabilities

1. Refactor `src/server/auth.ts` so successful verified school sign-in creates a member session even when `canEdit=false`. Preserve PKCE, state, nonce, signed-claim verification, encrypted HttpOnly cookie, and eight-hour maximum session policy. Separate `isSchoolMember` from `canEdit` and keep the editor allowlist explicit.
2. Return a minimal `/api/auth/session` shape such as `{ authenticated, user: { name, email }, role, capabilities: { saveClubs, readMemberNotices, submitRequest, canEdit } }`. Do not return `sub`, tokens, or private role-assignment data to browser code unless needed for a user task.
3. Introduce one server-side authorization helper that accepts `(actor, action, resource)` and is called by every future member endpoint. Session checks must re-evaluate current role assignments so revocation does not depend solely on the stateless cookie's expiry. Add origin/CSRF checks to state-changing endpoints.
4. Update `AuthContext`, `Navbar`, `ProtectedEditorRoute`, and account states. A member sees their account and member navigation. An editor sees member navigation plus editing controls. A visitor sees the Sign in entry. Distinguish *not signed in*, *signed in without editor access*, *expired session*, and *provider unavailable*.
5. If Google OAuth is **External/Testing**, add the intended school testers or move to an approved audience mode before pilot rollout; the app cannot grant a member session to an account Google will not let through consent.

### 7.2 Shared data and content source

Choose a school-approved managed relational database after confirming hosting, access, backup, cost, and student-data requirements. A PostgreSQL-compatible store is a practical fit for this app's relationships and constraints, but the plan does not select a vendor. Use separate local/test/staging/production data stores and credentials. Keep secrets server-side.

| Entity | Key fields | Constraints and purpose |
| --- | --- | --- |
| `accounts` | `id`, `issuer`, `subject`, `email`, `display_name`, `created_at`, `last_seen_at` | Unique `(issuer, subject)`; email is mutable display/contact data, not primary identity. |
| `account_roles` | `account_id`, `role`, `scope_type`, `scope_id`, `granted_by`, `revoked_at` | Explicit editor/reviewer/advisor grants; audit role changes. School-member status derives from verified login. |
| `clubs` | stable `id`, `campus_id`, `slug`, `name`, `status`, `verified_at`, `verified_by` | Keep stable IDs across slug changes; only approved public records enter public pages. |
| `club_meetings` | `id`, `club_id`, `weekday`, `start_local`, `end_local`, `location`, `timezone`, `verified_at` | Recurring schedule; unknown values stay null; validate time ordering. |
| `favorites` | `account_id`, `club_id`, `created_at` | Unique pair; private; deleting favorite does not alter requests. |
| `events` | `id`, `club_id`, `starts_at`, `ends_at`, `timezone`, `audience`, `status`, `approved_at` | Dated events and cancellations, separate from recurring meeting rules. Add in a later phase. |
| `interest_requests` | `id`, `account_id`, `club_id`, `status`, `note`, `reviewer_id`, timestamps | One active request per member/club unless school policy says otherwise; keep status history. |
| `correction_suggestions` | `id`, `account_id`, `club_id`, `field`, `suggestion`, `status`, `reviewer_id`, timestamps | Never directly mutate club content; scoped reviewer access. |
| `notices` | `id`, `club_id`, `audience`, `body`, `published_at`, `expires_at`, `approved_by` | Server-filtered by audience and time. |
| `audit_events` | `actor_id`, `action`, `resource_type`, `resource_id`, `occurred_at`, `result` | Record role grants, review decisions, and content publication without storing unnecessary message text. |

Before database migration, use reviewed checked-in club records as an import source, preserving their stable IDs. Decide whether the database or repository is authoritative for published club facts, and implement one explicit approval/publish path. Do not allow browser-local Puck/registry drafts to masquerade as globally published content. Keep public page generation and indexing gated on verified facts. Member-only data should be fetched after authentication from APIs with `no-store` or carefully scoped private caching; it must not enter static HTML or a public sitemap.

### 7.3 Candidate API surface

| Endpoint | Method | Access | Contract |
| --- | --- | --- | --- |
| `/api/auth/session` | GET | Everyone | Minimal session, role, and capabilities; `no-store`. |
| `/api/me/favorites` | GET, POST | Member | List own favorites; add club by stable ID; idempotent duplicate handling. |
| `/api/me/favorites/:clubId` | DELETE | Member | Remove own favorite; repeat delete is safe. |
| `/api/me/schedule` | GET | Member | Verified meetings/events from saved clubs plus missing-data warnings. |
| `/api/clubs/:clubId/calendar.ics` | GET | Public or member per event audience | Download validated confirmed occurrence; no unapproved private location leak. |
| `/api/me/interest-requests` | GET, POST | Member, later phase | Own requests only; validate club eligibility and note length. |
| `/api/me/interest-requests/:id` | PATCH | Request owner, later phase | Withdraw only while permitted; enforce state transition. |
| `/api/me/corrections` | GET, POST | Member, later phase | Own suggestions; rate limit and length limits. |
| `/api/review/*` | GET, PATCH | Explicit scoped reviewer, later phase | Assigned queues and audited decisions; default deny. |

For all writes: validate inputs server-side, require an authenticated session and same-origin/CSRF defense, enforce object ownership, reject unknown club IDs, use database constraints, and return clear errors. Never rely on a hidden button to protect an endpoint. Use pagination for growing lists and structured error codes for expired sessions, conflicts, and unavailable services.

## 8. Delivery plan and acceptance gates

The ordering below is a dependency sequence, not a promise of dates. A small team can estimate after confirming the school sponsor, approved data store, and real club content. Each phase should ship through test, staging, and production as described in [the release strategy](environments-and-release.md).

| Phase | Deliverables | Exit gate |
| --- | --- | --- |
| **0. School and content decisions** | Named sponsor/reviewer; approved data categories and retention; verified club facts; member/visitor content boundary; response owner for future requests. | No sample schedules presented as confirmed; school signs off on what students may see and submit. |
| **1. Member identity and roles** | Verified Workspace member session; separate editor permission; account menu; member-only route shell; denied-editor state; role tests. | Visitor, member, editor, wrong-domain, unverified-email, expired-session, and revoked-editor cases pass locally and on staging. Puck remains editor-only. |
| **2. Shared favorites** | Approved database; stable account and club IDs; favorites API; Save/Unsave; `/my/clubs`; private empty/loading/error states. | A member's favorites persist across two browsers; another member cannot read or change them; deletion works. |
| **3. Reliable schedule** | Verified meeting data, owner/freshness labels, `/my/schedule`, overlap and missing-time states, `.ics` download. | Wrong or unknown times are never invented; daylight-saving/timezone cases and cancellation messages are tested. |
| **4. Better discovery** | Club-page content standard; first-visit orientation; transparent interest/campus/day matching; usability and accessibility review. | New users can identify a suitable club, commitment, next meeting, and next action in moderated testing; recommendations explain their reasons. |
| **5. Managed requests** | School-approved interest and correction workflows; queue, scoped reviewers, status history, rate limits, notifications only if approved. | No request is mistaken for membership; submitters see only own records; only assigned reviewers can act; abuse and retention procedures are rehearsed. |
| **6. Approved notices/events** | Audience-specific notices, dated events, event state and optional RSVP only if needed. | Member-only content never appears in public HTML/API responses; cancellation and expiry behavior work; school approves communication policy. |
| **7. Shared publishing** | Versioned content drafts, review, approval, rollback, audit, and public build/cache integration. | A published change appears consistently across browsers; a rejected draft does not; rollback is tested; Puck's Publish label reflects actual behavior. |

### Phase 1 implementation tasks in this repository

1. Add an `AuthIdentity` and capability policy in `src/server/auth.ts` (or a nearby server policy module). Validate the hosted-domain claim before granting `school_member`; then evaluate the existing editor allowlist separately.
2. Change callback/session/logout tests in `tests/auth.test.ts` to cover all three personas and denial cases. Confirm the existing editor cookie and return path still work.
3. Extend `src/context/AuthContext.tsx` to carry `authenticated`, `role`, and capabilities, with a loading state that does not flash privileged controls.
4. Adjust `src/components/Navbar.tsx` and `src/components/ProtectedEditorRoute.tsx` so members see account navigation and a clear editor-access denial. Keep every Puck control behind `canEdit`.
5. Add a simple `/my` route and first-use empty state. It should state which features are available now rather than tease unbuilt actions.
6. Verify local Google OAuth using `http://localhost:3000/api/auth/callback`, then test staging with separate credentials and a member test account. Do not enable `OIDC_EDIT_POLICY=authenticated`.

### Quality and launch checklist

- **Functional:** Each persona completes its main task; save/unsave is reversible; unknown meeting data is explicit; empty and error states tell the user what to do.
- **Security:** Server-side policy is exercised on every API, including direct URLs and altered IDs; own-data isolation and revocation tests pass; sensitive responses do not enter public caches.
- **Privacy:** Data inventory, retention/deletion path, student contact visibility, approved provider/storage, and school review are documented before collecting requests.
- **Accessibility:** Keyboard and screen-reader flows work; focus moves correctly after dialogs and sign-in; small-screen list view works; status is not color-only.
- **Content:** Every promoted club has an owner, approval state, and verified date; sample data stays out of public indexing until approved.
- **Operations:** Separate environments and secrets, backup/restore rehearsal for shared data, audit trail for privileged actions, deployment rollback, and a named contact for errors.

## 9. Outcome measures and research to run with PCSS

Measure whether members can act confidently, not how long they stay on the site. Establish a baseline during a school-approved pilot; the targets below are hypotheses to refine with actual PCSS students and staff.

| Measure | Definition | Pilot target / decision use |
| --- | --- | --- |
| Club discovery completion | In a moderated task, user finds a club matching a stated interest and availability and can explain why. | Aim for at least 8 of 10 participants; investigate every failed task. |
| Next-step clarity | User can correctly say whether Save, Ask to join, or RSVP makes them a member. | Zero observed confusion in a final launch check; rewrite labels if confused. |
| Schedule trust | Share of visible meeting entries with an owner and verified date; stale entries flagged. | 100% of entries labeled confirmed have an approval record. |
| Favorite utility | Share of pilot members who return to a saved club or schedule in a later session. | Directional signal only; do not optimize for repeated clicks. |
| Request handling | Median and upper-tail time from submission to human response, only after workflow launch. | Set a school-owned service expectation before feature release. |
| Accessibility completion | Keyboard/screen-reader user can discover, save, and view a schedule without assistance. | All core tasks pass; defects block launch. |
| Privacy and authorization | Unauthorized reads/writes, accidental public exposure, and unresolved deletion requests. | Zero known exposure; any incident triggers review and correction. |

Run brief task sessions with students from both campuses and with a staff reviewer. Include newcomers, students with different availability, and users of assistive technology. Ask them to find a club and explain the joining process without coaching. Do not collect identifiable analytics or record sessions without school approval.

## 10. Decisions to resolve before coding beyond Phase 1

1. Is `pcss2robotics@pioneercss.org` a primary Workspace login, and which stable `sub` should identify the editor after verification?
2. Which PCSS accounts may access the member experience: all Workspace users, only current students, or an approved subgroup? The domain alone cannot answer enrollment status.
3. Who owns verification and updates for each club's schedule, eligibility, and contact route? How quickly should stale information expire or be marked unconfirmed?
4. Which database/provider and contractual terms does the school approve for student account data? What are backup, retention, deletion, and incident processes?
5. Who receives interest requests and suggestions, and what response expectation can they actually meet?
6. Does the school want formal membership, event RSVPs, or member-only notices in this app, or should it link to an existing school system for those tasks?
7. Which content may be public, school-only, club-only, or reviewer-only? Who approves each boundary?

## 11. Source and inference notes

The benchmark rows cite the observed source directly. The recommended feature order, interface structure, database shape, targets, and rejected patterns are **Pioneer Clubs design inferences**, not statements made by the referenced platforms. Technical and student-data constraints draw on [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect), [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), the [U.S. Department of Education student privacy guidance](https://studentprivacy.ed.gov/faq/i-want-use-online-tool-or-application-part-my-course-however-i-am-worried-it-violation-ferpa), and the [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions). Source pages may change; recheck them and school policy when implementation begins.
