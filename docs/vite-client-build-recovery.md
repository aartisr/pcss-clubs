# `vite/client` error in Vercel functions

## Root cause

The site has four TypeScript endpoints under `api/auth`. Vercel [uses the root `tsconfig.json` to compile TypeScript functions](https://vercel.com/docs/functions/runtimes/node-js). That root config required `vite/client`, a browser build type library. Vercel reported the same TS2688 error four times, matching its four function compilations. The separate local `tsconfig.functions.json` overrode `types` with `node`, so our previous emitted-function tests passed without exercising Vercel's root-config path.

Our earlier install-only diagnosis was incomplete: Vite is already a direct dependency in the lockfile, and a clean local build could not reproduce the error. Installing development dependencies is still good build hygiene, but it cannot fix a browser-only type requirement in a server function's shared compiler config.

## Fix

- Remove `vite/client` from the root `compilerOptions.types`. The app uses one Vite-injected field, `VITE_SITE_REVIEW_STATUS`, and side-effect CSS imports, so `src/vite-env.d.ts` declares those locally. The browser remains type-checked without making every API compilation resolve Vite client types. [Vite documents custom `ImportMetaEnv` declarations](https://vite.dev/guide/env-and-mode).
- Keep `npm ci --include=dev` in Vercel and CI, plus the build-dependency preflight. These protect the separate Vite build and TypeScript test commands from incomplete installs.
- Test that the root config does not reintroduce `vite/client`, in addition to compiling, loading, and exercising all four emitted auth functions.

## Recovery on Vercel

1. Push the fixed commit using a GitHub account with write access to `aartisr/pcss-clubs`; the current `rraviku2_uhg` credential receives HTTP 403.
2. Redeploy that commit. Confirm no TS2688 errors appear during the four `/api/auth` function builds.
3. Confirm `/api/auth/session` returns JSON before testing Google sign-in. If it says `configured: false`, use the [production sign-in recovery guide](./production-sign-in-recovery.md) to check the Production OIDC settings.

The fix is not live until a deployment builds the new commit. The production error excerpt alone cannot reveal Vercel's full dependency-install state, but the repeated function errors and Vercel's documented root-config behavior identify the shared `vite/client` requirement as the build blocker.
