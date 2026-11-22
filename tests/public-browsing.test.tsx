import React from 'react';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { GuestAccessChoice } from '../src/components/member/GuestAccessChoice';
import { AuthFeedback } from '../src/components/AuthFeedback';
import { AuthNavControl } from '../src/components/AuthNavControl';
import { SaveClubButton } from '../src/components/SaveClubButton';
import { authOutcomeMessage } from '../src/data/authOutcome';
import { LegalPage } from '../src/pages/LegalPage';
import { PRIVACY_PAGE } from '../src/data/legalPages';
import { RegistryProvider } from '../src/context/RegistryContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { SUPPORT_TOPICS } from '../src/data/supportCenter';

function renderGuest(status: 'ready' | 'error', configured: boolean, recentlySignedOut = false) {
  return renderToStaticMarkup(<MemoryRouter><GuestAccessChoice status={status} configured={configured}
    recentlySignedOut={recentlySignedOut} onSignIn={() => {}} /></MemoryRouter>);
}

test('guest account choices keep public browsing clear in every account state', () => {
  for (const html of [renderGuest('ready', true), renderGuest('ready', false), renderGuest('error', false), renderGuest('ready', true, true)]) {
    assert.match(html, /keep browsing without signing in/);
    assert.match(html, /href="\/"[^>]*>Browse clubs/);
  }
  const ready = renderGuest('ready', true);
  assert.match(ready, /Sign in with school account/);
  assert.match(ready, /save clubs and request a club website/);
  assert.match(renderGuest('ready', false), /Sign in with school account/);
  assert.match(renderGuest('ready', false), /Email the portal team/);
  assert.match(renderGuest('ready', true, true), /You’re signed out/);
  assert.match(renderGuest('error', false), /Sign in with school account/);
  assert.match(renderGuest('error', false), /Email the portal team/);
  assert.doesNotMatch(renderGuest('error', false), /Check account again|Your account is unavailable/);
});

test('signed-out navigation keeps an actionable sign-in button when setup is unavailable', () => {
  const desktop = renderToStaticMarkup(<MemoryRouter><AuthNavControl /></MemoryRouter>);
  const mobile = renderToStaticMarkup(<MemoryRouter><AuthNavControl mobile /></MemoryRouter>);
  assert.match(desktop, /<button[^>]*>Sign in<\/button>/);
  assert.match(mobile, /<button[^>]*>Sign in with school account<\/button>/);
  assert.doesNotMatch(desktop + mobile, /Sign-in help|href="\/support"/);
});

test('support explains organization-only Google access and the public alternative', () => {
  const answer = SUPPORT_TOPICS.find((topic) => topic.id === 'sign-in-error')?.answer ?? '';
  assert.match(answer, /without signing in/);
  assert.match(answer, /access is limited to the organization/);
  assert.match(answer, /PCSS school account/);
});

test('sign-in feedback stays in the page flow and does not duplicate My space guidance', () => {
  const banner = renderToStaticMarkup(<MemoryRouter initialEntries={['/?auth=denied']}><AuthFeedback /></MemoryRouter>);
  assert.match(banner, /role="alert"/);
  assert.match(banner, /Choose a PCSS school account/);
  assert.match(banner, /Browse public clubs/);
  assert.doesNotMatch(banner, /fixed|bottom-3/);

  const myBanner = renderToStaticMarkup(<MemoryRouter initialEntries={['/my?auth=denied']}><AuthFeedback /></MemoryRouter>);
  assert.equal(myBanner, '');
  const myCard = renderToStaticMarkup(<MemoryRouter initialEntries={['/my?auth=denied']}><GuestAccessChoice status="ready" configured recentlySignedOut={false} onSignIn={() => {}} /></MemoryRouter>);
  assert.match(myCard, /Choose an account/);
  assert.match(myCard, /keep browsing without signing in/);
  assert.ok(banner.includes(authOutcomeMessage('denied') ?? 'missing banner copy'));
  assert.ok(myCard.includes(authOutcomeMessage('denied') ?? 'missing account copy'));
  assert.equal(authOutcomeMessage('unrecognized'), undefined);
  const setup = renderToStaticMarkup(<MemoryRouter initialEntries={['/my?auth=setup']}><GuestAccessChoice status="ready" configured recentlySignedOut={false} onSignIn={() => {}} /></MemoryRouter>);
  assert.match(setup, /portal setup fix/);
  assert.match(setup, /Email the portal team/);
  assert.doesNotMatch(setup, /Sign in with school account|Try sign-in again/);
  const setupBanner = renderToStaticMarkup(<MemoryRouter initialEntries={['/?auth=setup']}><AuthFeedback /></MemoryRouter>);
  assert.match(setupBanner, /Contact the portal team/);
  assert.doesNotMatch(setupBanner, /Try sign-in again/);
});

test('the shared save control exposes its current state in both placements', () => {
  const saved = renderToStaticMarkup(<SaveClubButton saved onToggle={() => {}} shortLabel />);
  const available = renderToStaticMarkup(<SaveClubButton saved={false} onToggle={() => {}} />);
  assert.match(saved, /aria-pressed="true"/);
  assert.match(saved, />Saved<\/button>/);
  assert.match(available, /aria-pressed="false"/);
  assert.match(available, /Save for later/);
});

test('privacy operator role links to the named credit without leaving the site', () => {
  const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/privacy']}><ThemeProvider><RegistryProvider><LegalPage page={PRIVACY_PAGE} /></RegistryProvider></ThemeProvider></MemoryRouter>);
  assert.match(html, /operated by the <a[^>]*href="\/credits#student-web-admin"[^>]*>Student Web Admin<\/a>/);
  assert.doesNotMatch(html, /operated by Aarti S Ravikumar/);
});
