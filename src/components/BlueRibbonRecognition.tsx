import React from 'react';

interface BlueRibbonRecognitionProps {
  compact?: boolean;
}

export function BlueRibbonRecognition({ compact = false }: BlueRibbonRecognitionProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${compact ? '' : 'rounded-xl border border-white/20 bg-white/5 px-3 py-2'}`}>
      <img src="/pcss-ii-blue-ribbon-2022.png" width="56" height="56" alt="2022 National Blue Ribbon School seal" className={`${compact ? 'h-12 w-12' : 'h-14 w-14'} shrink-0 object-contain`} />
      <span className="text-left leading-snug">
        <span className="block text-xs font-bold text-white">PCSS II · Saugus</span>
        <span className="block text-xs text-slate-300">2022 National Blue Ribbon School</span>
      </span>
    </div>
  );
}
