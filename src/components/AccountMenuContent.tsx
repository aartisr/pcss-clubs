import { Link } from 'react-router-dom';
import { ArrowRightLeft, Compass, Edit3, LogOut } from 'lucide-react';
import { AUTH_COPY } from '../data/authCopy';

interface AccountMenuContentProps {
  user: { name?: string; email?: string };
  canEdit: boolean;
  signingOut: boolean;
  signOutError: boolean;
  onNavigate: () => void;
  onUseAnotherAccount: () => void;
  onSignOut: () => void;
}

export function AccountMenuContent({ user, canEdit, signingOut, signOutError, onNavigate, onUseAnotherAccount, onSignOut }: AccountMenuContentProps) {
  const displayName = user.name?.trim() || 'School account';

  return (
    <>
      <div className="min-w-0 px-2 pb-3">
        <p className="truncate text-sm font-bold text-[#0B2240] dark:text-white">{displayName}</p>
        {user.email && <p className="break-all text-xs text-slate-600 dark:text-slate-300">{user.email}</p>}
      </div>
      <nav aria-label="Your pages" className="border-t border-slate-200 pt-2 dark:border-slate-700">
        <Link to="/my" onClick={onNavigate} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm font-semibold text-[#0B2240] hover:bg-slate-100 dark:text-white dark:hover:bg-[#102A43]"><Compass className="h-4 w-4" aria-hidden="true" />{AUTH_COPY.mySpace}</Link>
        {canEdit && <Link to="/editor" onClick={onNavigate} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm font-semibold text-[#0B2240] hover:bg-slate-100 dark:text-white dark:hover:bg-[#102A43]"><Edit3 className="h-4 w-4" aria-hidden="true" />Manage pages</Link>}
      </nav>
      <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
        <button type="button" onClick={onUseAnotherAccount} disabled={signingOut} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm font-semibold text-[#0B2240] hover:bg-slate-100 disabled:opacity-50 dark:text-white dark:hover:bg-[#102A43]"><ArrowRightLeft className="h-4 w-4" aria-hidden="true" />{AUTH_COPY.switchSchoolAccount}</button>
        <button type="button" onClick={onSignOut} disabled={signingOut} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm font-semibold text-[#0B2240] hover:bg-slate-100 disabled:opacity-50 dark:text-white dark:hover:bg-[#102A43]"><LogOut className="h-4 w-4" aria-hidden="true" />{signingOut ? 'Signing out…' : 'Sign out'}</button>
        {signOutError && <p role="alert" className="px-2 py-1 text-xs font-semibold text-[#8B1E24] dark:text-[#FCA5A5]">We could not sign you out. Please try again.</p>}
        <p className="px-2 pt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Signing out here does not sign you out of Google.</p>
      </div>
    </>
  );
}
