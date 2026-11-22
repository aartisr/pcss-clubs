import React from 'react';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Render } from '@measured/puck';
import type { Data } from '@measured/puck';
import { INITIAL_CAMPUSES, INITIAL_CLUBS, createDefaultPuckData } from '../src/data/registry';
import { puckConfig } from '../src/puck/puck.config';
import { PageScope } from '../src/puck/PageScope';
import { PAGE_BLOCK_TYPES, createDefaultPageData, editorPath, isValidPageData, normalizePageData, pageExists, pageKey, pagePath, parseEditorPath, type PageReference } from '../src/puck/pageModel';
import { layoutStorageKey, loadPageLayout, resetPageLayout, savePageLayout } from '../src/puck/pageLayoutStore';
import { RegistryProvider } from '../src/context/RegistryContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { PuckDocumentPage } from '../src/pages/PuckDocumentPage';
import { ClubSitePage } from '../src/pages/ClubSitePage';
import { PublicPageRenderer } from '../src/puck/PublicPageRenderer';
import { PioneerImage } from '../src/components/PioneerImage';

const pages: PageReference[] = [
  { kind: 'home' },
  { kind: 'credits' },
  ...INITIAL_CAMPUSES.map((campus) => ({ kind: 'campus' as const, campusSlug: campus.slug })),
  ...INITIAL_CLUBS.map((club) => ({ kind: 'club' as const, campusSlug: club.campusSlug, clubSlug: club.slug })),
];

function defaultData(page: PageReference): Data {
  if (page.kind !== 'club') return createDefaultPageData(page);
  const club = INITIAL_CLUBS.find((candidate) => candidate.slug === page.clubSlug && candidate.campusSlug === page.campusSlug)!;
  const campus = INITIAL_CAMPUSES.find((candidate) => candidate.slug === page.campusSlug)!;
  return createDefaultPuckData(club, campus);
}

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear() { map.clear(); },
    getItem(key) { return map.get(key) ?? null; },
    key(index) { return [...map.keys()][index] ?? null; },
    removeItem(key) { map.delete(key); },
    setItem(key, value) { map.set(key, value); },
  };
}

