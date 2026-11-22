import React, { useState } from 'react';
import type { Config } from '@measured/puck';
import {
  Award,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Megaphone,
  Users,
  Video,
  X,
} from 'lucide-react';
import { GENERATED_IMAGES } from '../data/registry';
import { PioneerImage } from '../components/PioneerImage';
import { ClubHero } from '../components/ClubHero';
import { PortalDirectoryPage } from '../pages/PortalDirectoryPage';
import { CreditsPage } from '../pages/CreditsPage';
import { CREDIT_PAGE_COPY, defaultCreditAreas, type EditableCreditArea, type LegacyContributor } from '../data/credits';
import { usePageScope } from './PageScope';
import { safeContentUrl } from '../shared/safeContentUrl';

export interface DirectoryExperienceProps {
  eyebrow: string;
  title: string;
  description: string;
}

export interface CreditsExperienceProps {
  eyebrow: string;
  title: string;
  description: string;
  contributorsTitle: string;
  contributorsDescription: string;
  heroLinkLabel: string;
  recognitionNote: string;
  suggestionTitle: string;
  suggestionDescription: string;
  suggestionLinkLabel: string;
  suggestionLinkUrl: string;
  sectionEyebrow: string;
  backLinkLabel: string;
  creditAreas: EditableCreditArea[];
  contributors?: LegacyContributor[];
}

export interface TextSectionProps {
  heading: string;
  body: string;
}

function DirectoryExperienceView({ eyebrow, title, description }: DirectoryExperienceProps) {
  const { page } = usePageScope();
  return <PortalDirectoryPage
    forcedCampusSlug={page.kind === 'campus' ? page.campusSlug : undefined}
    eyebrow={eyebrow}
    heading={title}
    introduction={description}
    embedded
  />;
}

function CreditsExperienceView({ eyebrow, title, description, contributorsTitle, contributorsDescription, heroLinkLabel, sectionEyebrow, backLinkLabel, recognitionNote, suggestionTitle, suggestionDescription, suggestionLinkLabel, suggestionLinkUrl, creditAreas, contributors }: CreditsExperienceProps) {
  return <CreditsPage
    eyebrow={eyebrow}
    heading={title}
    introduction={description}
    contributorsTitle={contributorsTitle}
    contributorsDescription={contributorsDescription}
    heroLinkLabel={heroLinkLabel}
    sectionEyebrow={sectionEyebrow}
    backLinkLabel={backLinkLabel}
    recognitionNote={recognitionNote}
    suggestionTitle={suggestionTitle}
    suggestionDescription={suggestionDescription}
    suggestionLinkLabel={suggestionLinkLabel}
    suggestionLinkUrl={suggestionLinkUrl}
    creditAreas={creditAreas}
    contributors={contributors}
    embedded
  />;
}

export interface ClubHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
  layout: 'split' | 'full';
  theme: 'navy' | 'crimson';
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export interface AnnouncementBannerProps {
  label: string;
  message: string;
  variant: 'navy' | 'maroon' | 'gold';
  dismissible: boolean;
}

export interface MeetingScheduleCardProps {
  heading: string;
  days: string;
  time: string;
  room: string;
  campusLocation: string;
  calendarUrl: string;
  virtualLinkUrl: string;
}

export interface RosterMember {
  name: string;
  role: string;
  detail: string;
  email: string;
}

export interface RosterAndLeadershipProps {
  heading: string;
  subheading: string;
  members: RosterMember[];
}

export interface AchievementItem {
  year: string;
  competition: string;
  placement: string;
  notes: string;
}

export interface AchievementsTimelineProps {
  heading: string;
  achievements: AchievementItem[];
}

export interface GalleryPhoto {
  imageUrl: string;
  caption: string;
  credit: string;
}

export interface PhotoGalleryProps {
  heading: string;
  photos: GalleryPhoto[];
}

export interface ResourceLink {
  title: string;
  fileType: string;
  url: string;
}

export interface RichTextAndResourcesProps {
  heading: string;
  body: string;
  resources: ResourceLink[];
}

export type PioneerPuckProps = {
  DirectoryExperience: DirectoryExperienceProps;
  CreditsExperience: CreditsExperienceProps;
  TextSection: TextSectionProps;
  ClubHero: ClubHeroProps;
  AnnouncementBanner: AnnouncementBannerProps;
  MeetingScheduleCard: MeetingScheduleCardProps;
  RosterAndLeadership: RosterAndLeadershipProps;
  AchievementsTimeline: AchievementsTimelineProps;
  PhotoGallery: PhotoGalleryProps;
  RichTextAndResources: RichTextAndResourcesProps;
};

