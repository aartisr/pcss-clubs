import type { Club, MeetingDay } from './registry';

export const WEEKDAYS: MeetingDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type MeetingSlot = {
  club: Club;
  day: MeetingDay;
  startMinutes: number;
  endMinutes: number;
};

function clockMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return (hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + minute;
}

export function parseMeetingRange(value: string): { start: number; end: number } | null {
  const parts = value.split(/\s*[–—-]\s*/);
  if (parts.length !== 2) return null;
  const start = clockMinutes(parts[0]);
  const end = clockMinutes(parts[1]);
  return start !== null && end !== null && end > start ? { start, end } : null;
}

export function buildWeeklyPlan(clubs: Club[]) {
  const slots: MeetingSlot[] = [];
  const needsConfirmation: Club[] = [];
  for (const club of clubs) {
    const range = parseMeetingRange(club.meetingTime);
    if (!range || !club.meetingDays.length) {
      needsConfirmation.push(club);
      continue;
    }
    for (const day of club.meetingDays) slots.push({ club, day, startMinutes: range.start, endMinutes: range.end });
  }
  slots.sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day) || a.startMinutes - b.startMinutes || a.club.name.localeCompare(b.club.name));
  const conflicts: { first: MeetingSlot; second: MeetingSlot }[] = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length && slots[j].day === slots[i].day; j++) {
      if (slots[i].club.id !== slots[j].club.id && slots[i].startMinutes < slots[j].endMinutes && slots[j].startMinutes < slots[i].endMinutes) {
        conflicts.push({ first: slots[i], second: slots[j] });
      }
    }
  }
  return { slots, conflicts, needsConfirmation };
}
