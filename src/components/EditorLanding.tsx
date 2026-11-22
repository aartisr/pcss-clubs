import { Link } from 'react-router-dom';
import { useRegistry } from '../context/RegistryContext';
import { editorPath } from '../puck/pageModel';
import { buildCampusPath } from '../middleware/tenantRouting';
import { usePageMetadata } from '../hooks/usePageMetadata';

export function EditorLanding() {
  const { campuses } = useRegistry();
  usePageMetadata({ title: 'Manage pages | Pioneer Clubs', description: 'Choose a page to edit in this browser.', canonicalPath: '/editor', indexable: false });
  const pages = [
    { label: 'Home page', path: editorPath({ kind: 'home' }), publicPath: '/' },
    { label: 'Credits page', path: editorPath({ kind: 'credits' }), publicPath: '/credits' },
    ...campuses.map((campus) => ({ label: campus.name, path: editorPath({ kind: 'campus', campusSlug: campus.slug }), publicPath: buildCampusPath(campus.slug) })),
    { label: 'Club directory', path: '/?manage=manage', publicPath: '/' },
  ];
  return <main className="site-canvas min-h-screen bg-[#F8FAFC] px-4 py-12 dark:bg-[#071120] sm:px-6"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-widest text-[#8B1E24] dark:text-[#FCA5A5]">Pioneer Clubs editor</p><h1 className="mt-2 font-display text-3xl font-bold text-[#0B2240] dark:text-white">Manage pages</h1><p className="mt-3 text-sm leading-6 text-[#475569] dark:text-slate-300">Choose a page to edit. Changes save only in this browser until they are reviewed and deployed.</p><ul className="mt-8 grid gap-3 sm:grid-cols-2">{pages.map((page) => <li key={page.path} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 dark:border-[#1E3A5F] dark:bg-[#0E1C33]"><h2 className="font-display text-lg font-bold text-[#0B2240] dark:text-white">{page.label}</h2><div className="mt-4 flex flex-wrap gap-4"><Link to={page.path} className="font-semibold text-[#8B1E24] underline dark:text-[#FCA5A5]">{page.label === 'Club directory' ? 'Manage directory' : 'Edit page'}</Link><Link to={page.publicPath} className="font-semibold text-[#0B2240] underline dark:text-white">View public page</Link></div></li>)}</ul><Link to="/my" className="mt-8 inline-flex min-h-11 items-center font-semibold text-[#0B2240] underline dark:text-white">Back to My space</Link></div></main>;
}
