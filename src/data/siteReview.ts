export type SiteReviewMode = 'off' | 'approval' | 'development' | 'both';

export const DEFAULT_SITE_REVIEW_MODE: SiteReviewMode = 'both';

export function parseSiteReviewMode(value: string | undefined): SiteReviewMode {
  const normalized = value?.trim().toLowerCase();
  switch (normalized) {
    case 'off':
    case 'approval':
    case 'development':
    case 'both':
      return normalized;
    default:
      return DEFAULT_SITE_REVIEW_MODE;
  }
}

export function siteReviewCopy(mode: SiteReviewMode) {
  if (mode === 'off') return null;
  const labels = [
    ...(mode === 'approval' || mode === 'both' ? ['To Be Approved'] : []),
    ...(mode === 'development' || mode === 'both' ? ['In Development'] : []),
  ];
  const description = mode === 'both'
    ? 'This student-run portal is being developed and is awaiting school administration approval.'
    : mode === 'approval'
      ? 'This student-run portal is awaiting school administration approval.'
      : 'This student-run portal is still being developed. Information may change.';
  return { labels, description, watermark: labels.join(' · ') };
}

// One deployment setting controls the public status across all routes.
// Keep it on until the relevant review and development steps are complete.
export const SITE_REVIEW_MODE = parseSiteReviewMode(import.meta.env?.VITE_SITE_REVIEW_STATUS);
