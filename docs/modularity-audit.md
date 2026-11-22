# Modularity and reuse audit

## Current boundaries

| Concern | Owner | Extension point |
| --- | --- | --- |
| Page chrome and review status | `SiteShell` | Use it around a new public or member page. Puck blocks embedded in another page use their host shell. |
| Routes and scroll behavior | `App`, `RouteScrollManager`, `tenantRouting` | Add a route once; build school and club links with the route helpers. |
| Sign-in state and outcomes | `AuthContext`, `authOutcome`, `authReturn` | Keep provider callback wording in `authOutcome`; keep URL validation in `authReturn`. |
| School and club data | `registry`, `registryModel`, `RegistryContext` | Add reviewed records; use the shared field schema and validation rules for new fields. |
| Directory presentation | `PortalDirectoryPage`, `DirectoryFilters`, `ClubDirectoryCard` | Add filter behavior at the page state boundary and controls in `DirectoryFilters`; keep card presentation in its component. |
| Saved club action | `SaveClubButton`, `SavedClubsContext` | Reuse the control wherever a club can be saved; permission and persistence stay in the calling page/provider. |
| Public page composition | `pageModel`, `puck.config`, `PublicPageRenderer` | Register an editable block once and keep public/Puck renderer parity tests. |
| Editor persistence | `pageLayoutStore` | Replace the storage adapter when an approved shared content backend exists. |
| Static output and indexing | `generate-search-pages`, `publication` | Keep unverified sample content out of indexed output. |

## Changes in this pass

- Consolidated the navigation, site review notice, and footer into one shell for routed public and member pages.
- Consolidated provider outcome wording used by the global sign-in notice and the My space entry card.
- Extracted directory filters and club cards from the large directory page.
- Reused one accessible save action on directory cards and club pages.

## Design rule

Extract shared behavior where it has a stable contract and at least two callers, or split a page when a section has its own clear inputs and responsibility. Keep page-specific content and interaction in the page. Avoid a generic form, card, or layout framework that would hide each feature's meaning.

## Remaining seams

The directory management drawer and Puck configuration are large because they hold several distinct editing flows and field definitions. Their validation and storage rules are already separated from UI. Split a flow further when adding a new workflow requires changing unrelated branches. Club and editor changes currently persist in each browser; publishing edits to all visitors requires a reviewed shared backend and release workflow. These are architectural limits, not component-reuse issues.
