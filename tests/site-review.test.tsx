import React from 'react';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { SiteReviewFooterMark, SiteReviewNotice } from '../src/components/SiteReviewNotice';
import { parseSiteReviewMode, siteReviewCopy } from '../src/data/siteReview';

describe('site review status', () => {
  it('defaults to both stages and accepts each supported deployment mode', () => {
    assert.equal(parseSiteReviewMode(undefined), 'both');
    assert.equal(parseSiteReviewMode(' APPROVAL '), 'approval');
    assert.equal(parseSiteReviewMode('development'), 'development');
    assert.equal(parseSiteReviewMode('off'), 'off');
    assert.equal(parseSiteReviewMode('unexpected'), 'both');
    assert.equal(siteReviewCopy('off'), null);
  });

  it('shows a clear, accessible status without covering content', () => {
    const html = renderToStaticMarkup(<MemoryRouter><SiteReviewNotice mode="both" /></MemoryRouter>);
    assert.match(html, /aria-label="Project status"/);
    assert.match(html, /To Be Approved/);
    assert.match(html, /In Development/);
    assert.match(html, /awaiting school administration approval/);
    assert.match(html, /href="\/credits"/);
    assert.doesNotMatch(html, /role="alert"|aria-live|fixed|sticky/);
    assert.match(renderToStaticMarkup(<MemoryRouter><SiteReviewNotice mode="off" /></MemoryRouter>), /^$/);
  });

  it('keeps individual stages independent and removes the footer mark when off', () => {
    const approval = renderToStaticMarkup(<MemoryRouter><SiteReviewNotice mode="approval" /></MemoryRouter>);
    const development = renderToStaticMarkup(<MemoryRouter><SiteReviewNotice mode="development" /></MemoryRouter>);
    assert.match(approval, /To Be Approved/);
    assert.doesNotMatch(approval, /In Development/);
    assert.match(development, /In Development/);
    assert.doesNotMatch(development, /To Be Approved/);
    assert.equal(renderToStaticMarkup(<SiteReviewFooterMark mode="off" />), '');
  });
});
