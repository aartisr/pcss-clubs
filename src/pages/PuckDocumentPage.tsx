import React from 'react';
import { Link } from 'react-router-dom';
import { useRegistry } from '../context/RegistryContext';
import { SiteShell } from '../components/SiteShell';
import { PublicPageRenderer } from '../puck/PublicPageRenderer';
import { PageScope } from '../puck/PageScope';
import { pageExists, type PageReference } from '../puck/pageModel';

export function PuckDocumentPage({ page }: { page: PageReference }) {
  const { campuses, clubs, getPageLayout } = useRegistry();
  if (!pageExists(page, campuses, clubs)) {
    return <SiteShell><main className="flex-1 mx-auto w-full max-w-3xl px-6 py-20"><section className="site-card rounded-3xl border border-slate-200 bg-white p-8 dark:border-[#1E3A5F] dark:bg-[#0E1C33]"><h1 className="font-display text-3xl font-bold text-[#0B2240] dark:text-white">We couldn't find this page</h1><p className="mt-3 text-sm text-[#475569] dark:text-slate-300">The link may be outdated. You can explore all clubs from the directory.</p><Link to="/" className="site-action mt-6 inline-flex rounded-xl bg-[#0B2240] px-5 py-2.5 text-sm font-semibold text-white dark:bg-[#8B1E24]">Browse clubs</Link></section></main></SiteShell>;
  }
  const data = getPageLayout(page);
  return (
    <PageScope page={page}>
      <SiteShell activeCampusSlug={page.kind === 'campus' ? page.campusSlug : undefined}>
        <PublicPageRenderer data={data} />
      </SiteShell>
    </PageScope>
  );
}
