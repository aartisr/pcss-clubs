import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildClubSiteRequestEmail, CLUB_SITE_REQUEST_EMAIL, SUPPORT_TOPICS } from '../src/data/supportCenter';

describe('support center request handoff', () => {
  it('keeps the answer set focused and uniquely addressable', () => {
    assert.equal(new Set(SUPPORT_TOPICS.map((topic) => topic.id)).size, SUPPORT_TOPICS.length);
    assert.ok(SUPPORT_TOPICS.some((topic) => topic.id === 'request-site'));
    assert.ok(SUPPORT_TOPICS.some((topic) => topic.id === 'approval'));
  });

  it('creates an addressed email draft with the signed-in member and review context', () => {
    const href = buildClubSiteRequestEmail({
      requesterName: 'Student Example', requesterEmail: 'student@pioneercss.org',
      clubName: 'Robotics Team', campusName: 'PCSS II', clubStatus: 'seeking-approval',
      advisorName: 'Mentor Example', purpose: 'Share meetings and projects.',
    });
    assert.ok(href.startsWith(`mailto:${CLUB_SITE_REQUEST_EMAIL}?`));
    const params = new URLSearchParams(href.split('?')[1]);
    assert.equal(params.get('subject'), 'Club website request: Robotics Team');
    const body = params.get('body') || '';
    assert.match(body, /Student Example <student@pioneercss.org>/);
    assert.match(body, /School approval status: Seeking school approval/);
    assert.match(body, /Share meetings and projects/);
    assert.match(body, /does not create or approve a public club page automatically/);
  });

  it('removes line breaks from subject and one-line identity fields', () => {
    const href = buildClubSiteRequestEmail({
      requesterName: 'Student\nExample', requesterEmail: 'student@pioneercss.org',
      clubName: 'Robotics\nTeam', campusName: 'PCSS II', clubStatus: 'unsure',
      advisorName: '', purpose: 'A place to share updates.',
    });
    const params = new URLSearchParams(href.split('?')[1]);
    assert.equal(params.get('subject'), 'Club website request: Robotics Team');
    assert.match(params.get('body') || '', /Requested by: Student Example/);
  });
});
