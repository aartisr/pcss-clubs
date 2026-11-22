import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function MemberNextStep({ savedCount }: { savedCount: number }) {
  return <section aria-labelledby="member-next-step" className="mb-6 rounded-2xl border border-[#D4AF37]/50 bg-white p-6 dark:bg-[#0E1C33]"><p className="text-xs font-bold uppercase tracking-widest text-[#8B1E24] dark:text-[#FCA5A5]">Next step</p><h2 id="member-next-step" className="mt-1 font-display text-xl font-bold text-[#0B2240] dark:text-white">{savedCount ? 'Check your weekly plan' : 'Find a club to explore'}</h2><p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">{savedCount ? 'Your saved clubs are ready to compare. Meeting details are still awaiting school confirmation.' : 'Save a club to keep it close and start a personal weekly plan.'}</p><Link to={savedCount ? '/my/schedule' : '/'} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#8B1E24] dark:text-[#FCA5A5]">{savedCount ? 'View weekly plan' : 'Explore clubs'}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></section>;
}