describe('Puck is the page model for every public route', () => {
  it('renders a legacy saved image with its available WebP asset', () => {
    const html = renderToStaticMarkup(<PioneerImage src="/src/assets/images/club_robotics_lab_1795074334521.jpg" alt="Robotics" />);
    assert.match(html, /src="\/src\/assets\/images\/club_robotics_lab_1795074334521\.webp"/);
  });

  it('renders the same public text with the lightweight renderer as Puck', () => {
    const visibleText = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    for (const page of pages) {
      const data = defaultData(page);
      const render = (useLightweightRenderer: boolean) => renderToStaticMarkup(
        <MemoryRouter initialEntries={[pagePath(page)]}>
          <ThemeProvider><RegistryProvider><PageScope page={page}>
            {useLightweightRenderer ? <PublicPageRenderer data={data} /> : <Render config={puckConfig} data={data} />}
          </PageScope></RegistryProvider></ThemeProvider>
        </MemoryRouter>
      );
      assert.equal(visibleText(render(true)), visibleText(render(false)), pageKey(page));
    }
  });

  it('keeps every optional block compatible with the public renderer', () => {
    const page: PageReference = { kind: 'club', campusSlug: 'pcss1', clubSlug: 'robotics' };
    const visibleText = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    for (const [type, component] of Object.entries(puckConfig.components)) {
      const data = { root: { props: {} }, content: [{ type, props: { ...component.defaultProps, id: `test-${type}` } }] } as Data;
      const render = (lightweight: boolean) => renderToStaticMarkup(
        <MemoryRouter initialEntries={[pagePath(page)]}>
          <ThemeProvider><RegistryProvider><PageScope page={page}>
            {lightweight ? <PublicPageRenderer data={data} /> : <Render config={puckConfig} data={data} />}
          </PageScope></RegistryProvider></ThemeProvider>
        </MemoryRouter>
      );
      assert.equal(visibleText(render(true)), visibleText(render(false)), type);
    }
  });

  it('has an editable layout and a matching editor route for every built-in page', () => {
    assert.equal(pages.length, 2 + INITIAL_CAMPUSES.length + INITIAL_CLUBS.length);
    assert.deepEqual([...PAGE_BLOCK_TYPES].sort(), Object.keys(puckConfig.components).sort());
    for (const page of pages) {
      assert.equal(pageExists(page, INITIAL_CAMPUSES, INITIAL_CLUBS), true, pageKey(page));
      const data = defaultData(page);
      assert.equal(isValidPageData(page, data), true, pageKey(page));
      assert.ok(data.content.length > 0, pageKey(page));
      for (const block of data.content) {
        assert.ok(block.type in puckConfig.components, `${pageKey(page)} uses unregistered block ${block.type}`);
      }
      assert.deepEqual(parseEditorPath(editorPath(page), INITIAL_CAMPUSES), page);
      assert.ok(pagePath(page).startsWith('/'));
    }
  });

  it('keeps directory and credits functionality when an editor removes their required blocks', () => {
    for (const page of pages.filter((candidate) => candidate.kind !== 'club')) {
      const data = defaultData(page);
      assert.equal(isValidPageData(page, { ...data, content: [] }), false);
      assert.equal(isValidPageData(page, { ...data, content: [...data.content, ...data.content] }), false);
    }
    assert.equal(pageExists({ kind: 'campus', campusSlug: 'missing' }, INITIAL_CAMPUSES, INITIAL_CLUBS), false);
    assert.equal(pageExists({ kind: 'club', campusSlug: 'pcss1', clubSlug: 'missing' }, INITIAL_CAMPUSES, INITIAL_CLUBS), false);
  });

  it('renders edited Puck content for home, campus, credits, and club pages', () => {
    for (const page of pages) {
      const data = structuredClone(defaultData(page));
      const marker = `Edited ${pageKey(page)} heading`;
      const first = data.content[0];
      if (first.type === 'DirectoryExperience' || first.type === 'CreditsExperience' || first.type === 'ClubHero') {
        first.props.title = marker;
      } else {
        const hero = data.content.find((block) => block.type === 'ClubHero');
        assert.ok(hero);
        hero.props.title = marker;
      }
      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={[pagePath(page)]}>
          <ThemeProvider>
            <RegistryProvider>
              <PageScope page={page}>
                <Render config={puckConfig} data={data} />
              </PageScope>
            </RegistryProvider>
          </ThemeProvider>
        </MemoryRouter>
      );
      assert.ok(html.includes(marker), `${pageKey(page)} did not render edited content`);
    }
  });

  it('renders contributor edits and keeps the attribution links in the credits layout', () => {
    const page: PageReference = { kind: 'credits' };
    const data = structuredClone(defaultData(page));
    const areas = data.content[0].props.creditAreas as Array<{ title: string; description: string; people: Array<Record<string, string>> }>;
    assert.ok(areas[0].people.some((person) => person.name === 'Aarti S Ravikumar' && person.url === 'https://ai-aarti.com' && person.schoolUrl === 'https://saugus.pioneercss.org'));
    areas[1].title = 'Student research & writing';
    areas[1].description = 'Research and writing for club pages.';
    areas[1].people.push({ name: 'Test Contributor', role: 'Writer', contribution: 'Club profiles', url: '', schoolName: 'PCSS II', schoolUrl: '' });
    areas.push({ title: 'Community partners', description: 'People who helped clubs connect.', people: [{ name: 'Partner Example', role: 'Mentor', contribution: 'Introductions', url: '', schoolName: '', schoolUrl: '' }] });
    data.content[0].props.suggestionTitle = 'Help us recognize someone';
    data.content[0].props.recognitionNote = 'Credits are reviewed before posting.';
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/credits']}>
        <ThemeProvider><RegistryProvider><PageScope page={page}><Render config={puckConfig} data={data} /></PageScope></RegistryProvider></ThemeProvider>
      </MemoryRouter>
    );
    assert.ok(html.includes('Test Contributor'));
    assert.ok(html.includes('Student research &amp; writing'));
    assert.ok(html.includes('Research and writing for club pages.'));
    assert.ok(html.includes('Community partners'));
    assert.ok(html.includes('Partner Example'));
    assert.ok(html.includes('Help us recognize someone'));
    assert.ok(html.includes('Credits are reviewed before posting.'));
    assert.ok(!html.includes('Featured contribution'));
    assert.ok(html.includes('School:'));
    assert.ok(html.includes('https://ai-aarti.com'));
    assert.match(html, /href="https:\/\/ai-aarti\.com\/" target="_blank" rel="noopener noreferrer"[^>]*>Aarti S Ravikumar<svg[^>]*aria-hidden="true"[^>]*>/);
    assert.match(html, /id="student-web-admin"[^>]*>.*Aarti S Ravikumar/);
    assert.match(html, /<span class="sr-only"> \(opens in a new tab\)<\/span><\/a>/);
    assert.ok(html.includes('https://saugus.pioneercss.org'));
    assert.ok(html.includes('Club mentors &amp; advisors'));
    assert.ok(html.includes('IT &amp; digital support'));
    assert.ok(html.includes('School administration'));
    assert.ok(html.includes('Stories &amp; media'));
    assert.ok(html.includes('Suggest a credit'));
    assert.equal(isValidPageData(page, data), true);
    const publicHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/credits']}>
        <ThemeProvider><RegistryProvider><PageScope page={page}><PublicPageRenderer data={data} /></PageScope></RegistryProvider></ThemeProvider>
      </MemoryRouter>
    );
    const visibleText = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    assert.equal(visibleText(publicHtml), visibleText(html));
    const storage = makeStorage();
    assert.equal(savePageLayout(page, storage, data), true);
    assert.equal((loadPageLayout(page, storage, defaultData(page)).content[0].props.creditAreas as typeof areas)[1].people[0].name, 'Test Contributor');
  });

  it('exposes nested contribution areas and people in the Puck sidebar', () => {
    const field = puckConfig.components.CreditsExperience.fields?.creditAreas;
    assert.ok(field);
    assert.equal(field.type, 'array');
    assert.equal(field.arrayFields.people.type, 'array');
    assert.equal(field.arrayFields.people.arrayFields.name.type, 'text');
    assert.equal(field.arrayFields.people.arrayFields.contribution.type, 'textarea');
  });

  it('renders one site shell around each Puck directory and credits page', () => {
    for (const page of pages.filter((candidate) => candidate.kind !== 'club')) {
      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={[pagePath(page)]}>
          <ThemeProvider><RegistryProvider><PuckDocumentPage page={page} /></RegistryProvider></ThemeProvider>
        </MemoryRouter>
      );
      assert.equal((html.match(/<header\b/g) ?? []).length, 1, pageKey(page));
      assert.equal((html.match(/<footer\b/g) ?? []).length, 1, pageKey(page));
      assert.match(html, /<main\b/, pageKey(page));
      assert.ok(!html.includes(`href="${editorPath(page)}"`), pageKey(page));
    }
  });

  it('hides club editor links from visitors without an authorized session', () => {
    for (const page of pages.filter((candidate) => candidate.kind === 'club')) {
      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={[pagePath(page)]}>
          <ThemeProvider><RegistryProvider>
            <Routes><Route path="/sites/:campusSlug/:clubSlug" element={<ClubSitePage />} /></Routes>
          </RegistryProvider></ThemeProvider>
        </MemoryRouter>
      );
      assert.ok(!html.includes(`href="${editorPath(page)}"`), pageKey(page));
    }
  });
});

