import { Filter } from 'lucide-react';
import { CAMPUS_THEME_TOKENS, MEETING_DAYS, type Campus, type ClubCategory, type MeetingDay } from '../../data/registry';

type DirectoryFiltersProps = {
  campuses: Campus[];
  categories: ClubCategory[];
  selectedCampuses: string[];
  selectedCategory: ClubCategory | 'All';
  selectedDay: MeetingDay | 'All';
  activeCount: number;
  onToggleCampus: (slug: string) => void;
  onCategoryChange: (category: ClubCategory | 'All') => void;
  onDayChange: (day: MeetingDay | 'All') => void;
};

export function DirectoryFilters({ campuses, categories, selectedCampuses, selectedCategory, selectedDay, activeCount, onToggleCampus, onCategoryChange, onDayChange }: DirectoryFiltersProps) {
  return (
    <details className="group pt-4">
      <summary className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#0B2240] hover:bg-[#F8FAFC] dark:text-white dark:hover:bg-[#162947]">
        <Filter className="h-4 w-4 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" />Filters{activeCount > 0 ? ` (${activeCount})` : ''}
      </summary>
      <div className="grid grid-cols-1 items-end gap-5 pt-4 lg:grid-cols-12">
        <fieldset className="lg:col-span-5">
          <legend className="mb-2 text-xs font-semibold text-[#475569] dark:text-slate-300">Campus</legend>
          <div className="flex flex-wrap gap-1.5">
            {campuses.map((campus) => {
              const active = selectedCampuses.includes(campus.slug);
              const activeTheme = CAMPUS_THEME_TOKENS[campus.themeColor]?.activeButtonClass || 'bg-[#0B2240] text-white border-[#0B2240]';
              return <button key={campus.id} type="button" aria-pressed={active} onClick={() => onToggleCampus(campus.slug)} className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${active ? activeTheme : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:border-[#94A3B8] dark:border-[#1E3A5F] dark:bg-[#071120] dark:text-slate-300 dark:hover:border-slate-500'}`}>{campus.shortName}</button>;
            })}
          </div>
        </fieldset>
        <div className="lg:col-span-4">
          <label htmlFor="category-select" className="mb-2 block text-xs font-semibold text-[#475569] dark:text-slate-300">Interest</label>
          <select id="category-select" value={selectedCategory} onChange={(event) => onCategoryChange(event.target.value as ClubCategory | 'All')} className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-[#0B2240] focus:outline-none dark:border-[#1E3A5F] dark:bg-[#071120] dark:text-slate-100 dark:focus:border-[#D4AF37]">
            <option value="All">All Disciplines</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div className="lg:col-span-3">
          <label htmlFor="day-select" className="mb-2 block text-xs font-semibold text-[#475569] dark:text-slate-300">Meeting Day</label>
          <select id="day-select" value={selectedDay} onChange={(event) => onDayChange(event.target.value as MeetingDay | 'All')} className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-[#0B2240] focus:outline-none dark:border-[#1E3A5F] dark:bg-[#071120] dark:text-slate-100 dark:focus:border-[#D4AF37]">
            <option value="All">Any Day</option>
            {MEETING_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
          </select>
        </div>
      </div>
    </details>
  );
}
