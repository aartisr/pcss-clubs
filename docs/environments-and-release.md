# Test, staging, and production release strategy

This is the operating plan for **Pioneer Clubs** at `pcssclubs.org`. It is a plan for configuring GitHub and Vercel; the repository does not yet have three deployed environments. The recommended design uses **one repository, one Vercel project, and three release stages**. It keeps the live domain on `main`, gives each change an isolated test URL, and gives school reviewers a persistent staging URL.

## 1. The architecture at a glance

| Stage | Source | URL | Purpose | Access | Search indexing |
| --- | --- | --- | --- | --- | --- |
| Local | Developer checkout | `http://localhost:3000` | Fast development and debugging | Developer | Never |
| Test | Each feature branch / pull request | Unique Vercel Preview URL | Verify one proposed change | Project team; share deliberately | Never |
| Staging | Persistent `staging` branch | `https://staging.pcssclubs.org` | School review and full release rehearsal | School reviewers | Never |
| Production | Protected `main` branch | `https://pcssclubs.org` | Public website | Everyone | Only verified content |

**The test version is a fresh Preview deployment for each pull request.** Vercel also provides a branch URL that moves to the newest build on that branch. Use the deployment URL tied to a particular commit when recording test evidence. A permanent `test.pcssclubs.org` domain is optional; add it only if testers need one shared test URL, because a moving URL makes it easier to review the wrong commit.

