import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { INITIAL_CAMPUSES, INITIAL_CLUBS, createDefaultPuckData, resolveBuiltInImageUrl, type Campus, type Club } from '../src/data/registry';
import { campusHostname, clubHostname, createCampusRecord, createClubRecord, defaultClubCover, normalizeSlug, updateCampusRecord, updateClubRecord, validateRegistry } from '../src/data/registryModel';
import { layoutStorageKey, transferPageLayout, removePageLayout } from '../src/puck/pageLayoutStore';
import { filterClubs, totalClubMembers } from '../src/data/registrySelectors';
import { createDefaultPageData, editorPath, pageExists, pagePath } from '../src/puck/pageModel';
import { emptyCampusDraft, emptyClubDraft } from '../src/data/registryDrafts';
import { SCHOOL_FIELDS, CLUB_FIELDS } from '../src/components/RegistryFields';
import { createRegistrySnapshot, parseRegistrySnapshot } from '../src/data/registrySnapshot';

const schoolInput: Omit<Campus, 'id' | 'subdomain'> = {
  slug: 'north-campus', name: 'North Campus', shortName: 'North', city: 'North, MA',
  address: '1 School St', gradesServed: 'Grades 7–12', themeColor: 'navy', foundedYear: 2026,
};

function clubInput(campusSlug: string): Omit<Club, 'id' | 'subdomain'> {
  return {
    slug: 'chess', campusSlug, name: 'Chess Club', category: 'General Interest',
    shortDescription: 'Play chess.', advisorName: 'Advisor', advisorEmail: 'advisor@example.org',
    studentLead: 'Lead', meetingDays: ['Wednesday'], meetingTime: '3 PM', roomNumber: '101',
    memberCount: 0, coverImage: '', openEnrollment: true,
  };
}

