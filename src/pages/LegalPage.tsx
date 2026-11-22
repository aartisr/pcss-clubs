import React from 'react';
import { Link } from 'react-router-dom';
import { SiteShell } from '../components/SiteShell';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { PRIVACY_PAGE, TERMS_PAGE, type LegalPage as LegalPageData } from '../data/legalPages';

export function LegalPage({ page }: { page: LegalPageData }) {
  usePageMetadata({
    title: `${page.title} | PCSS Pioneer Clubs`,
    description: page.summary,
    canonicalPath: page.path,
    indexable: true,
  });
  return (
    <SiteShell>
      <main className="flex-1">
        <header className="site-hero bg-[#0B2240] px-4 py-16 text-white sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">Pioneer Clubs · Site policies</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{page.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">{page.summary}</p>
            <p className="mt-4 text-xs text-slate-300">Updated {page.updated}</p>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <nav aria-label="Site policies" className="mb-10 flex flex-wrap gap-3 text-sm font-semibold">
            <Link to={PRIVACY_PAGE.path} aria-current={page.path === PRIVACY_PAGE.path ? 'page' : undefined} className={`rounded-full px-4 py-2 ${page.path === PRIVACY_PAGE.path ? 'bg-[#0B2240] text-white dark:bg-[#D4AF37] dark:text-[#0B2240]' : 'border border-slate-300 text-[#0B2240] dark:border-slate-600 dark:text-white'}`}>Privacy Policy</Link>
            <Link to={TERMS_PAGE.path} aria-current={page.path === TERMS_PAGE.path ? 'page' : undefined} className={`rounded-full px-4 py-2 ${page.path === TERMS_PAGE.path ? 'bg-[#0B2240] text-white dark:bg-[#D4AF37] dark:text-[#0B2240]' : 'border border-slate-300 text-[#0B2240] dark:border-slate-600 dark:text-white'}`}>Terms of Use</Link>
          </nav>
          <div className="site-card space-y-10 rounded-3xl border border-slate-200 bg-white p-6 dark:border-[#1E3A5F] dark:bg-[#0E1C33] sm:p-10">
            {page.sections.map((section) => <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="policy-section scroll-mt-24 border-b border-slate-200 pb-9 last:border-0 dark:border-[#1E3A5F]">
              <h2 id={`${section.id}-heading`} className="font-display text-xl font-bold text-[#0B2240] dark:text-white">{section.title}</h2>
              {section.paragraphs.map((paragraph, index) => <p key={`${section.id}-${index}`} className="mt-4 max-w-3xl text-sm leading-7 text-[#475569] dark:text-slate-300">{typeof paragraph === 'string' ? paragraph : <>{paragraph.before}<Link to={paragraph.link.href} className="font-semibold text-[#8B1E24] underline underline-offset-4 dark:text-[#FCA5A5]">{paragraph.link.label}</Link>{paragraph.after}</>}</p>)}
            </section>)}
          </div>
          <div className="mt-4 rounded-xl border border-[#D4AF37]/50 bg-[#FFF9EA] p-5 text-sm leading-6 text-[#334155] dark:bg-[#102A43] dark:text-slate-200">
            <p className="font-semibold text-[#0B2240] dark:text-white">Need a correction or have a privacy question?</p>
            <p className="mt-1">Contact the student portal team through the <a href="/support#corrections" className="font-semibold text-[#8B1E24] underline dark:text-[#FCA5A5]">Support Center</a>. For official school matters, contact PCSS directly.</p>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
