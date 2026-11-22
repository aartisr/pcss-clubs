import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { CAMPUS_THEME_TOKENS, type Campus, type Club } from '../../data/registry';
import { buildClubPath } from '../../middleware/tenantRouting';
import { PioneerImage } from '../PioneerImage';
import { SaveClubButton } from '../SaveClubButton';

type ClubDirectoryCardProps = {
  club: Club;
  campus?: Campus;
  canSave: boolean;
  saved: boolean;
  onToggleSaved: () => void;
};

export function ClubDirectoryCard({ club, campus, canSave, saved, onToggleSaved }: ClubDirectoryCardProps) {
  const clubPath = buildClubPath(club.campusSlug, club.slug);
  const campusTextClass = (campus && CAMPUS_THEME_TOKENS[campus.themeColor]?.textClass) || 'text-[#0B2240]';

  return (
    <article className="site-card site-card-interactive flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white transition-colors hover:border-[#CBD5E1] dark:border-[#1E3A5F] dark:bg-[#0E1C33] dark:hover:border-slate-500">
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-[#102A43]">
          <PioneerImage src={club.coverImage} alt={club.name} fallbackTitle={club.name} className="h-full w-full object-cover" />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-semibold ${campusTextClass}`}>{campus?.name || club.campusSlug}</span>
            <span className="text-[#CBD5E1] dark:text-[#1E3A5F]" aria-hidden="true">·</span>
            <span className="truncate text-[#64748B] dark:text-slate-400">{club.category}</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold leading-snug text-[#0B2240] dark:text-white">
            <Link to={clubPath} className="transition-colors hover:text-[#8B1E24] dark:hover:text-[#FCA5A5]">{club.name}</Link>
          </h3>
          {club.shortDescription && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#475569] dark:text-slate-300">{club.shortDescription}</p>}
          {club.meetingDays.length > 0 && <p className="mt-4 flex items-center gap-2 text-xs text-[#475569] dark:text-slate-300">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" />
            <span>Meets {club.meetingDays.map((day) => day.slice(0, 3)).join(', ')}{club.meetingTime ? ` · ${club.meetingTime}` : ''}</span>
          </p>}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4 dark:border-[#1E3A5F] dark:bg-[#071120]">
        <Link to={clubPath} className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-[#0B2240] transition-colors hover:text-[#8B1E24] dark:text-[#93C5FD] dark:hover:text-[#FCA5A5]">
          View club <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        {canSave && <SaveClubButton saved={saved} onToggle={onToggleSaved} shortLabel />}
      </div>
    </article>
  );
}