describe('plug-and-play school and club records', () => {
  it('resolves saved JPEG-era built-in image paths without changing custom images', () => {
    assert.equal(
      resolveBuiltInImageUrl('/src/assets/images/club_robotics_lab_1795074334521.jpg'),
      '/src/assets/images/club_robotics_lab_1795074334521.webp',
    );
    assert.equal(
      resolveBuiltInImageUrl('http://localhost:3000/src/assets/images/club_robotics_lab_1795074334521.jpg?v=1'),
      'http://localhost:3000/src/assets/images/club_robotics_lab_1795074334521.webp?v=1',
    );
    assert.equal(resolveBuiltInImageUrl('/uploads/student-photo.jpg'), '/uploads/student-photo.jpg');
  });

  it('keeps add and edit forms complete when the record schema changes', () => {
    assert.deepEqual(SCHOOL_FIELDS.map((field) => field.key).sort(), Object.keys(emptyCampusDraft()).sort());
    assert.deepEqual(CLUB_FIELDS.map((field) => field.key).sort(), Object.keys(emptyClubDraft('pcss1')).sort());
  });

  it('round trips complete snapshots and rejects incompatible or corrupt imports', () => {
    const exported = createRegistrySnapshot(INITIAL_CAMPUSES, INITIAL_CLUBS);
    const parsed = parseRegistrySnapshot(JSON.stringify(exported));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.deepEqual(parsed.campuses, INITIAL_CAMPUSES);
    assert.deepEqual(parsed.clubs, INITIAL_CLUBS);
    const invalid = parseRegistrySnapshot('{broken');
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.match(invalid.error, /syntax/);
    const future = parseRegistrySnapshot(JSON.stringify({ ...exported, version: 2 }));
    assert.equal(future.ok, false);
    const orphan = parseRegistrySnapshot(JSON.stringify({ ...exported, clubs: [{ ...INITIAL_CLUBS[0], campusSlug: 'missing' }] }));
    assert.equal(orphan.ok, false);
  });

  it('normalizes slugs and creates a new school and club without hardcoded campus IDs', () => {
    assert.equal(normalizeSlug(' North & East School! '), 'north-east-school');
    const school = createCampusRecord(schoolInput, INITIAL_CAMPUSES);
    const club = createClubRecord(clubInput(school.slug), [...INITIAL_CAMPUSES, school], INITIAL_CLUBS);
    assert.equal(school.subdomain, campusHostname(school.slug));
    assert.equal(club.subdomain, clubHostname(school.slug, club.slug));
    assert.equal(club.coverImage, defaultClubCover(club.category));
    assert.equal(club.memberCount, 0);
    assert.equal(validateRegistry([...INITIAL_CAMPUSES, school], [...INITIAL_CLUBS, club]), null);
    const layout = createDefaultPuckData(club, school);
    assert.deepEqual(layout.content.map((block) => block.type), ['ClubHero', 'MeetingScheduleCard', 'RosterAndLeadership']);
    assert.ok(!JSON.stringify(layout).includes('1st Place'));
    assert.equal(pageExists({ kind: 'campus', campusSlug: school.slug }, [...INITIAL_CAMPUSES, school], [...INITIAL_CLUBS, club]), true);
    assert.equal(pageExists({ kind: 'club', campusSlug: school.slug, clubSlug: club.slug }, [...INITIAL_CAMPUSES, school], [...INITIAL_CLUBS, club]), true);
    assert.ok(createDefaultPageData({ kind: 'campus', campusSlug: school.slug }, [...INITIAL_CAMPUSES, school], [...INITIAL_CLUBS, club]).content.length);
    assert.equal(pagePath({ kind: 'club', campusSlug: school.slug, clubSlug: club.slug }), '/sites/north-campus/chess');
    assert.equal(editorPath({ kind: 'club', campusSlug: school.slug, clubSlug: club.slug }), '/editor/north-campus/chess');
  });

  it('rejects duplicate slugs and clubs assigned to unknown schools', () => {
    assert.throws(() => createCampusRecord({ ...schoolInput, slug: 'PCSS1' }, INITIAL_CAMPUSES), /already in use/);
    assert.throws(() => createClubRecord(clubInput('unknown'), INITIAL_CAMPUSES, INITIAL_CLUBS), /existing school/);
    assert.throws(() => createClubRecord({ ...clubInput('pcss1'), slug: 'robotics' }, INITIAL_CAMPUSES, INITIAL_CLUBS), /already in use/);
    assert.match(validateRegistry(INITIAL_CAMPUSES, [...INITIAL_CLUBS, { ...INITIAL_CLUBS[0], id: 'duplicate' }]) || '', /unique valid slugs/);
    assert.match(validateRegistry(INITIAL_CAMPUSES, [{ ...INITIAL_CLUBS[0], campusSlug: 'unknown' }]) || '', /existing school/);
  });

  it('requires real school facts and leaves unknown club details unpublished', () => {
    assert.throws(() => createCampusRecord({ ...emptyCampusDraft(), name: 'New School', shortName: 'New' }, INITIAL_CAMPUSES), /founding year/);
    const club = createClubRecord({ ...emptyClubDraft('pcss1'), name: 'Chess Club' }, INITIAL_CAMPUSES, INITIAL_CLUBS);
    assert.equal(club.advisorEmail, '');
    assert.equal(club.meetingDays.length, 0);
    const layout = createDefaultPuckData(club, INITIAL_CAMPUSES[0]);
    assert.deepEqual(layout.content.map((block) => block.type), ['ClubHero']);
    assert.ok(!JSON.stringify(layout).includes('Faculty Advisor'));
  });

  it('renames schools and moves clubs while keeping route-derived hostnames valid', () => {
    const school = createCampusRecord(schoolInput, INITIAL_CAMPUSES);
    const renamed = updateCampusRecord(school, { slug: 'new-north', name: 'New North' }, [...INITIAL_CAMPUSES, school]);
    assert.equal(renamed.subdomain, 'new-north.pcssclubs.org');
    const original = createClubRecord(clubInput(school.slug), [...INITIAL_CAMPUSES, school], INITIAL_CLUBS);
    const moved = updateClubRecord(original, { campusSlug: 'pcss2', slug: 'strategy' }, [...INITIAL_CAMPUSES, school], [...INITIAL_CLUBS, original]);
    assert.equal(moved.subdomain, 'strategy.pcss2.pcssclubs.org');
    assert.throws(() => updateCampusRecord(school, { slug: 'pcss1' }, [...INITIAL_CAMPUSES, school]), /already in use/);
  });

  it('moves or copies Puck layouts with the record and deletes removed layouts', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); },
      removeItem: (key: string) => { map.delete(key); },
    };
    const source = { kind: 'club' as const, campusSlug: 'pcss1', clubSlug: 'chess' };
    const target = { kind: 'club' as const, campusSlug: 'pcss2', clubSlug: 'chess' };
    storage.setItem(layoutStorageKey(source), '{"layout":1}');
    transferPageLayout(source, target, storage, false);
    assert.equal(storage.getItem(layoutStorageKey(source)), '{"layout":1}');
    assert.equal(storage.getItem(layoutStorageKey(target)), '{"layout":1}');
    transferPageLayout(source, target, storage, true);
    assert.equal(storage.getItem(layoutStorageKey(source)), null);
    removePageLayout(target, storage);
    assert.equal(storage.getItem(layoutStorageKey(target)), null);
  });

  it('uses one search rule for directory, navigation, and quick search', () => {
    const matches = filterClubs(INITIAL_CLUBS, INITIAL_CAMPUSES, { query: 'robotics' });
    assert.ok(matches.length >= 1);
    assert.ok(matches.every((club) => club.name.toLowerCase().includes('robotics') || club.category.toLowerCase().includes('robotics') || club.subdomain.toLowerCase().includes('robotics')));
    const campusMatches = filterClubs(INITIAL_CLUBS, INITIAL_CAMPUSES, { campusSlugs: ['pcss1'] });
    assert.ok(campusMatches.every((club) => club.campusSlug === 'pcss1'));
    assert.equal(totalClubMembers(INITIAL_CLUBS), INITIAL_CLUBS.reduce((total, club) => total + club.memberCount, 0));
  });
});
