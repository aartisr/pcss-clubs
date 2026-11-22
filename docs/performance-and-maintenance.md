# Performance and maintenance

## Runtime boundaries

Puck JSON and `puck.config.tsx` remain the single page model. Public routes render the registered block functions through `PublicPageRenderer.tsx`; the Puck editor loads only on editor routes. The directory management drawer and command search load when opened. The directory uses CSS transitions rather than a full animation dependency for card entry.

Keep public blocks flat unless the public renderer is extended. The tests render every built-in page and every registered block through both public and Puck renderers and compare visible text. Keep that parity check when changing the block palette.

## Bundle budget

Vite emits `dist/.vite/manifest.json`. The postbuild test walks the static import graph for the home page, excludes dynamic imports, and enforces a **410 kB minified JavaScript ceiling**. It also verifies that editor, search, and management chunks are dynamic entries outside the initial page graph. This is a regression budget, not a claim about Core Web Vitals or network transfer time.

After the runtime split, the shared Puck/site configuration chunk fell from about **510 kB** to **72 kB** minified. The current home page's static JavaScript graph is about **365 kB** minified, before compression. If the budget fails, inspect the Vite manifest and remove an accidental static import before raising the ceiling. Measure browser performance on a deployed Preview before making a user-facing speed claim.

The four built-in photos now use WebP at their original dimensions. Together they are about **640 kB**, down from about **3.7 MB** of JPEGs. The postbuild test checks that each referenced image exists, remains WebP, stays below 250 kB, and that the set stays below 700 kB. Hero images load eagerly at high fetch priority; directory card images load lazily.

## Code boundaries

- `registryModel.ts` owns domain rules. React components collect input and display errors.
- `registrySnapshot.ts` validates versioned imports and rebuilds derived hostnames. The provider applies an accepted snapshot.
- `RegistryFields.tsx` is the shared add/edit field schema; the test suite checks that it covers every draft property.
- `pageModel.ts` owns page identity and Puck layout validation. `pageLayoutStore.ts` owns browser persistence.
- `PublicPageRenderer.tsx` is the public rendering adapter. `EditorPage.tsx` owns the full editor interaction.
- `SiteShell.tsx` owns routed page chrome; Puck blocks remain embeddable without a second navigation or footer.
- `DirectoryFilters.tsx` and `ClubDirectoryCard.tsx` own directory controls and card presentation; page state and filtering stay in `PortalDirectoryPage.tsx`.
- `authOutcome.ts` supplies provider callback wording to both sign-in recovery surfaces; `SaveClubButton.tsx` supplies the common saved-state control.

## Release gate

`.github/workflows/ci.yml` runs `npm ci --include=dev` and `npm run build` for pull requests and pushes to `main` and `staging`. The build runs type checks, registry and Puck tests, public bundle checks, and generated-page checks. The workflow uses the public npm registry and needs no corporate registry secrets. Local npm can continue using the developer's corporate registry configuration.

Run `npm run build` before opening a pull request. CI must pass on the proposed commit. The current browser-local editor and registry still need a shared authenticated backend before edits can publish to every visitor.
