import { Link } from 'react-router-dom';
import type { Club } from '../../data/registry';
import { buildClubPath } from '../../middleware/tenantRouting';
import { buildWeeklyPlan, WEEKDAYS } from '../../data/memberSchedule';
import { PUBLIC_CONTENT_VERIFIED } from '../../data/publication';

export function MemberSchedule({ clubs }: { clubs: Club[] }) {
  const { slots, conflicts, needsConfirmation } = buildWeeklyPlan(clubs);
  return <section aria-labelledby="my-schedule-heading" className="site-card rounded-3xl border border-[#E2E8F0] bg-white p-6 dark:border-[#1E3A5F] dark:bg-[#0E1C33] sm:p-8">
    <h2 id="my-schedule-heading" className="font-display text-2xl font-bold text-[#0B2240] dark:text-white">Weekly plan</h2>
    <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">{PUBLIC_CONTENT_VERIFIED ? 'A view of your saved clubs in the school timezone, America/New_York. Confirm details with each club before attending.' : 'A preview using club details still awaiting school verification. Check with the club before making plans.'}</p>
    {conflicts.length > 0 && <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100"><p className="font-semibold">Possible time overlaps</p><ul className="mt-1 list-disc pl-5">{conflicts.map(({ first, second }) => <li key={`${first.club.id}-${second.club.id}-${first.day}`}>{first.club.name} and {second.club.name} overlap on {first.day}.</li>)}</ul></div>}
    {slots.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{WEEKDAYS.map((day) => { const items = slots.filter((slot) => slot.day === day); return items.length ? <section key={day} aria-label={day} className="rounded-2xl border border-[#E2E8F0] p-4 dark:border-[#1E3A5F]"><h3 className="font-display text-lg font-bold text-[#0B2240] dark:text-white">{day}</h3><ul className="mt-3 space-y-3">{items.map((slot) => <li key={`${slot.club.id}-${day}`}><Link to={buildClubPath(slot.club.campusSlug, slot.club.slug)} className="font-semibold text-[#8B1E24] hover:underline dark:text-[#FCA5A5]">{slot.club.name}</Link><p className="text-sm text-[#475569] dark:text-slate-300">{slot.club.meetingTime}{slot.club.roomNumber ? ` · ${slot.club.roomNumber}` : ''}</p></li>)}</ul></section> : null; })}</div> : <div className="mt-6 rounded-xl bg-[#F8FAFC] p-5 text-sm text-[#475569] dark:bg-[#071120] dark:text-slate-300">{clubs.length ? 'No complete meeting times are listed for your saved clubs yet.' : 'Save a club to start a weekly plan.'} <Link to="/" className="font-semibold text-[#8B1E24] underline dark:text-[#FCA5A5]">Explore clubs</Link></div>}
    {needsConfirmation.length > 0 && <div className="mt-6"><h3 className="font-semibold text-[#0B2240] dark:text-white">Time to confirm</h3><ul className="mt-2 list-disc pl-5 text-sm text-[#475569] dark:text-slate-300">{needsConfirmation.map((club) => <li key={club.id}><Link to={buildClubPath(club.campusSlug, club.slug)} className="underline">{club.name}</Link> has no complete meeting time.</li>)}</ul></div>}
    <p className="mt-6 text-xs text-[#64748B] dark:text-slate-400">This plan is based on saved clubs, not enrollment or attendance. Calendar downloads will appear after each meeting has an approved date and time.</p>
  </section>;
}
