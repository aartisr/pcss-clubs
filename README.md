# Pioneer Clubs

### A place to find your people.

A club can be the start of a new skill, a friendship, or a sense of belonging. **Pioneer Clubs** is a student organization portal built for Pioneer Charter School of Science: one place to discover clubs, explore campus communities, and give each organization a page of its own.

This repository is a working prototype, built to grow with verified school and club information.

## What works today

- **Discover clubs:** Browse by campus, search by name or details, and filter by category or meeting day. Quick search and light/dark themes are included.
- **Explore pages:** Open a campus hub or a club page with its available description, schedule, contacts, and related clubs.
- **Shape every page:** Use Puck to edit the home, campus, credits, and club layouts. Optional blocks include announcements, leadership, achievements, photos, and resources.
- **Grow the directory:** Add, edit, move, clone, or delete schools and clubs; import or export a registry snapshot as JSON.
- **Prepare for publication:** The build generates route-specific HTML, structured data, `robots.txt`, and a sitemap for the checked-in records.
- **Get help:** The [Support Center](src/pages/SupportPage.tsx) answers common questions and lets signed-in school members prepare a club website request to `pcss2robotics@pioneercss.org`. The member sends the prefilled draft from their email app; opening it is not a submission. See the [support design research](docs/support-center-research.md).

## What is still a prototype

The checked-in directory contains **two example campuses and eight example clubs**. Their details must be replaced and approved before public indexing. The [publication flag](src/data/publication.ts) is currently off: directory, campus, and club pages receive `noindex`, and only the credits page appears in the sitemap.

The public pages also show a small review notice with **To Be Approved** and **In Development** labels. Set `VITE_SITE_REVIEW_STATUS` to `both` (default), `approval`, `development`, or `off` for a deployment, then rebuild and redeploy. The same setting controls the client UI and generated HTML. The notice is an editorial status; it does not change the separate publication/indexing flag. Turn off each stage only when its real-world review or development work is complete.

Registry and Puck edits save to **the current browser**, not to a shared database or a deployed site. Editing requires an authorized OIDC sign-in when [authentication](docs/authentication.md) is configured; otherwise the editor stays closed. Publishing changes for everyone requires a reviewed code deployment or a future authenticated backend. `pcssclubs.org` is the configured production URL; this README does not imply the site is already live there.

## Run and verify

Use Node.js 22. Local npm may use your corporate registry through your user-level configuration; the repository contains no private registry URL or credentials.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Run `npm run build` for type checks, Puck and registry tests, generated-page checks, and bundle budgets.

## Deploy and extend

The project is configured for a Vercel Vite deployment from `dist`. See the [implementation status](docs/implementation-status.md), [release strategy](docs/environments-and-release.md), [Puck architecture](docs/puck-architecture.md), [registry architecture](docs/registry-architecture.md), [support design research](docs/support-center-research.md), [school-member experience research and plan](docs/member-experience-research-and-plan.md), [signed-in account display research](docs/account-identity-ux.md), and [performance and maintenance guide](docs/performance-and-maintenance.md).

Begun by [Aarti S Ravikumar](https://ai-aarti.com) of [PCSS II](https://saugus.pioneercss.org) in service of the PCSS club community. The [credits page](credits/index.html) recognizes everyone whose confirmed work helps it grow.