function AnnouncementBannerView({
  label,
  message,
  variant,
  dismissible,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const variantClasses = {
    navy: 'bg-[#0B2240] text-white border-[#1E3A5F]',
    maroon: 'bg-[#8B1E24] text-white border-[#A61C24]',
    gold: 'bg-[#FEF9E7] dark:bg-[#231B07] text-[#1E293B] dark:text-[#FDE68A] border-[#D4AF37]/60',
  }[variant];

  const iconColor =
    variant === 'gold' ? 'text-[#8B1E24] dark:text-[#FCD34D]' : 'text-[#D4AF37]';

  return (
    <div className={`border-b ${variantClasses}`}>
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Megaphone className={`w-4 h-4 shrink-0 ${iconColor}`} aria-hidden="true" />
          <p className="text-sm leading-snug">
            <span className="font-display font-semibold mr-2">{label}:</span>
            <span
              className={
                variant === 'gold'
                  ? 'text-[#1E293B] dark:text-[#FEF3C7]'
                  : 'text-white/90'
              }
            >
              {message}
            </span>
          </p>
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss announcement"
            className="p-1.5 rounded-md hover:bg-black/10 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export const puckConfig: Config<PioneerPuckProps> = {
  categories: {
    portal: {
      title: 'Portal Pages',
      components: ['DirectoryExperience', 'CreditsExperience', 'TextSection'],
    },
    hero: {
      title: 'Header & Notices',
      components: ['ClubHero', 'AnnouncementBanner'],
    },
    operations: {
      title: 'Schedule & People',
      components: ['MeetingScheduleCard', 'RosterAndLeadership'],
    },
    content: {
      title: 'Honors, Media & Charter',
      components: ['AchievementsTimeline', 'PhotoGallery', 'RichTextAndResources'],
    },
  },
  components: {
    DirectoryExperience: {
      label: 'Club Directory & Campus Hub',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Page Heading' },
        description: { type: 'textarea', label: 'Introduction' },
      },
      defaultProps: {
        eyebrow: 'Pioneer Charter School of Science',
        title: 'Student Organizations Across Every Pioneer Campus',
        description: 'Find student clubs and activities across Pioneer campuses.',
      },
      render: (props) => <DirectoryExperienceView {...props} />,
    },
    CreditsExperience: {
      label: 'Credits & Contributors',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Page Heading' },
        description: { type: 'textarea', label: 'Introduction' },
        contributorsTitle: { type: 'text', label: 'Contributors Heading' },
        contributorsDescription: { type: 'textarea', label: 'Contributors Introduction' },
        heroLinkLabel: { type: 'text', label: 'Jump Link Label' },
        sectionEyebrow: { type: 'text', label: 'Contributors Eyebrow' },
        backLinkLabel: { type: 'text', label: 'Back to Clubs Label' },
        recognitionNote: { type: 'textarea', label: 'Note Below Contribution Areas' },
        suggestionTitle: { type: 'text', label: 'Correction Card Heading' },
        suggestionDescription: { type: 'textarea', label: 'Correction Card Text' },
        suggestionLinkLabel: { type: 'text', label: 'Correction Link Label' },
        suggestionLinkUrl: { type: 'text', label: 'Correction Link URL' },
        creditAreas: {
          type: 'array',
          label: 'Contribution Areas',
          getItemSummary: (area) => area.title || 'Untitled area',
          arrayFields: {
            title: { type: 'text', label: 'Area Heading' },
            description: { type: 'textarea', label: 'What This Area Recognizes' },
            people: {
              type: 'array',
              label: 'People in This Area',
              getItemSummary: (person) => person.name || 'New contributor',
              arrayFields: {
                name: { type: 'text', label: 'Full Name' },
                role: { type: 'text', label: 'Role' },
                contribution: { type: 'textarea', label: 'Specific Contribution' },
                url: { type: 'text', label: 'Website URL (optional)' },
                schoolName: { type: 'text', label: 'School Name (optional)' },
                schoolUrl: { type: 'text', label: 'School URL (optional)' },
              },
              defaultItemProps: { name: '', role: '', contribution: '', url: '', schoolName: '', schoolUrl: '' },
            },
          },
          defaultItemProps: { title: 'New contribution area', description: '', people: [] },
          min: 1,
        },
      },
      defaultProps: {
        ...CREDIT_PAGE_COPY,
        creditAreas: defaultCreditAreas(),
      },
      render: (props) => <CreditsExperienceView {...props} />,
    },
    TextSection: {
      label: 'Text Section',
      fields: {
        heading: { type: 'text', label: 'Heading' },
        body: { type: 'textarea', label: 'Body' },
      },
      defaultProps: { heading: 'New section', body: 'Add your content here.' },
      render: ({ heading, body }) => (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="font-display text-2xl font-bold text-[#0B2240] dark:text-white">{heading}</h2>
          <p className="mt-4 text-[#475569] dark:text-slate-300 whitespace-pre-line">{body}</p>
        </section>
      ),
    },
    ClubHero: {
      label: 'Club Hero Banner',
      fields: {
        eyebrow: { type: 'text', label: 'Campus & Discipline Eyebrow' },
        title: { type: 'text', label: 'Club Title' },
        subtitle: { type: 'textarea', label: 'Mission Summary' },
        backgroundImage: { type: 'text', label: 'Hero Image URL' },
        layout: {
          type: 'radio',
          label: 'Layout Style',
          options: [
            { label: 'Split Editorial', value: 'split' },
            { label: 'Full-Width Banner', value: 'full' },
          ],
        },
        theme: {
          type: 'radio',
          label: 'Campus Accent',
          options: [
            { label: 'PCSS Navy (#0B2240)', value: 'navy' },
            { label: 'PCSS Crimson (#8B1E24)', value: 'crimson' },
          ],
        },
        primaryCtaLabel: { type: 'text', label: 'Primary Button Label' },
        primaryCtaHref: { type: 'text', label: 'Primary Button Link' },
        secondaryCtaLabel: { type: 'text', label: 'Secondary Button Label' },
        secondaryCtaHref: { type: 'text', label: 'Secondary Button Link' },
      },
      defaultProps: {
        eyebrow: 'School · Category',
        title: 'Club Name',
        subtitle: 'Describe this club.',
        backgroundImage: GENERATED_IMAGES.campusHero,
        layout: 'split',
        theme: 'navy',
        primaryCtaLabel: 'Meeting Details',
        primaryCtaHref: '#schedule',
        secondaryCtaLabel: 'Browse Clubs',
        secondaryCtaHref: '/',
      },
      render: (props) => <ClubHero {...props} />,
    },

    AnnouncementBanner: {
      label: 'Announcement Banner',
      fields: {
        label: { type: 'text', label: 'Notice Label' },
        message: { type: 'textarea', label: 'Announcement Message' },
        variant: {
          type: 'select',
          label: 'Banner Theme',
          options: [
            { label: 'Pioneer Navy', value: 'navy' },
            { label: 'Pioneer Maroon', value: 'maroon' },
            { label: 'Academic Gold', value: 'gold' },
          ],
        },
        dismissible: {
          type: 'radio',
          label: 'Allow Dismiss',
          options: [
            { label: 'Yes', value: true },
            { label: 'Pinned (No Dismiss)', value: false },
          ],
        },
      },
      defaultProps: {
        label: 'Announcement',
        message: 'Add a current announcement.',
        variant: 'gold',
        dismissible: true,
      },
      render: (props) => <AnnouncementBannerView {...props} />,
    },

    MeetingScheduleCard: {
      label: 'Meeting Schedule Card',
      fields: {
        heading: { type: 'text', label: 'Section Heading' },
        days: { type: 'text', label: 'Meeting Days' },
        time: { type: 'text', label: 'Meeting Time' },
        room: { type: 'text', label: 'Room / Lab' },
        campusLocation: { type: 'text', label: 'Campus Address' },
        calendarUrl: { type: 'text', label: 'Google Calendar URL' },
        virtualLinkUrl: { type: 'text', label: 'Zoom / Google Meet URL' },
      },
      defaultProps: {
        heading: 'Weekly Schedule & Room Logistics',
        days: '',
        time: '',
        room: '',
        campusLocation: '',
        calendarUrl: '',
        virtualLinkUrl: '',
      },
      render: ({
        heading,
        days,
        time,
        room,
        campusLocation,
        calendarUrl,
        virtualLinkUrl,
      }) => (
        <section id="schedule" className="max-w-6xl mx-auto px-6 py-10">
          <div className="site-card bg-white dark:bg-[#0E1C33] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B2240] dark:text-white">
                  {heading}
                </h2>
                <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
                  {campusLocation}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {safeContentUrl(calendarUrl) && (
                  <a
                    href={safeContentUrl(calendarUrl)!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B2240] dark:bg-[#8B1E24] text-white hover:bg-[#102A43] dark:hover:bg-[#A61C24] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add to Calendar</span>
                  </a>
                )}
                {safeContentUrl(virtualLinkUrl) && (
                  <a
                    href={safeContentUrl(virtualLinkUrl)!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-[#E2E8F0] dark:border-[#1E3A5F] text-[#1E293B] dark:text-slate-100 hover:bg-[#F8FAFC] dark:hover:bg-[#162947] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Video className="w-3.5 h-3.5 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" />
                    <span>Virtual Room Link</span>
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" />
                  <span>Meeting Days</span>
                </div>
                <p className="font-display text-base font-semibold text-[#1E293B] dark:text-white">
                  {days}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" />
                  <span>Session Hours</span>
                </div>
                <p className="font-mono text-base font-medium text-[#1E293B] dark:text-white tabular-nums">
                  {time}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" />
                  <span>Assigned Room</span>
                </div>
                <p className="font-display text-base font-semibold text-[#1E293B] dark:text-white">
                  {room}
                </p>
              </div>
            </div>
          </div>
        </section>
      ),
    },

    RosterAndLeadership: {
      label: 'Roster & Leadership',
      fields: {
        heading: { type: 'text', label: 'Section Heading' },
        subheading: { type: 'textarea', label: 'Description' },
        members: {
          type: 'array',
          label: 'Advisors & Student Officers',
          arrayFields: {
            name: { type: 'text', label: 'Full Name' },
            role: { type: 'text', label: 'Role / Title' },
            detail: { type: 'text', label: 'Department or Grade' },
            email: { type: 'text', label: 'Contact Email' },
          },
          defaultItemProps: {
            name: 'Member name',
            role: 'Role',
            detail: '',
            email: '',
          },
        },
      },
      defaultProps: {
        heading: 'Faculty Advisors & Student Leadership',
        subheading: 'Meet the people who support this club.',
        members: [],
      },
      render: ({ heading, subheading, members }) => (
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8B1E24] dark:text-[#FCA5A5] mb-1">
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>Leadership Directory</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0B2240] dark:text-white">
              {heading}
            </h2>
            {subheading && (
              <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {subheading}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {members.map((member, index) => (
              <div
                key={`${member.name}-${index}`}
                className="site-card site-card-interactive bg-white dark:bg-[#0E1C33] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-[#8B1E24] dark:text-[#FCA5A5]">
                    {member.role}
                  </p>
                  <h3 className="font-display text-lg font-bold text-[#0B2240] dark:text-white mt-1">
                    {member.name}
                  </h3>
                  <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
                    {member.detail}
                  </p>
                </div>
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="mt-5 pt-4 border-t border-[#E2E8F0] dark:border-[#1E3A5F] inline-flex items-center gap-2 text-xs font-medium text-[#1E3A5F] dark:text-[#93C5FD] hover:text-[#8B1E24] dark:hover:text-[#FCA5A5] transition-colors truncate"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{member.email}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      ),
    },

    AchievementsTimeline: {
      label: 'Achievements Timeline',
      fields: {
        heading: { type: 'text', label: 'Section Heading' },
        achievements: {
          type: 'array',
          label: 'Awards & Milestones',
          arrayFields: {
            year: { type: 'text', label: 'Academic Year' },
            competition: { type: 'text', label: 'Tournament / Event' },
            placement: { type: 'text', label: 'Honor / Placement' },
            notes: { type: 'textarea', label: 'Details' },
          },
          defaultItemProps: {
            year: '',
            competition: 'Event name',
            placement: '',
            notes: '',
          },
        },
      },
      defaultProps: {
        heading: 'Recent Honors & Competition Milestones',
        achievements: [],
      },
      render: ({ heading, achievements }) => (
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8B1E24] dark:text-[#FCA5A5] mb-1">
              <Award className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Honors Archive</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0B2240] dark:text-white">
              {heading}
            </h2>
          </div>

          <div className="site-card bg-white dark:bg-[#0E1C33] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F]">
            {achievements.map((item, idx) => (
              <div
                key={`${item.year}-${idx}`}
                className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline"
              >
                <div className="md:col-span-2">
                  <span className="font-mono text-sm font-semibold text-[#8B1E24] dark:text-[#FCA5A5] tabular-nums">
                    {item.year}
                  </span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="font-display text-base font-bold text-[#0B2240] dark:text-white">
                    {item.competition}
                  </h3>
                  <p className="text-xs font-medium text-[#1E3A5F] dark:text-[#93C5FD] mt-0.5">
                    {item.placement}
                  </p>
                </div>
                <div className="md:col-span-6">
                  <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                    {item.notes}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ),
    },

    PhotoGallery: {
      label: 'Photo Gallery',
      fields: {
        heading: { type: 'text', label: 'Gallery Heading' },
        photos: {
          type: 'array',
          label: 'Gallery Items',
          arrayFields: {
            imageUrl: { type: 'text', label: 'Photo URL' },
            caption: { type: 'text', label: 'Caption' },
            credit: { type: 'text', label: 'Photo Credit' },
          },
          defaultItemProps: {
            imageUrl: '',
            caption: 'Photo caption',
            credit: '',
          },
        },
      },
      defaultProps: {
        heading: 'Workshop & Competition Archive',
        photos: [],
      },
      render: ({ heading, photos }) => (
        <section className="max-w-6xl mx-auto px-6 py-10">
          <h2 className="font-display text-2xl font-bold text-[#0B2240] dark:text-white mb-6">
            {heading}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {photos.map((photo, idx) => (
              <figure
                key={`${photo.caption}-${idx}`}
                className="site-card site-card-interactive bg-white dark:bg-[#0E1C33] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl overflow-hidden"
              >
                <div className="aspect-[16/10] bg-[#102A43] overflow-hidden">
                  <PioneerImage
                    src={photo.imageUrl}
                    alt={photo.caption}
                    fallbackTitle={photo.caption}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="p-4 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm text-[#1E293B] dark:text-slate-100">
                    {photo.caption}
                  </span>
                  {photo.credit && (
                    <span className="text-xs text-[#64748B] dark:text-slate-400 break-words">
                      {photo.credit}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ),
    },

    RichTextAndResources: {
      label: 'Charter & Resources',
      fields: {
        heading: { type: 'text', label: 'Section Heading' },
        body: { type: 'textarea', label: 'Editorial Body Copy' },
        resources: {
          type: 'array',
          label: 'Downloadable Forms & Guides',
          arrayFields: {
            title: { type: 'text', label: 'Document Title' },
            fileType: { type: 'text', label: 'Format & Size' },
            url: { type: 'text', label: 'Document Link' },
          },
          defaultItemProps: {
            title: 'Resource title',
            fileType: '',
            url: '',
          },
        },
      },
      defaultProps: {
        heading: 'Charter, Syllabus & Permission Packets',
        body: 'Add club resources and useful information here.',
        resources: [],
      },
      render: ({ heading, body, resources }) => (
        <section id="resources" className="max-w-6xl mx-auto px-6 py-10 pb-16">
          <div className="site-card grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-[#0E1C33] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-6 sm:p-8">
            <div className="lg:col-span-7">
              <h2 className="font-display text-2xl font-bold text-[#0B2240] dark:text-white mb-3">
                {heading}
              </h2>
              <p className="text-[15px] text-[#334155] dark:text-slate-300 leading-[1.7] max-w-prose">
                {body}
              </p>
            </div>
            <div className="lg:col-span-5 lg:border-l lg:border-[#E2E8F0] dark:lg:border-[#1E3A5F] lg:pl-8">
              <h3 className="font-display text-sm font-semibold text-[#0B2240] dark:text-white mb-3">
                Documents & Forms
              </h3>
              <ul className="divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F]">
                {resources.filter((res) => safeContentUrl(res.url)).map((res, idx) => (
                  <li key={`${res.title}-${idx}`} className="py-3 first:pt-0 last:pb-0">
                    <a
                      href={safeContentUrl(res.url)!}
                      className="group flex items-start justify-between gap-3 text-sm hover:text-[#8B1E24] dark:hover:text-[#FCA5A5] transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <FileText
                          className="w-4 h-4 text-[#8B1E24] dark:text-[#FCA5A5] mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-[#1E293B] dark:text-slate-100 group-hover:text-[#8B1E24] dark:group-hover:text-[#FCA5A5] transition-colors">
                            {res.title}
                          </p>
                          <p className="text-xs font-mono text-[#64748B] dark:text-slate-400 mt-0.5">
                            {res.fileType}
                          </p>
                        </div>
                      </div>
                      <ExternalLink
                        className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 group-hover:text-[#8B1E24] dark:group-hover:text-[#FCA5A5] shrink-0 mt-1"
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ),
    },
  },
};
