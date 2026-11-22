# Puck page architecture

Puck is the content and layout model for every public page in Pioneer Clubs. The directory, campus hubs, credits, and club pages each have an editor route. Site navigation exposes **Edit This Page** for the current page only after an authorized editor signs in. The editor saves drafts in the current browser and can export or import Puck JSON.

## Page contract

| Public page | Puck page reference | Editor route | Required content |
| --- | --- | --- | --- |
| `/` | `home` | `/editor/home` | `DirectoryExperience` |
| `/campus/:campusSlug` | `campus:<slug>` | `/editor/campus/:campusSlug` | `DirectoryExperience` |
| `/credits` | `credits` | `/editor/credits` | `CreditsExperience` |
| `/sites/:campusSlug/:clubSlug` | `club:<campus>:<club>` | `/editor/:campusSlug/:clubSlug` | Club Puck blocks |

`src/puck/pageModel.ts` owns page identities, paths, default layouts, required blocks, and validation. `src/puck/puck.config.tsx` owns the editable block palette and fields. `src/pages/PuckDocumentPage.tsx` renders home, campus, and credits layouts. `src/pages/ClubSitePage.tsx` renders club layouts. Public pages use `PublicPageRenderer`, which calls the same registered Puck block render functions without loading Puck's editor runtime. `src/pages/EditorPage.tsx` uses Puck's editor for all page kinds and the same page model and storage rules.

The public renderer supports the current flat block model. If a future block uses Puck zones or other editor-specific runtime props, extend the public renderer and its parity tests before publishing that block. The build compares public output with Puck's `Render` for every registered block.

The directory block contains live search, filters, campus switching, and club cards. Its eyebrow, heading, and introduction are Puck fields. The credits block includes editable introductory copy, contribution areas, people nested inside each area, the recognition note, and the correction link. The first area is featured; reordering areas changes which one is featured. Club blocks include hero, notices, schedule, leadership, achievements, gallery, and resources. Generic text sections can be added to pages.

## Editing a page

1. Open the page and select **Edit This Page**. For a club, use **Edit Club Page**.
2. Select a Puck block and edit its fields. Add or reorder blocks as needed. The directory and credits core blocks must remain: validation rejects a save without the required block.
   On `/editor/credits`, select **Credits & Contributors**, open **Contribution Areas**, and choose an area. Edit its heading and description, then add or reorder entries under **People in This Area**. New areas can be added without matching group names by hand.
3. Changes save to browser `localStorage` as you edit. **View Page** shows the saved result in the same browser. The Puck **Publish** action also saves locally; it does not deploy a public site.
4. Use **Export JSON** for a portable copy. **Import JSON** restores a valid layout for the page in this browser. **Reset Default** removes that page's stored layout and restores its checked-in defaults.
5. To make a change public to all visitors, an approved layout must be committed to the repository's defaults or a shared authenticated content backend must be added. Exported files alone do not change Vercel's static build. See [Environment and release strategy](environments-and-release.md) for review and deployment.

## Persistence and compatibility

`src/puck/pageLayoutStore.ts` is the common load, validate, save, and reset boundary. It stores home, campus, and credits layouts under `pcss_page_layout_v1_*`. Older credits layouts with flat contributors are migrated into nested areas on load or import; names and custom group headings are retained. Club layouts retain their existing `pcss_puck_layout_v1_*` keys so previous browser edits keep working. Invalid or unreadable JSON falls back to checked-in defaults. A save failure is reported in the editor, and the user can export JSON as a backup.

The registry's club and campus records remain separate from Puck layout data. Adding or changing a club in the browser changes that browser's local registry. The public search HTML and sitemap are generated from checked-in data. `scripts/generate-search-pages.ts` now reads the home, campus, and credits Puck defaults for page copy. Do not treat browser-local edits as approved public content.

## Enforced checks

`npm run build` runs type checking and the Puck tests before building, then runs generated-page tests afterward. The tests cover:

- An editor route and valid Puck layout for every checked-in public page, including newly added schools and clubs.
- Registration of every allowed block in the Puck palette.
- Rendering edited content through Puck for every page type.
- Public-renderer parity with Puck for every page and every registered block.
- Credits area and contributor editing, public-preview parity, author attribution links, and migration of older saved credits.
- One site navigation/footer shell around directory and credits pages.
- Independent save, reload, reset, malformed JSON fallback, and legacy club keys.
- Generated HTML, canonical URLs, structured data, sitemap, and the sample-content indexing gate.

Run the checks directly with `npm run lint`, `npm test`, and `npm run build`. A browser-level drag-and-drop smoke test should also be run in a Vercel Preview before release, because the test runner verifies rendering and storage logic but does not simulate Puck's pointer interactions.

## Adding a new page type

1. Add a `PageReference` variant and its path, editor path, label, existence rule, and default Puck data in `pageModel.ts`.
2. Register any new blocks and editable fields in `puck.config.tsx`; add them to `PAGE_BLOCK_TYPES`.
3. Route the public page through `PublicPageRenderer` and the editor path through `EditorPage`. Keep page-specific data in the registry or another reviewed source.
4. Add static HTML generation and metadata for public crawlability. Keep the sample-content publication gate intact.
5. Extend the Puck page tests and generated-output tests. The build must fail if the new route lacks a valid layout or generated page.
