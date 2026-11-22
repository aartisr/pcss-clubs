import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PioneerImage } from './PioneerImage';
import { safeContentUrl } from '../shared/safeContentUrl';

export interface ClubHeroCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface ClubHeroProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  backgroundImage?: string;
  layout?: 'split' | 'full';
  theme?: 'navy' | 'crimson';
  primaryCta?: ClubHeroCta;
  secondaryCta?: ClubHeroCta;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  children?: React.ReactNode;
}

function renderAction(
  cta: ClubHeroCta,
  className: string,
  withArrow: boolean
): React.ReactNode {
  const content = (
    <>
      <span>{cta.label}</span>
      {withArrow && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
    </>
  );

  if (cta.onClick && !cta.href) {
    return (
      <button type="button" onClick={cta.onClick} className={className}>
        {content}
      </button>
    );
  }

  const href = safeContentUrl(cta.href || '#', true);
  if (!href) return null;
  if (href.startsWith('/')) {
    return (
      <Link to={href} onClick={cta.onClick} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} onClick={cta.onClick} className={className}>
      {content}
    </a>
  );
}

export function ClubHero({
  title,
  subtitle,
  eyebrow,
  backgroundImage,
  layout = 'split',
  theme = 'navy',
  primaryCta,
  secondaryCta,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  children,
}: ClubHeroProps) {
  const resolvedPrimary: ClubHeroCta | undefined =
    primaryCta ??
    (primaryCtaLabel
      ? { label: primaryCtaLabel, href: primaryCtaHref || '#' }
      : undefined);

  const resolvedSecondary: ClubHeroCta | undefined =
    secondaryCta ??
    (secondaryCtaLabel
      ? { label: secondaryCtaLabel, href: secondaryCtaHref || '#' }
      : undefined);

  const isCrimson = theme === 'crimson';
  const bgSurface = isCrimson ? 'bg-[#8B1E24]' : 'bg-[#0B2240]';
  const imageWellSurface = isCrimson ? 'bg-[#6F161B]' : 'bg-[#102A43]';
  const fullOverlayScrim = isCrimson
    ? 'bg-gradient-to-t from-[#8B1E24]/95 via-[#8B1E24]/80 to-[#8B1E24]/60'
    : 'bg-gradient-to-t from-[#0B2240]/95 via-[#0B2240]/75 to-[#0B2240]/55';

  const primaryButtonClass = isCrimson
    ? 'site-action inline-flex max-w-full items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-center break-words bg-white text-[#8B1E24] hover:bg-slate-100 transition-colors'
    : 'site-action inline-flex max-w-full items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-center break-words bg-[#A61C24] text-white hover:bg-[#8B1E24] transition-colors';

  const secondaryButtonClass =
    'site-action inline-flex max-w-full items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-center break-words border border-white/30 text-white hover:bg-white/10 transition-colors';

  if (layout === 'full') {
    return (
      <section className={`site-hero relative overflow-hidden ${bgSurface} text-white`}>
        {backgroundImage && (
          <div className="absolute inset-0">
            <PioneerImage
              src={backgroundImage}
              alt={title}
              fallbackTitle={title}
              priority
              className="w-full h-full object-cover opacity-35"
            />
            <div className={`absolute inset-0 ${fullOverlayScrim}`} />
          </div>
        )}

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          {eyebrow && (
            <p className="text-xs font-medium tracking-wide text-[#D4AF37] mb-3">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-3xl text-balance leading-[1.12]">
            {title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
            {subtitle}
          </p>

          {(resolvedPrimary || resolvedSecondary) && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {resolvedPrimary && renderAction(resolvedPrimary, primaryButtonClass, true)}
              {resolvedSecondary &&
                renderAction(resolvedSecondary, secondaryButtonClass, false)}
            </div>
          )}

          {children}
        </div>
      </section>
    );
  }

  return (
    <section className={`site-hero ${bgSurface} text-white border-b border-white/10`}>
      <div className="max-w-6xl mx-auto px-6 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div
          className={`${
            backgroundImage ? 'lg:col-span-7' : 'lg:col-span-10'
          } flex flex-col justify-center`}
        >
          {eyebrow && (
            <p className="text-xs font-medium tracking-wide text-[#D4AF37] mb-3">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-balance leading-[1.12]">
            {title}
          </h1>
          <p className="mt-4 text-base text-slate-200 max-w-xl leading-relaxed">
            {subtitle}
          </p>

          {(resolvedPrimary || resolvedSecondary) && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {resolvedPrimary && renderAction(resolvedPrimary, primaryButtonClass, true)}
              {resolvedSecondary &&
                renderAction(resolvedSecondary, secondaryButtonClass, false)}
            </div>
          )}

          {children}
        </div>

        {backgroundImage && (
          <div className="lg:col-span-5">
            <div
              className={`h-64 lg:h-full min-h-[260px] rounded-xl overflow-hidden border border-white/15 ${imageWellSurface}`}
            >
              <PioneerImage
                src={backgroundImage}
                alt={title}
                fallbackTitle={title}
                priority
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