**Staging is a long-lived Preview branch.** On any Vercel plan, assign `staging.pcssclubs.org` to the `staging` Git branch and use branch-specific Preview variables. If the Vercel team has Pro or Enterprise, a Vercel Custom Environment named `staging` provides a cleaner, dedicated variable and branch-tracking boundary. The Git workflow stays the same. Do not create a separate Vercel project just to get a staging URL unless separate billing, permissions, or infrastructure are actually required. [Vercel environments](https://vercel.com/docs/deployments/environments), [Git deployments](https://vercel.com/docs/git), [branch domains](https://vercel.com/docs/domains/working-with-domains/assign-domain-to-a-git-branch).

```text
feature branch → PR test deployment → staging branch + staging domain
                                        ↓ school acceptance
                                  main → pcssclubs.org
```

## 2. Repo facts that shape the design

- Vite builds static files into `dist`; `vercel.json` routes campus and club URLs to generated HTML. Vercel uses `npm ci --include=dev`, `npm run build`, and `dist`.
- `src/data/registry.ts` contains the checked-in directory. `scripts/generate-search-pages.ts` generates public HTML and a sitemap **from those checked-in records**.
- The directory and club editor currently save changes in each visitor's `localStorage` (`src/context/RegistryContext.tsx`). An edit made in a browser on staging does **not** travel to production. Export it, review it, and commit the approved content to the repository, or build a shared backend before promising synchronized editing.
- `src/data/publication.ts` currently sets `PUBLIC_CONTENT_VERIFIED = false`. Keep it false while the club records are examples. In the present build, only credits appears in the sitemap; the directory and club pages have `noindex`.
- Canonical URLs are currently hardcoded to `https://pcssclubs.org` in the generated HTML and client metadata. That is a useful production canonical, but it is **not** a complete environment-aware search policy. Complete section 4 before exposing a staging domain.
- `.npmrc` has only `replace-registry-host=npmjs`, so local developers can use their corporate npm registry while Vercel uses the public registry. Do not commit a corporate registry URL or token.

## 3. Set up the environments

### Step 1 — Establish the Git branches

1. Keep `main` as the Vercel Production Branch. Confirm this in **Vercel → Project → Settings → Environments → Production → Branch Tracking**.
2. Create `staging` from the current `main` after the current changes are committed:

   ```bash
   git switch main
   git pull --ff-only origin main
   git switch -c staging
   git push -u origin staging
   ```

3. Create short-lived branches from `main` for work: `feature/<topic>` or `fix/<topic>`. Open a pull request. Vercel creates its Preview deployment. Delete the branch after the change is released.
4. Protect `main`: require a pull request, passing checks, and at least one reviewer who is not the author. Restrict direct pushes and force pushes. Protect `staging` from force pushes too. A small student team can use one reviewer; add a school reviewer for public content and policy changes.
5. Keep `staging` close to `main`. After a production release, bring `staging` back in sync before accepting the next release. Resolve conflicts in a PR; never force-reset a branch with ongoing work.

### Step 2 — Connect GitHub and Vercel

1. Import `aartisr/pcss-clubs` into one Vercel project and connect the Git integration.
2. Verify **Framework Preset = Vite**, **Node.js = 22**, **Install Command = `npm ci --include=dev`**, **Build Command = `npm run build`**, **Output Directory = `dist`**. `vercel.json` declares the install command so TypeScript, tsx, and Vite client types are present even if a deployment environment sets `NODE_ENV=production` or npm omit settings. Confirm the effective values shown by Vercel and redeploy without the old dependency cache after an incomplete install.
   The build now includes `npm run check:functions`, which compiles and loads every auth function with native Node ESM resolution.
3. Set `main` as the Production Branch. A push to `main` will then publish to the production environment; other branches create Preview deployments. [Vercel Git deployments](https://vercel.com/docs/git).
4. Add `pcssclubs.org` to the Production environment in **Project → Settings → Domains**. Configure the DNS records Vercel shows for the domain registrar. Decide whether `www.pcssclubs.org` should redirect to the apex, then configure one canonical host.
5. Add `staging.pcssclubs.org` in the same Domains screen. Assign it to the `staging` Git branch as a **Preview** domain, then configure its DNS record. Do not assign it to Production. [Vercel branch-domain instructions](https://vercel.com/docs/domains/working-with-domains/assign-domain-to-a-git-branch).
6. If using a Pro/Enterprise Custom Environment, create `staging`, track the `staging` branch, and attach the staging domain there instead. [Vercel custom environments](https://vercel.com/docs/deployments/environments).

### Step 3 — Configure access and variables

1. Turn on **Standard Protection with Vercel Authentication** under **Project → Settings → Deployment Protection**. This protects Preview/deployment URLs while leaving the production domain public. Test access as both a team member and a school reviewer. If reviewers do not have Vercel access, choose an available protection method and plan that supports them; password protection has plan/add-on constraints. [Vercel deployment protection](https://vercel.com/docs/deployment-protection).
2. Add a non-secret `VITE_PUBLIC_ENV` variable with these exact values:

   | Scope | Value |
   | --- | --- |
   | Development | `test` |
   | Preview default | `test` |
   | `staging` branch override or Custom Environment | `staging` |
   | Production | `production` |

3. For a persistent staging Preview branch, add the `staging` override in **Project → Settings → Environment Variables**, selecting Preview and the `staging` branch. Branch-specific Preview values override the default Preview value. [Vercel environment variables](https://vercel.com/docs/environment-variables).
4. The optional editor sign-in requires server-side OIDC credentials and a distinct session secret per environment. Follow the [authentication setup](authentication.md). If a shared publishing backend is later added, create **separate test/staging/production data stores and credentials**. Give each environment only its own credentials. Keep secrets in Vercel, never in `VITE_` variables: Vite embeds those in browser JavaScript. [Vite environment variables](https://vite.dev/guide/env-and-mode.html).
5. Keep local `.env.local` untracked. A developer may use the corporate npm registry through their user-level npm configuration; Vercel must install from the public registry and must have no corporate token.

## 4. Implement the environment-aware publishing gate

This is a **required code task before the three live stages are considered complete**. The current repo has a content-verification flag but not an environment check. Use one shared, fail-closed rule for HTML generation and React navigation:

```text
mayIndex = (VITE_PUBLIC_ENV === "production") AND PUBLIC_CONTENT_VERIFIED
```

An absent, misspelled, or unknown environment value must behave like `test`. The flag is a publication approval, not a substitute for the environment check. A local or staging build must remain `noindex` even if approved content is being reviewed there.

Implementation checklist:

1. Centralize environment parsing, the site origin, and `mayIndex` in a small shared module. `scripts/generate-search-pages.ts` reads `process.env.VITE_PUBLIC_ENV`; browser code reads `import.meta.env.VITE_PUBLIC_ENV`. Since these are different build contexts, add a build assertion that they agree. The only valid values are `test`, `staging`, and `production`.
2. Replace direct uses of `PUBLIC_CONTENT_VERIFIED` as an indexing decision in the generator and `usePageMetadata` callers with `mayIndex`. Keep the existing approval flag until all sample records are replaced and reviewed.
3. On **every** test and staging HTML route, including `/credits`, emit `<meta name="robots" content="noindex, nofollow">`. For production, retain the current content approval rule. Keep the editor `noindex` everywhere.
4. Generate a production sitemap only from indexable production URLs. Generate an empty sitemap or omit the sitemap for test/staging, and ensure their `robots.txt` does not advertise the production sitemap. Do **not** use `Disallow: /` as the sole indexing control: crawlers need to fetch the page to see its `noindex` directive. [Google robots meta guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
5. Keep production canonicals on `https://pcssclubs.org`. For non-production pages, set their canonical to the equivalent production URL only where that verified production page already exists; otherwise omit the canonical. Never submit staging URLs to search engines. Canonical is a hint; `noindex` and access protection are the non-production controls. [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
6. Do not make indexing depend on `import.meta.env.PROD`: Vite sets that for optimized Preview builds too. Do not depend on `NODE_ENV` for the same reason. [Vite modes](https://vite.dev/guide/env-and-mode.html).
7. Vercel normally adds `X-Robots-Tag: noindex` to Preview responses, but verify the actual header on the staging domain. Keep the HTML policy as defense in depth, especially if domain or protection settings change. [Vercel response headers](https://vercel.com/docs/headers/response-headers).
8. Add a build check that fails if a test/staging page lacks `noindex`, if a non-production sitemap lists a public page, if a production canonical has a non-production host, or if production lists unapproved sample clubs. Test direct campus and club HTML without JavaScript.

**Go-live rule:** keep `PUBLIC_CONTENT_VERIFIED = false` until names, meeting details, advisors, images, and attribution are approved for public release. Once approved, switch it to `true` in a reviewed PR and rehearse it on staging. Production indexing is then enabled only by the production build. Google and other engines decide whether and when pages appear in results.

## 5. CI and acceptance gates

The checked-in `.github/workflows/ci.yml` runs on every pull request and on pushes to `staging` and `main`, using Node 22 and `npm ci --include=dev`. Set its **Verify / build** result as a required branch check. The release checks are:

1. **Static checks:** `npm run lint` runs through the `prebuild` script.
2. **Production build:** `npm run build` fails on type errors, Puck and registry regressions, an oversized public bundle, missing generated pages, or generator errors.
3. **Publishing checks:** build in test/staging mode and assert every HTML page is `noindex`, staging sitemap is empty, and the editor stays excluded. Build in production mode with approval false and assert only credits is listed. Build with approved fixture data and approval true to verify all expected routes and canonicals. Keep these as meaningful generated-output tests, rather than duplicating the implementation.
4. **Dependency review:** run `npm audit --omit=dev` for shipped runtime dependencies. Review actionable high/critical findings before merging; keep the lockfile committed. Add a dependency update process rather than using `--force` to hide resolution problems.
5. **Preview smoke test:** open the exact Vercel deployment URL from the PR. Check `/`, `/credits`, a campus route, a club route, `/robots.txt`, and `/sitemap.xml`; test both desktop and mobile navigation. Vercel Authentication may require a reviewer session or an approved automation bypass; do not disable protection globally for CI convenience.

Set these checks as required status checks on `main`. If production approval depends on a human review, record who approved the data and the staging deployment URL in the release PR. The same Git commit should be reviewed on staging and sent to production; the production build may differ because its environment variables and domain differ.

## 6. Release runbook

### A. Develop and test

1. Start from updated `main`: `git switch main`, `git pull --ff-only origin main`, then `git switch -c feature/<topic>`.
2. Run `npm ci`, `npm run lint`, and `npm run build` locally. Use `npm run dev` for interactive checks.
3. Open a PR to `staging` for a planned release. Vercel creates the test Preview; record the exact commit URL, screenshots for visual changes, and any known limitations in the PR.
4. Review the test deployment. Confirm that browser-local edits have not been mistaken for deployed content. Check the generated HTML and metadata as well as the interactive app.

### B. Rehearse on staging

1. Merge the approved PR into `staging`. Wait for the Vercel deployment tied to that commit to succeed, then visit `https://staging.pcssclubs.org`.
2. Run the staging smoke checklist: home, credits, campus, club, navigation, editor, theme, import/export, mobile layout, assets, direct URL refresh, and browser console. Confirm access protection and `noindex` on every route.
3. For a public content release, compare every club fact with its approved source. Confirm consent/permission for student names and media. Inspect the built sitemap and the text visible without JavaScript. Have the school reviewer sign off on the staging deployment.
4. Freeze the release commit while it is being approved. If fixes are needed, merge them into `staging`, obtain a fresh staging deployment, and repeat checks.

### C. Publish to production

1. Open a PR from `staging` to `main`. The PR should identify the staging deployment, release commit, test results, and approver. Require CI and review. Prefer a fast-forward update so `main` points to the exact reviewed source commit; if branch policy creates a new merge commit, verify the resulting commit and repeat the relevant checks.
2. Merge the PR. Confirm Vercel built **Production** from `main` and attached `pcssclubs.org`; do not promote a staging Preview artifact into production, because its environment-specific indexing settings are baked into the build.
3. Visit the live home, credits, campus, and club routes directly. Check response status, canonical host, indexing directives, stylesheet/images, `robots.txt`, and `sitemap.xml`. If club data is still example content, verify the production approval gate remains closed.
4. Once verified content is public and the gate is open, submit `https://pcssclubs.org/sitemap.xml` to Google Search Console and Bing Webmaster Tools. Watch for crawl errors, duplicate canonicals, and pages excluded from indexing. [Google sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a).
5. Record the release date, source commit, production deployment URL, reviewer, and any follow-up in the PR or release notes.

### D. Copyable public smoke checks

Run these against the production domain after release; run the same paths in an authenticated browser against staging. A `200` response alone is insufficient: read the HTML and verify the canonical and robots directives.

```bash
curl -fsSI https://pcssclubs.org/
curl -fsS https://pcssclubs.org/ | grep -E 'canonical|name="robots"|<h1'
curl -fsS https://pcssclubs.org/credits | grep -E 'canonical|<h1'
curl -fsS https://pcssclubs.org/robots.txt
curl -fsS https://pcssclubs.org/sitemap.xml
```

For a verified campus or club, replace the path with its real slug and confirm its route-specific `<h1>`, canonical, and structured data are present in the **response source**, before JavaScript runs. The production sitemap should contain only approved public URLs; until the sample data is replaced, it should contain only `/credits`. On staging, inspect the response source for `noindex` on all pages. If Vercel Authentication is enabled, an anonymous `curl` request to staging should be denied; use an authenticated browser or an approved automation bypass for protected smoke tests.

## 7. Rollback and recovery

1. If a live release is broken, use **Vercel → Deployments → Instant Rollback** to return the production domain to the previous good production deployment. Vercel CLI alternative: `vercel rollback`, then `vercel rollback status`. Verify the public routes immediately. Rollback availability differs by plan: Hobby can roll back to the immediately previous production deployment; Pro/Enterprise have more eligible deployments. [Vercel rollback](https://vercel.com/docs/instant-rollback).
2. Do not roll back to a Preview deployment or assume rollback restores external data. A rollback moves the domain to an earlier build; any future backend/database state needs a separate recovery plan.
3. Fix the cause on a new feature branch, retest, send it through staging, and release again. After a rollback, Vercel may pause automatic production-domain assignment until a deployment is promoted; check the dashboard before the next release. [Vercel rollback behavior](https://vercel.com/docs/instant-rollback).

## 8. Completion checklist

- [ ] `main` is Production Branch and is protected.
- [ ] `staging` branch exists and is protected from force pushes.
- [ ] GitHub integration creates a test Preview for each PR.
- [ ] `staging.pcssclubs.org` points only to the staging branch/environment.
- [ ] `pcssclubs.org` points only to Production.
- [ ] Preview/staging access policy is tested with the intended reviewers.
- [ ] `VITE_PUBLIC_ENV` is set for each stage; unknown values fail closed.
- [ ] Environment-aware indexing gate and output checks from section 4 are implemented.
- [ ] CI checks run and are required on `main`.
- [ ] Sample club content remains unindexed until approved.
- [ ] Staging and production smoke checks and rollback are rehearsed.

## Primary references

- [Vercel environments](https://vercel.com/docs/deployments/environments) and [Git deployment flow](https://vercel.com/docs/git)
- [Vercel branch domains](https://vercel.com/docs/domains/working-with-domains/assign-domain-to-a-git-branch), [environment variables](https://vercel.com/docs/environment-variables), and [deployment protection](https://vercel.com/docs/deployment-protection)
- [Vercel response headers](https://vercel.com/docs/headers/response-headers) and [rollback](https://vercel.com/docs/instant-rollback)
- [Vite environment variables and modes](https://vite.dev/guide/env-and-mode.html)
- [Google indexing controls](https://developers.google.com/search/docs/crawling-indexing/block-indexing) and [canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
