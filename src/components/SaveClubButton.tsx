import { Bookmark, BookmarkCheck } from 'lucide-react';

type SaveClubButtonProps = {
  saved: boolean;
  onToggle: () => void;
  shortLabel?: boolean;
};

export function SaveClubButton({ saved, onToggle, shortLabel = false }: SaveClubButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      title="Saved on this browser only; this does not join the club"
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs font-semibold text-[#0B2240] hover:border-[#8B1E24] dark:border-[#1E3A5F] dark:text-slate-100 dark:hover:border-[#FCA5A5]"
    >
      {saved ? <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />}
      {saved ? (shortLabel ? 'Saved' : 'Saved for later') : 'Save for later'}
    </button>
  );
}
