# Plug-and-play school and club registry

The directory reads schools and clubs from one registry. Adding a school or club updates navigation, search, filters, directory cards, public routes, and Puck page defaults without adding a new React page. The same add and manage drawer handles everyday record changes.

## Use the interface

1. Open the directory and choose **Manage Directory**. Use **Add School** to create a school, **Add Club** to create a club, **Manage** to edit or delete records, and **Associate / JSON** to move or clone a club or transfer a registry snapshot.
2. School and club slugs are normalized to lowercase URL segments. The app rejects duplicates, unknown host schools, and empty names. A club slug only needs to be unique **within its school**.
3. In **Manage**, select a school or club, change its fields, and choose **Save changes**. Renaming a school updates its club routes. Moving or renaming a club carries its saved Puck layout to the new route.
4. Choose **Delete** to remove a record from this browser. Deleting a school also removes its clubs and their local layouts. The interface asks for confirmation and will not delete the last school.
5. Export a registry JSON snapshot before large changes. Import validates the complete school/club relationship and rejects duplicate or orphaned records.

**Current persistence is browser-local.** A change in one browser does not update another browser or Vercel’s static files. To publish verified content for everyone, update the checked-in `INITIAL_CAMPUSES` and `INITIAL_CLUBS` in `src/data/registry.ts` and deploy, or add a shared authenticated backend. The current records are examples; keep the publication gate closed until replacements are approved. See [Environment and release strategy](environments-and-release.md).

## Modules and ownership

| Module | Responsibility |
| --- | --- |
| `src/data/registry.ts` | School/club types and checked-in starter records; generic Puck club template based on record facts |
| `src/data/registryModel.ts` | Slugs, hostnames, cover defaults, create/update validation, and whole-registry integrity checks |
| `src/data/registrySnapshot.ts` | Versioned JSON import/export and complete snapshot validation |
| `src/data/registryDrafts.ts` | Empty, fact-neutral inputs for new schools and clubs |
| `src/data/registrySelectors.ts` | Shared club search/filter and member totals for directory, navigation, and quick search |
| `src/context/RegistryContext.tsx` | Browser state and CRUD actions; carries or removes layouts when records move or disappear |
| `src/puck/pageLayoutStore.ts` | One Puck layout storage boundary for all page kinds |
| `src/middleware/tenantRouting.ts` | Canonical route builders and tenant resolution |
| `src/components/RegistryFields.tsx` | One field schema and renderer shared by add and edit screens |
| `src/components/AddEntityDrawer.tsx` | Add school, add club, move/clone, and registry JSON controls |
| `src/components/ManageRegistryPanel.tsx` | Edit/delete controls using the shared fields |
| `scripts/generate-search-pages.ts` | Public HTML and sitemap from checked-in, approved records |

## Design rules

- Keep record validation and URL normalization in `registryModel.ts`; UI components collect input and display errors.
- Keep add and edit fields in `RegistryFields.tsx`. `tests/registry-model.test.ts` checks that the shared schema covers every property in each new-record draft.
- Keep unknown facts empty. A new club's Puck default includes meeting and leadership sections only when those details exist.
- Derive navigation, search, and route choices from registry state. Do not add school-specific branches for a new record.
- Keep browser persistence behind `RegistryContext.tsx` and Puck layout persistence behind `pageLayoutStore.ts`; a future shared backend can replace those boundaries without changing the field schema or page components.

The UI derives campus and club choices from registry state. Footer club links are generated from the current records. Puck’s optional media, honors, notices, and resource blocks start with neutral content. New club pages show schedule and leadership blocks only when those facts are supplied.

## Extending the schema

1. Add the field to the `Campus` or `Club` type in `src/data/registry.ts`, and add an approved default to checked-in records.
2. Add the field to the shared schema in `RegistryFields.tsx` and the empty draft in `registryDrafts.ts`. Use a shared helper in `registryModel.ts` if the field needs normalization or validation; do not duplicate the rule in each form.
3. Update whole-registry validation and the snapshot format. Import rejects missing fields rather than inventing values. Keep the snapshot version stable only for compatible additions; bump it and write a migration for breaking changes.
4. If the field appears on club pages, update `createDefaultPuckData` and the matching Puck component. If it affects public indexing, update `generate-search-pages.ts` and its generated-output test.
5. Add lifecycle coverage in `tests/registry-model.test.ts`, then run `npm run build`.

For a **new school or club record**, no route or component code change is needed. The UI creates it locally from the forms. For a public release, add its reviewed data to the checked-in registry before enabling indexing.

## Integrity rules

- School slugs and IDs are unique; club slugs are unique per school; clubs must reference an existing school.
- Renames and moves update derived hostnames and transfer local Puck layouts. Club cloning copies the layout while keeping the source.
- Deletions remove local layouts. Import rejects invalid relationships instead of silently accepting a partial registry.
- The build runs registry and Puck tests before Vite, then checks generated public pages after Vite. `npm run build` is the release gate.
