import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatClubSiteRequestEmail, SUPPORT_TOPICS } from '../src/data/supportCenter';

describe('support center request handoff', () => {
  it('keeps the answer set focused and uniquely addressable', () => {
    assert.equal(new Set(SUPPORT_TOPICS.map((topic) => topic.id)).size, SUPPORT_TOPICS.length);
    assert.ok(SUPPORT_TOPICS.some((topic) => topic.id === 'request-site'));
    assert.ok(SUPPORT_TOPICS.some((topic) => topic.id === 'approval'));
  });

  it('formats the server notification with the signed-in member and review context', () => {
    const message = formatClubSiteRequestEmail({
      requesterName: 'Student Example', requesterEmail: 'student@pioneercss.org',
      clubName: 'Robotics Team', campusName: 'PCSS II', clubStatus: 'seeking-approval',
      advisorName: 'Mentor Example', purpose: 'Share meetings and projects.',
    }, 'PCR-12345678');
    assert.equal(message.subject, 'Club website request: Robotics Team');
    const body = message.text;
    assert.match(body, /PCR-12345678/);
    assert.match(body, /Student Example <student@pioneercss.org>/);
    assert.match(body, /School approval status: Seeking school approval/);
    assert.match(body, /Share meetings and projects/);
    assert.match(body, /does not create or approve a public club page automatically/);
  });

  it('removes line breaks from subject and one-line identity fields', () => {
    const message = formatClubSiteRequestEmail({
      requesterName: 'Student\nExample', requesterEmail: 'student@pioneercss.org',
      clubName: 'Robotics\nTeam', campusName: 'PCSS II', clubStatus: 'unsure',
      advisorName: '', purpose: 'A place to share updates.',
    }, 'PCR-12345678');
    assert.equal(message.subject, 'Club website request: Robotics Team');
    assert.match(message.text, /Requested by: Student Example/);
  });
});
