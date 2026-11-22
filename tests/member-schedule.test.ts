import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildWeeklyPlan, parseMeetingRange } from '../src/data/memberSchedule.ts';
import type { Club } from '../src/data/registry.ts';

const club = (id: string, day: Club['meetingDays'][number], time: string): Club => ({
  id, slug: id, campusSlug: 'pcss1', name: id, category: 'Mathematics', shortDescription: '',
  advisorName: '', advisorEmail: '', studentLead: '', meetingDays: [day], meetingTime: time,
  roomNumber: '', memberCount: 0, subdomain: '', coverImage: '', openEnrollment: false,
});

test('meeting ranges reject missing, malformed, and reversed times', () => {
  assert.deepEqual(parseMeetingRange('3:15 PM – 5:45 PM'), { start: 915, end: 1065 });
  assert.equal(parseMeetingRange('After school'), null);
  assert.equal(parseMeetingRange('5:45 PM – 3:15 PM'), null);
});

test('weekly plan keeps incomplete meetings out of timed slots and names overlaps', () => {
  const plan = buildWeeklyPlan([club('Robotics', 'Tuesday', '3:15 PM – 5:45 PM'), club('Math', 'Tuesday', '4:00 PM – 5:00 PM'), club('Arts', 'Friday', '')]);
  assert.equal(plan.slots.length, 2);
  assert.equal(plan.conflicts.length, 1);
  assert.deepEqual([plan.conflicts[0].first.club.name, plan.conflicts[0].second.club.name], ['Robotics', 'Math']);
  assert.deepEqual(plan.needsConfirmation.map((item) => item.name), ['Arts']);
});
