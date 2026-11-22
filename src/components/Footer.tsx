import React from 'react';
import { Link } from 'react-router-dom';
import { useRegistry } from '../context/RegistryContext';
import { buildCampusPath } from '../middleware/tenantRouting';
import { BrandLockup } from './BrandLockup';
import { BlueRibbonRecognition } from './BlueRibbonRecognition';
import { SiteReviewFooterMark } from './SiteReviewNotice';

export function Footer() {
  const { campuses } = useRegistry();

  return (
    <footer className="site-hero mt-auto border-t border-[#D4AF37]/20 bg-[#0B2240] text-slate-300 dark:bg-[#050D1A]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:py-16">
        <div>
          <Link to="/" aria-label="Pioneer Clubs home"><BrandLockup /></Link>
          <p className="mt-3 max-w-sm text-sm leading-6">A place to discover student clubs across Pioneer campuses.</p>
          <div className="mt-5 border-l-2 border-[#D4AF37] pl-3"><BlueRibbonRecognition compact /></div>
          <SiteReviewFooterMark />
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Campuses</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {campuses.map((campus) => <li key={campus.id}><Link to={buildCampusPath(campus.slug)} className="hover:text-white hover:underline">{campus.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">More</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white hover:underline">Club directory</Link></li>
            <li><Link to="/credits" className="hover:text-white hover:underline">Credits</Link></li>
            <li><Link to="/support" className="hover:text-white hover:underline">Support Center</Link></li>
            <li><Link to="/privacy" className="hover:text-white hover:underline">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white hover:underline">Terms of Use</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400 sm:px-6">© {new Date().getFullYear()} Pioneer Clubs · A student-led project for PCSS</div>
    </footer>
  );
}
