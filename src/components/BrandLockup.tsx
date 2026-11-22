import React from 'react';

interface BrandLockupProps {
  compact?: boolean;
}

export function BrandLockup({ compact = false }: BrandLockupProps) {
  return (
    <span className="inline-flex items-center gap-2.5 text-left">
      <img src="/brand-mark.svg" width="42" height="42" alt="" className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-sm font-extrabold tracking-tight text-white sm:text-lg">Pioneer <span className="text-[#F7D46B]">Clubs</span></span>
        {!compact && <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300 md:hidden xl:block">Student organizations</span>}
      </span>
    </span>
  );
}
