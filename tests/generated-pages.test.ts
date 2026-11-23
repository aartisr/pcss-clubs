import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { INITIAL_CAMPUSES, INITIAL_CLUBS } from '../src/data/registry';
import { PUBLIC_CONTENT_VERIFIED } from '../src/data/publication';
import { parseSiteReviewMode, siteReviewCopy } from '../src/data/siteReview';
import { createDefaultPageData } from '../src/puck/pageModel';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const reviewCopy = siteReviewCopy(parseSiteReviewMode(loadEnv('production', path.resolve(dist, '..'), 'VITE_').VITE_SITE_REVIEW_STATUS));
const paths = [
  'index.html', 'credits/index.html', 'privacy/index.html', 'terms/index.html', 'support/index.html',
  ...INITIAL_CAMPUSES.map((campus) => `campus/${campus.slug}/index.html`),
  ...INITIAL_CLUBS.map((club) => `sites/${club.campusSlug}/${club.slug}/index.html`),
];

describe('generated public pages', () => {
  it('shows a styled loading shell before React replaces the static page preview', () => {
    for (const filename of paths) {
      const html = fs.readFileSync(path.join(dist, filename), 'utf8');
      const head = html.slice(0, html.indexOf('</head>'));
      assert.match(head, /\.js-loading #root \{ display: none; \}/, filename);
      assert.match(head, /document\.documentElement\.classList\.add\('js-loading'\)/, filename);
      assert.match(head, /document\.documentElement\.classList\.remove\('js-loading'\)/, filename);
      assert.match(head, /<link rel="stylesheet" crossorigin href="\/assets\/main-[^"]+\.css">/, filename);
      assert.ok(html.indexOf('id="app-loading"') < html.indexOf('id="root"'), filename);
      assert.match(html, /id="app-loading" role="status" aria-label="Opening Pioneer Clubs"/, filename);
    }
  });

  it('shows the configured review stage in every public HTML page before JavaScript runs', () => {
    for (const filename of paths) {
      const html = fs.readFileSync(path.join(dist, filename), 'utf8');
      if (!reviewCopy) {
        assert.doesNotMatch(html, /aria-label="Project status"/, filename);
      } else {
        assert.match(html, /aria-label="Project status"/, filename);
        for (const label of reviewCopy.labels) assert.ok(html.includes(label), `${filename}: ${label}`);
      }
    }
  });

  it('builds route-specific HTML and parseable structured data for every Puck page', () => {
    assert.equal(paths.length, 5 + INITIAL_CAMPUSES.length + INITIAL_CLUBS.length);
    for (const filename of paths) {
      const html = fs.readFileSync(path.join(dist, filename), 'utf8');
      assert.match(html, /<main>/, filename);
      assert.match(html, /<h1>/, filename);
      assert.match(html, /<link rel="canonical" href="https:\/\/pcssclubs\.org\//, filename);
      const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      assert.ok(jsonLd, filename);
      assert.ok(JSON.parse(jsonLd[1])['@type'], filename);
      if (['credits/index.html', 'privacy/index.html', 'terms/index.html'].includes(filename)) assert.doesNotMatch(html, /noindex, follow/);
      else assert.equal(html.includes('noindex, follow'), !PUBLIC_CONTENT_VERIFIED, filename);
    }
  });

  it('uses Puck defaults as the source for public page text', () => {
    const credits = fs.readFileSync(path.join(dist, 'credits/index.html'), 'utf8');
    const puckCredits = createDefaultPageData({ kind: 'credits' }).content[0].props;
    assert.ok(credits.includes(puckCredits.title));
    assert.ok(credits.includes('Aarti S Ravikumar'));
    if (PUBLIC_CONTENT_VERIFIED) {
      const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
      assert.ok(home.includes(createDefaultPageData({ kind: 'home' }).content[0].props.title));
    }
  });

  it('publishes the student-run policy pages with their key disclosures', () => {
    const privacy = fs.readFileSync(path.join(dist, 'privacy/index.html'), 'utf8');
    const terms = fs.readFileSync(path.join(dist, 'terms/index.html'), 'utf8');
    assert.match(privacy, /student-created club directory operated by the <a href="\/credits#student-web-admin">Student Web Admin<\/a>/);
    const credits = fs.readFileSync(path.join(dist, 'credits/index.html'), 'utf8');
    assert.match(credits, /<li id="student-web-admin"><h4><a href="https:\/\/ai-aarti\.com\/">Aarti S Ravikumar<\/a>/);
    assert.match(privacy, /encrypted, HttpOnly session cookie/);
    assert.match(privacy, /saved-club choices/);
    assert.match(terms, /PCSS is not responsible for independently authored club information/);
    assert.match(terms, /Nothing in these terms removes any duty or right/);
  });

  it('publishes useful support answers without presenting the request as already sent', () => {
    const support = fs.readFileSync(path.join(dist, 'support/index.html'), 'utf8');
    assert.match(support, /Support Center/);
    assert.match(support, /Does saving a club mean I joined it/);
    assert.match(support, /No email app is needed/);
    assert.equal(support.includes('noindex, follow'), !PUBLIC_CONTENT_VERIFIED);
  });

  it('keeps unapproved sample clubs out of the sitemap', () => {
    const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    assert.equal(urls.length, PUBLIC_CONTENT_VERIFIED ? paths.length : 3);
    assert.ok(urls.includes('https://pcssclubs.org/credits'));
    assert.ok(urls.includes('https://pcssclubs.org/privacy'));
    assert.ok(urls.includes('https://pcssclubs.org/terms'));
    const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
    assert.ok(robots.includes('Sitemap: https://pcssclubs.org/sitemap.xml'));
  });
});
