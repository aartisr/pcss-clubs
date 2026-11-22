import { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, UserRound } from 'lucide-react';
import { AccountMenuContent } from './AccountMenuContent';

type AccountControlProps = {
  user: { name?: string; email?: string };
  canEdit: boolean;
  onSignOut: () => Promise<boolean>;
  onUseAnotherAccount: () => void;
  mobile?: boolean;
};

export function AccountControl({ user, canEdit, onSignOut, onUseAnotherAccount, mobile = false }: AccountControlProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const displayName = user.name?.trim() || user.email?.trim() || 'School account';
  const initials = user.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSignOutError(false);
    setSigningOut(true);
    const success = await onSignOut();
    if (!success) setSignOutError(true);
    setSigningOut(false);
  };
  const content = <AccountMenuContent user={user} canEdit={canEdit} signingOut={signingOut} signOutError={signOutError} onNavigate={() => setOpen(false)} onUseAnotherAccount={onUseAnotherAccount} onSignOut={() => void handleSignOut()} />;

  if (mobile) return <section aria-label="Your account" className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 dark:border-slate-700 dark:bg-[#102A43]">{content}</section>;

  return (
    <div ref={wrapperRef} className="relative hidden xl:block">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Account for ${displayName}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 max-w-44 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-[#0B2240]" aria-hidden="true">{initials || <UserRound className="h-4 w-4" />}</span>
        <span className="truncate">{displayName}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && <div id={panelId} className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 text-[#0B2240] shadow-xl dark:border-slate-700 dark:bg-[#0E1C33] dark:text-white">{content}</div>}
    </div>
  );
}
