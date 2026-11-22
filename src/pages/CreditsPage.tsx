import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, ExternalLink, GraduationCap, School, ShieldCheck, UsersRound } from 'lucide-react';
import { SiteShell } from '../components/SiteShell';
import { areasFromLegacyContributors, CREDIT_PAGE_COPY, defaultCreditAreas, safeCreditUrl, STUDENT_WEB_ADMIN_CREDITS_ANCHOR, STUDENT_WEB_ADMIN_NAME, type Credit, type CreditGroup, type EditableCreditArea, type LegacyContributor } from '../data/credits';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { usePageScope } from '../puck/PageScope';

interface CreditsPageProps {
  eyebrow?: string;
  heading?: string;
  introduction?: string;
  contributorsTitle?: string;
  contributorsDescription?: string;
  heroLinkLabel?: string;
  sectionEyebrow?: string;
  backLinkLabel?: string;
  recognitionNote?: string;
  suggestionTitle?: string;
  suggestionDescription?: string;
  suggestionLinkLabel?: string;
  suggestionLinkUrl?: string;
  embedded?: boolean;
  creditAreas?: EditableCreditArea[];
  contributors?: LegacyContributor[];
}

const areaIcons = [UsersRound, GraduationCap, ShieldCheck, School, Camera];

function CreditName({ person }: { person: Credit }) {
  const href = person.url ? safeCreditUrl(person.url) : null;
  const external = href?.startsWith('http') ?? false;
  return href
    ? <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[#8B1E24]">{person.name}{external && <><ExternalLink className="ml-1 inline-block h-3 w-3 align-baseline opacity-60" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></>}</a>
    : <>{person.name}</>;
}

function CreditDetails({ person }: { person: Credit }) {
  const schoolHref = person.school ? safeCreditUrl(person.school.url) : null;
  const externalSchool = schoolHref?.startsWith('http') ?? false;
  return <>
    <p className="break-words font-display text-base font-semibold text-[#0B2240] dark:text-white"><CreditName person={person} /></p>
    {person.role && <p className="mt-1 text-xs font-medium text-[#8B1E24] dark:text-[#FCA5A5]">{person.role}</p>}
    {person.contribution && <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">{person.contribution}</p>}
    {person.school && <p className="mt-2 text-xs text-[#64748B] dark:text-slate-300">School: {schoolHref ? <a href={schoolHref} target={externalSchool ? '_blank' : undefined} rel={externalSchool ? 'noopener noreferrer' : undefined} className="font-semibold underline-offset-4 hover:underline">{person.school.name}{externalSchool && <><ExternalLink className="ml-1 inline-block h-3 w-3 align-baseline opacity-60" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></>}</a> : person.school.name}</p>}
  </>;
}

export function CreditsPage({ eyebrow, heading, introduction, contributorsTitle, contributorsDescription, heroLinkLabel, sectionEyebrow, backLinkLabel, recognitionNote, suggestionTitle, suggestionDescription, suggestionLinkLabel, suggestionLinkUrl, creditAreas, contributors, embedded = false }: CreditsPageProps) {
  const { isEditing } = usePageScope();
  const editableAreas = creditAreas ?? (contributors ? areasFromLegacyContributors(contributors) : defaultCreditAreas());
  const groups: CreditGroup[] = editableAreas.map((area) => ({
    title: area.title || 'Untitled contribution area',
    description: area.description,
    people: area.people.filter((person) => person.name?.trim()).map((person) => ({
      name: person.name.trim(), role: person.role, contribution: person.contribution, url: person.url,
      school: person.schoolName ? { name: person.schoolName, url: person.schoolUrl } : undefined,
    })),
  }));
  const orbitPositions = ['left-0 top-5', 'right-0 top-14', 'bottom-9 left-0', 'bottom-2 right-0'];
  const correctionUrl = safeCreditUrl(suggestionLinkUrl || '') || CREDIT_PAGE_COPY.suggestionLinkUrl;

  usePageMetadata({
    enabled: !isEditing,
    title: 'Credits & Contributors | Pioneer Clubs',
    description: 'Meet the people whose work supports Pioneer Clubs, from its student beginnings to future club, mentor, IT, and school contributors.',
    canonicalPath: '/credits', indexable: true,
  });

  const content = <main className="flex-1">
      <section className="site-hero relative overflow-hidden bg-[#0B2240] text-white">
        <div className="absolute -right-32 -top-36 h-[34rem] w-[34rem] rounded-full border border-white/10" aria-hidden="true" />
        <div className="absolute -right-16 -top-20 h-[27rem] w-[27rem] rounded-full border border-[#D4AF37]/20" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-[minmax(0,1fr)_320px] md:py-28">
          <div>
            <p className="site-kicker text-xs font-bold text-[#F7D46B]">{eyebrow || CREDIT_PAGE_COPY.eyebrow}</p>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">{heading || CREDIT_PAGE_COPY.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">{introduction || CREDIT_PAGE_COPY.description}</p>
            <a href="#contribution-areas" className="site-action mt-8 inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]">{heroLinkLabel || CREDIT_PAGE_COPY.heroLinkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
          </div>
          <div className="relative hidden h-72 w-72 items-center justify-center justify-self-center md:flex" aria-hidden="true">
            <div className="absolute inset-5 rounded-full border border-[#D4AF37]/50" />
            <div className="absolute inset-12 rounded-full border border-dashed border-white/25" />
            <img src="/brand-mark.svg" alt="" className="h-20 w-20" />
            {groups.slice(0, 4).map((group, index) => <span key={`${group.title}-${index}`} className={`absolute max-w-32 truncate rounded-full border border-white/20 bg-[#102A43] px-3 py-1.5 text-xs font-semibold ${orbitPositions[index]}`}>{group.title}</span>)}
          </div>
        </div>
      </section>

      <section id="contribution-areas" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-14 sm:py-20" aria-labelledby="credits-heading">
        <div className="max-w-3xl">
          <p className="site-kicker text-xs font-bold text-[#8B1E24] dark:text-[#FCA5A5]">{sectionEyebrow ?? CREDIT_PAGE_COPY.sectionEyebrow}</p>
          <h2 id="credits-heading" className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0B2240] dark:text-white sm:text-4xl">{contributorsTitle || CREDIT_PAGE_COPY.contributorsTitle}</h2>
          <p className="mt-4 text-base leading-7 text-[#475569] dark:text-slate-300">{contributorsDescription || CREDIT_PAGE_COPY.contributorsDescription}</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {groups.map((group, index) => {
            const Icon = areaIcons[index % areaIcons.length];
            return <section key={`${group.title}-${index}`} aria-labelledby={`credit-area-${index}`} className={`site-card site-card-interactive rounded-3xl border border-[#E2E8F0] bg-white p-6 dark:border-[#1E3A5F] dark:bg-[#0E1C33] sm:p-8 ${groups.length % 2 === 1 && index === groups.length - 1 ? 'md:col-span-2' : ''}`}>
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4D7] text-[#8B1E24] dark:bg-[#26364A] dark:text-[#F7D46B]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <div><h3 id={`credit-area-${index}`} className="font-display text-lg font-bold text-[#0B2240] dark:text-white">{group.title}</h3><p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">{group.description}</p></div>
              </div>
              {group.people.length > 0 && <ul className="mt-5 divide-y divide-[#E2E8F0] border-t border-[#E2E8F0] dark:divide-[#1E3A5F] dark:border-[#1E3A5F]">
                {group.people.map((person, personIndex) => <li key={`${person.name}-${personIndex}`} id={person.name === STUDENT_WEB_ADMIN_NAME ? STUDENT_WEB_ADMIN_CREDITS_ANCHOR : undefined} className="scroll-mt-24 py-4 last:pb-0"><CreditDetails person={person} /></li>)}
              </ul>}
            </section>;
          })}
        </div>
        {recognitionNote !== '' && <p className="mt-5 text-sm leading-6 text-[#64748B] dark:text-slate-300">{recognitionNote ?? CREDIT_PAGE_COPY.recognitionNote}</p>}

        <div className="site-card mt-14 flex flex-col gap-4 rounded-3xl border border-[#DCE5F0] bg-[#EAF0F7] p-6 dark:border-[#1E3A5F] dark:bg-[#102A43] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div><h2 className="font-display text-xl font-bold text-[#0B2240] dark:text-white">{suggestionTitle ?? CREDIT_PAGE_COPY.suggestionTitle}</h2><p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-300">{suggestionDescription ?? CREDIT_PAGE_COPY.suggestionDescription}</p></div>
          <a href={correctionUrl} className="site-action inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B2240] px-5 py-3 text-sm font-semibold text-white hover:bg-[#102A43] dark:bg-[#8B1E24] dark:hover:bg-[#A61C24]">{suggestionLinkLabel ?? CREDIT_PAGE_COPY.suggestionLinkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
        </div>
        <Link to="/" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[#8B1E24] underline-offset-4 hover:underline dark:text-[#FCA5A5]">{backLinkLabel ?? CREDIT_PAGE_COPY.backLinkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </section>
  </main>;
  return embedded ? content : <SiteShell>{content}</SiteShell>;
}