describe('Puck layout persistence', () => {
  it('round trips independent layouts for all page kinds and resets one page without touching another', () => {
    const storage = makeStorage();
    for (const page of pages) {
      const fallback = defaultData(page);
      const changed = structuredClone(fallback);
      changed.root.props = { ...(changed.root.props ?? {}), title: `Changed ${pageKey(page)}` };
      assert.equal(savePageLayout(page, storage, changed), true);
      assert.equal(loadPageLayout(page, storage, fallback).root.props?.title, changed.root.props.title);
    }
    assert.equal(layoutStorageKey({ kind: 'club', campusSlug: 'pcss1', clubSlug: 'robotics' }), 'pcss_puck_layout_v1_pcss1_robotics');
    const first = pages[0];
    assert.deepEqual(resetPageLayout(first, storage, defaultData(first)), defaultData(first));
    assert.equal(loadPageLayout(first, storage, defaultData(first)).root.props?.title, defaultData(first).root.props?.title);
    assert.equal(loadPageLayout(pages[1], storage, defaultData(pages[1])).root.props?.title, `Changed ${pageKey(pages[1])}`);
  });

  it('falls back from malformed or incomplete saved layouts and rejects invalid writes', () => {
    const storage = makeStorage();
    const page: PageReference = { kind: 'home' };
    const fallback = defaultData(page);
    storage.setItem(layoutStorageKey(page), '{bad json');
    assert.deepEqual(loadPageLayout(page, storage, fallback), fallback);
    storage.setItem(layoutStorageKey(page), JSON.stringify({ root: { props: {} }, content: [] }));
    assert.deepEqual(loadPageLayout(page, storage, fallback), fallback);
    assert.equal(savePageLayout(page, storage, { ...fallback, content: [] }), false);
    const creditsPage: PageReference = { kind: 'credits' };
    const invalidCredits = structuredClone(defaultData(creditsPage));
    invalidCredits.content[0].props.creditAreas = 'not-an-array';
    assert.equal(savePageLayout(creditsPage, storage, invalidCredits), false);
    assert.deepEqual(loadPageLayout(page, null, fallback), fallback);
    assert.equal(savePageLayout(page, null, fallback), false);
  });

  it('migrates previously saved flat credits into editable contribution areas', () => {
    const page: PageReference = { kind: 'credits' };
    const legacy = structuredClone(defaultData(page));
    delete legacy.content[0].props.creditAreas;
    delete legacy.content[0].props.suggestionTitle;
    legacy.content[0].props.contributors = [
      { group: 'Creation & development', name: 'Aarti S. Ravikumar', role: 'Creator', contribution: 'Built the portal', url: 'https://ai-aarti.com', schoolName: 'PCSS II', schoolUrl: 'https://saugus.pioneercss.org' },
      { group: 'Community partners', name: 'Example Partner', role: 'Advisor', contribution: 'Helped plan', url: '', schoolName: '', schoolUrl: '' },
    ];
    const storage = makeStorage();
    storage.setItem(layoutStorageKey(page), JSON.stringify(legacy));
    const loaded = loadPageLayout(page, storage, defaultData(page));
    const areas = loaded.content[0].props.creditAreas as Array<{ title: string; people: Array<{ name: string }> }>;
    assert.equal(areas[0].people[0].name, 'Aarti S Ravikumar');
    assert.equal(areas.at(-1)?.title, 'Community partners');
    assert.equal(areas.at(-1)?.people[0].name, 'Example Partner');
    assert.equal(loaded.content[0].props.suggestionTitle, 'A credit missing or incorrect?');
    assert.equal(isValidPageData(page, loaded), true);
    assert.equal(savePageLayout(page, storage, legacy), true);
    assert.ok(JSON.parse(storage.getItem(layoutStorageKey(page))!).content[0].props.creditAreas);
    assert.ok(normalizePageData(page, legacy).content[0].props.creditAreas);
  });

  it('updates old default credits without overwriting contributor edits', () => {
    const page: PageReference = { kind: 'credits' };
    const saved = structuredClone(defaultData(page));
    const props = saved.content[0].props;
    props.eyebrow = 'The people behind the portal';
    props.title = 'Made together, for every club.';
    props.description = 'A student-led idea grows through the people who build, guide, support, and share it.';
    props.featuredLabel = 'Featured contribution';
    props.suggestionTitle = 'Custom invitation';
    const areas = props.creditAreas as Array<{ title: string; description: string; people: Array<{ name: string; role: string; contribution: string; url: string; schoolName: string; schoolUrl: string }> }>;
    areas[0].title = 'Creation & development';
    areas[0].description = 'The student-led idea, design, writing, and engineering behind the portal.';
    areas[0].people[0].name = 'Aarti S. Ravikumar';
    areas[0].people[0].role = 'Student creator and developer';
    areas[0].people[0].contribution = 'Concept, design, and development';
    areas[1].people.push({ name: 'Future Contributor', role: 'Writer', contribution: 'Club stories', url: '', schoolName: '', schoolUrl: '' });
    const storage = makeStorage();
    storage.setItem(layoutStorageKey(page), JSON.stringify(saved));
    const migrated = loadPageLayout(page, storage, defaultData(page)).content[0].props;
    assert.equal(migrated.title, 'Built to serve PCSS clubs.');
    assert.equal(migrated.suggestionTitle, 'Custom invitation');
    assert.equal(migrated.featuredLabel, undefined);
    const migratedAreas = migrated.creditAreas as typeof areas;
    assert.equal(migratedAreas[0].title, 'Project beginnings');
    assert.equal(migratedAreas[0].people[0].name, 'Aarti S Ravikumar');
    assert.equal(migratedAreas[0].people[0].role, 'Student creator, admin and contributor');
    assert.equal(migratedAreas[0].people[0].contribution, 'Started and built the first version in service of PCSS clubs.');
    assert.equal(migratedAreas[1].people[0].name, 'Future Contributor');
  });

  it('updates the previous default student role in saved credits', () => {
    const page: PageReference = { kind: 'credits' };
    const saved = structuredClone(defaultData(page));
    const areas = saved.content[0].props.creditAreas as Array<{ people: Array<{ role: string }> }>;
    areas[0].people[0].role = 'Student creator and contributor';
    const storage = makeStorage();
    storage.setItem(layoutStorageKey(page), JSON.stringify(saved));
    const loaded = loadPageLayout(page, storage, defaultData(page));
    const loadedAreas = loaded.content[0].props.creditAreas as typeof areas;
    assert.equal(loadedAreas[0].people[0].role, 'Student creator, admin and contributor');
  });

  it('recognizes legacy club editor URLs', () => {
    assert.deepEqual(parseEditorPath('/editor/robotics-pcss1', INITIAL_CAMPUSES), { kind: 'club', campusSlug: 'pcss1', clubSlug: 'robotics' });
  });
});
