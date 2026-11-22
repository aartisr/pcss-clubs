import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { SiteReviewNotice } from './SiteReviewNotice';

type SiteShellProps = {
  children: ReactNode;
  activeCampusSlug?: string;
  activeClubSlug?: string;
};

/** Shared public and member page chrome. Embedded Puck blocks use their host shell. */
export function SiteShell({ children, activeCampusSlug, activeClubSlug }: SiteShellProps) {
  return (
    <div className="site-canvas flex min-h-screen flex-col bg-[#F8FAFC] text-[#1E293B] transition-colors dark:bg-[#071120] dark:text-slate-100">
      <Navbar activeCampusSlug={activeCampusSlug} activeClubSlug={activeClubSlug} />
      <SiteReviewNotice />
      {children}
      <Footer />
    </div>
  );
}
