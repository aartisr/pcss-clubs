import React from 'react';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ClubHero } from '../src/components/ClubHero';
import { SECURITY_HEADERS } from '../src/server/securityHeaders';
import { safeContentUrl } from '../src/shared/safeContentUrl';

test('editable content links accept only clear web and same-site destinations', () => {
  assert.equal(safeContentUrl('/campus/pcss2?view=clubs#list'), '/campus/pcss2?view=clubs#list');
  assert.equal(safeContentUrl('https://example.edu/events'), 'https://example.edu/events');
  assert.equal(safeContentUrl('#schedule', true), '#schedule');
  for (const value of ['javascript:alert(1)', 'data:text/html,evil', 'mailto:someone@example.com',
    '//evil.example', '/\\evil.example', 'https://name:pass@example.edu', 'java\nscript:alert(1)', '#bad fragment']) {
    assert.equal(safeContentUrl(value, true), null, value);
  }
  const html = renderToStaticMarkup(<MemoryRouter><ClubHero title="Club" subtitle="Explore"
    primaryCtaLabel="Unsafe destination" primaryCtaHref="javascript:alert(1)"
    secondaryCtaLabel="Meeting details" secondaryCtaHref="#schedule" /></MemoryRouter>);
  assert.doesNotMatch(html, /Unsafe destination|javascript:/);
  assert.match(html, /href="#schedule"/);
});

test('Express and Vercel share the same browser security headers', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const global = config.headers.find((entry) => entry.source === '/(.*)');
  assert.ok(global);
  assert.deepEqual(Object.fromEntries(global.headers.map(({ key, value }) => [key, value])), SECURITY_HEADERS);
});

test('host routing cannot reverse the Vercel Domains redirect', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
    redirects: { has?: { type: string }[] }[];
  };
  assert.ok(config.redirects.every((rule) => !rule.has?.some((condition) => condition.type === 'host')));
  const html = readFileSync('index.html', 'utf8');
  assert.doesNotMatch(html, /location\.replace\(['"]https:\/\/pcssclubs\.org/);
});
