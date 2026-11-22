import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_REVIEW_MODE, siteReviewCopy, type SiteReviewMode } from '../data/siteReview';

interface SiteReviewNoticeProps {
  mode?: SiteReviewMode;
}

export function SiteReviewNotice({ mode = SITE_REVIEW_MODE }: SiteReviewNoticeProps) {
  const copy = siteReviewCopy(mode);
  if (!copy) return null;

  return (
    <aside aria-label="Project status" data-watermark={copy.watermark} className="site-review-notice relative overflow-hidden border-b border-[#D9E3EF] bg-[#EDF3F8] text-[#29415C] dark:border-[#25415C] dark:bg-[#102339] dark:text-slate-200">
      <div className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-xs leading-5 sm:px-6">
        <div className="flex flex-wrap gap-1.5" aria-label="Current review stages">
          {copy.labels.map((label) => <span key={label} className="rounded-full border border-[#A5BACD] bg-white/80 px-2.5 py-0.5 font-bold text-[#0B2240] dark:border-[#46627E] dark:bg-[#1C3651] dark:text-white">{label}</span>)}
        </div>
        <p className="max-w-2xl flex-1 basis-64 font-medium">{copy.description}</p>
        <Link to="/credits" className="font-bold text-[#0B2240] underline decoration-[#8B1E24]/50 underline-offset-4 hover:decoration-[#8B1E24] dark:text-[#F7D46B]">About this project</Link>
      </div>
    </aside>
  );
}

export function SiteReviewFooterMark({ mode = SITE_REVIEW_MODE }: SiteReviewNoticeProps) {
  const copy = siteReviewCopy(mode);
  if (!copy) return null;
  return <p className="mt-5 text-xs leading-5 text-slate-300">Student-run portal · {copy.labels.join(' · ')}</p>;
}
