import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { CREDIT_PAGE_COPY, safeCreditUrl, STUDENT_WEB_ADMIN_CREDITS_ANCHOR, STUDENT_WEB_ADMIN_NAME, type EditableCreditArea } from '../src/data/credits';
import { INITIAL_CAMPUSES, INITIAL_CLUBS, type Campus, type Club } from '../src/data/registry';
import { PUBLIC_CONTENT_VERIFIED } from '../src/data/publication';
import { parseSiteReviewMode, siteReviewCopy } from '../src/data/siteReview';
import { PRIVACY_PAGE, TERMS_PAGE, type LegalParagraph } from '../src/data/legalPages';
import { SUPPORT_TOPICS } from '../src/data/supportCenter';
import { createDefaultPageData, pagePath } from '../src/puck/pageModel';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewCopy = siteReviewCopy(parseSiteReviewMode(loadEnv('production', projectRoot, 'VITE_').VITE_SITE_REVIEW_STATUS));
const dist = path.join(projectRoot, 'dist');
const site = 'https://pcssclubs.org';
const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(dist, 'credits/index.html'), 'utf8');

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function replaceRequired(html: string, pattern: RegExp | string, replacement: string): string {
  if (!html.match(pattern)) throw new Error(`Expected HTML marker was not found: ${pattern}`);
  return html.replace(pattern, replacement);
}

function decorate(
  template: string,
  options: {
    title: string;
    description: string;
    url: string;
    content: string;
    structuredData?: unknown;
    indexable?: boolean;
  },
): string {
  const title = escapeHtml(options.title);
  const description = escapeHtml(options.description);
  const url = escapeHtml(options.url);
  let html = template;

  html = replaceRequired(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = replaceRequired(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`);
  html = replaceRequired(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`);
  html = replaceRequired(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${description}" />`);
  html = replaceRequired(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = replaceRequired(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  if (options.structuredData) {
    html = replaceRequired(
      html,
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">${jsonLd(options.structuredData)}</script>`,
    );
  }
  if (options.indexable === false) {
    html = replaceRequired(html, '</head>', '  <meta name="robots" content="noindex, follow" />\n  </head>');
  }
  return replaceRequired(html, '<div id="root"></div>', `<div id="root">${options.content}</div>`);
}

function save(relativePath: string, html: string): void {
  const filename = path.join(dist, relativePath);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, html);
}

function link(url: string, label: string): string {
  return `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
}

function legalParagraph(paragraph: LegalParagraph): string {
  return typeof paragraph === 'string'
    ? escapeHtml(paragraph)
    : `${escapeHtml(paragraph.before)}${link(paragraph.link.href, paragraph.link.label)}${escapeHtml(paragraph.after)}`;
}

function frame(content: string): string {
  const reviewNotice = reviewCopy
    ? `<aside aria-label="Project status" data-watermark="${escapeHtml(reviewCopy.watermark)}" class="site-review-notice relative overflow-hidden border-b border-[#D9E3EF] bg-[#EDF3F8] text-[#29415C] dark:border-[#25415C] dark:bg-[#102339] dark:text-slate-200"><div class="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-xs leading-5 sm:px-6"><div class="flex flex-wrap gap-1.5">${reviewCopy.labels.map((label) => `<span class="rounded-full border border-[#A5BACD] bg-white/80 px-2.5 py-0.5 font-bold text-[#0B2240] dark:border-[#46627E] dark:bg-[#1C3651] dark:text-white">${escapeHtml(label)}</span>`).join('')}</div><p class="max-w-2xl flex-1 basis-64 font-medium">${escapeHtml(reviewCopy.description)}</p><a href="/credits" class="font-bold text-[#0B2240] underline decoration-[#8B1E24]/50 underline-offset-4 dark:text-[#F7D46B]">About this project</a></div></aside>`
    : '';
  return `<header><nav aria-label="Main navigation">${link('/', 'Pioneer Clubs')} · ${link('/credits', 'Credits')} · ${link('/support', 'Support Center')}</nav></header>${reviewNotice}<main>${content}</main><footer>${link('/support', 'Support Center')} · ${link('/privacy', 'Privacy Policy')} · ${link('/terms', 'Terms of Use')}</footer>`;
}

function campusPath(campus: Campus): string {
  return pagePath({ kind: 'campus', campusSlug: campus.slug });
}

function clubPath(club: Club): string {
  return pagePath({ kind: 'club', campusSlug: club.campusSlug, clubSlug: club.slug });
}

function clubList(clubs: Club[]): string {
  return `<ul>${clubs.map((club) => `<li><h3>${link(clubPath(club), club.name)}</h3><p>${escapeHtml(club.category)} · ${escapeHtml(club.shortDescription)}</p></li>`).join('')}</ul>`;
}

const campusList = `<ul>${INITIAL_CAMPUSES.map((campus) => `<li>${link(campusPath(campus), campus.name)}</li>`).join('')}</ul>`;
function firstBlockProps(page: Parameters<typeof createDefaultPageData>[0]): Record<string, unknown> {
  const first = createDefaultPageData(page, INITIAL_CAMPUSES, INITIAL_CLUBS).content[0];
  if (!first) throw new Error(`No Puck content for ${page.kind}`);
  return first.props;
}
const homePuck = firstBlockProps({ kind: 'home' });
const directoryContent = PUBLIC_CONTENT_VERIFIED
  ? `<h1>${escapeHtml(String(homePuck.title))}</h1><p>${escapeHtml(String(homePuck.description))}</p>${INITIAL_CAMPUSES.map((campus) => `<section><h2>${link(campusPath(campus), campus.name)}</h2>${clubList(INITIAL_CLUBS.filter((club) => club.campusSlug === campus.slug))}</section>`).join('')}`
  : `<h1>Pioneer Clubs</h1><p>A student club directory for Pioneer Charter School of Science. Club listings are currently sample content and are being prepared for public launch.</p><h2>Campus hubs</h2>${campusList}`;

save('index.html', decorate(home, {
  title: 'Pioneer Clubs | Student Organizations Across Pioneer Campuses',
  description: PUBLIC_CONTENT_VERIFIED
    ? 'Discover student clubs at PCSS I Everett and PCSS II Saugus. Explore club pages, meeting details, and campus communities.'
    : 'Pioneer Clubs is a student organization portal for Pioneer Charter School of Science. Public club details are being prepared.',
  url: `${site}/`,
  content: frame(directoryContent),
  indexable: PUBLIC_CONTENT_VERIFIED,
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pioneer Clubs',
    url: `${site}/`,
    description: 'Student organization portal across Pioneer Charter School of Science campuses.',
    creator: {
      '@type': 'Person',
      name: 'Aarti S Ravikumar',
      url: 'https://ai-aarti.com',
      affiliation: {
        '@type': 'EducationalOrganization',
        name: 'PCSS II',
        url: 'https://saugus.pioneercss.org',
      },
    },
  },
}));

const creditsPuck = firstBlockProps({ kind: 'credits' });
const creditGroups = (creditsPuck.creditAreas as EditableCreditArea[]).map((area) => ({
  title: area.title,
  description: area.description,
  people: area.people.filter((person) => person.name.trim()).map((person) => ({
    name: person.name,
    role: person.role,
    contribution: person.contribution,
    url: person.url,
    school: person.schoolName && person.schoolUrl ? { name: person.schoolName, url: person.schoolUrl } : undefined,
  })),
}));
const creditPeople = creditGroups.flatMap((group) => group.people);
const creditGroupContent = creditGroups.map((group) => `<section><h3>${escapeHtml(group.title)}</h3><p>${escapeHtml(group.description)}</p><ul>${group.people.map((person) => `<li${person.name === STUDENT_WEB_ADMIN_NAME ? ` id="${STUDENT_WEB_ADMIN_CREDITS_ANCHOR}"` : ''}><h4>${safeCreditUrl(person.url) ? link(safeCreditUrl(person.url)!, person.name) : escapeHtml(person.name)}</h4><p>${escapeHtml(person.role)}${person.contribution ? ` · ${escapeHtml(person.contribution)}` : ''}</p>${person.school ? `<p>School: ${safeCreditUrl(person.school.url) ? link(safeCreditUrl(person.school.url)!, person.school.name) : escapeHtml(person.school.name)}</p>` : ''}</li>`).join('')}</ul></section>`).join('');
const creditContent = frame([
  `<h1>${escapeHtml(String(creditsPuck.title))}</h1>`,
  `<p>${escapeHtml(String(creditsPuck.description))}</p>`,
  `<h2>${escapeHtml(String(creditsPuck.contributorsTitle))}</h2>`,
  `<p>${escapeHtml(String(creditsPuck.contributorsDescription))}</p>`,
  creditGroupContent,
  `<p>${escapeHtml(String(creditsPuck.recognitionNote))}</p>`,
  `<h2>${escapeHtml(String(creditsPuck.suggestionTitle))}</h2>`,
  `<p>${escapeHtml(String(creditsPuck.suggestionDescription))}</p>`,
  `<p>${link(safeCreditUrl(String(creditsPuck.suggestionLinkUrl)) || CREDIT_PAGE_COPY.suggestionLinkUrl, String(creditsPuck.suggestionLinkLabel))}</p>`,
].join(''));
save('credits/index.html', decorate(credits, {
  title: 'Credits & Contributors | Pioneer Clubs',
  description: 'Meet the people whose work supports Pioneer Clubs, from its student beginnings to future club, mentor, IT, and school contributors.',
  url: `${site}/credits`,
  content: creditContent,
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Credits for Pioneer Clubs',
    url: `${site}/credits`,
    author: creditPeople.filter((person) => person.role.toLowerCase().includes('creator')).map((person) => ({
      '@type': 'Person',
      name: person.name,
      ...(person.url ? { url: person.url } : {}),
      ...(person.school ? { affiliation: { '@type': 'EducationalOrganization', name: person.school.name, url: person.school.url } } : {}),
    })),
  },
}));

const supportContent = `<h1>Support Center</h1><p>Find help with Pioneer Clubs and request a website for your club or team.</p><section><h2>Common questions</h2>${SUPPORT_TOPICS.map((topic) => `<article><h3>${escapeHtml(topic.question)}</h3><p>${escapeHtml(topic.answer)}</p></article>`).join('')}</section><section><h2>Request a club website</h2><p>Sign in with your school account to send a request to the portal team. No email app is needed. The team reviews requests before any page is published.</p></section>`;
save('support/index.html', decorate(home, {
  title: 'Support Center | Pioneer Clubs',
  description: 'Find help with Pioneer Clubs, correct a listing, and request a website for your club or team.',
  url: `${site}/support`,
  content: frame(supportContent),
  indexable: PUBLIC_CONTENT_VERIFIED,
  structuredData: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Pioneer Clubs Support Center', url: `${site}/support` },
}));

for (const page of [PRIVACY_PAGE, TERMS_PAGE]) {
  const legalContent = `<h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.summary)}</p><p>Updated ${escapeHtml(page.updated)}</p>${page.sections.map((section) => `<section id="${escapeHtml(section.id)}"><h2>${escapeHtml(section.title)}</h2>${section.paragraphs.map((paragraph) => `<p>${legalParagraph(paragraph)}</p>`).join('')}</section>`).join('')}<p>Questions or corrections: ${link('/support#corrections', 'Contact the student portal team')}</p>`;
  save(`${page.path.slice(1)}/index.html`, decorate(home, {
    title: `${page.title} | PCSS Pioneer Clubs`,
    description: page.summary,
    url: `${site}${page.path}`,
    content: frame(legalContent),
    structuredData: { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, url: `${site}${page.path}`, dateModified: '2026-11-22' },
  }));
}

for (const campus of INITIAL_CAMPUSES) {
  const url = `${site}${campusPath(campus)}`;
  const clubs = INITIAL_CLUBS.filter((club) => club.campusSlug === campus.slug);
  const campusPuck = firstBlockProps({ kind: 'campus', campusSlug: campus.slug });
  const content = PUBLIC_CONTENT_VERIFIED
    ? `<h1>${escapeHtml(String(campusPuck.title))}</h1><p>${escapeHtml(String(campusPuck.description))}</p>${clubList(clubs)}`
    : `<h1>${escapeHtml(campus.name)} club hub preview</h1><p>Club details are sample content and are being prepared for public launch.</p><p>${link('/', 'Return to the directory')}</p>`;
  save(`campus/${campus.slug}/index.html`, decorate(home, {
    title: `${campus.name} Student Clubs | Pioneer Clubs`,
    description: PUBLIC_CONTENT_VERIFIED
      ? `Explore student clubs and activities at ${campus.name} in ${campus.city}.`
      : `Preview of the ${campus.name} club hub. Public club details are being prepared.`,
    url,
    content: frame(content),
    indexable: PUBLIC_CONTENT_VERIFIED,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${campus.name} student clubs`,
      url,
      isPartOf: { '@type': 'WebSite', name: 'Pioneer Clubs', url: `${site}/` },
      ...(PUBLIC_CONTENT_VERIFIED ? { mainEntity: { '@type': 'ItemList', itemListElement: clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${site}${clubPath(club)}` })) } } : {}),
    },
  }));
}

for (const club of INITIAL_CLUBS) {
  const campus = INITIAL_CAMPUSES.find((candidate) => candidate.slug === club.campusSlug);
  if (!campus) throw new Error(`Club ${club.slug} has no matching campus`);
  const url = `${site}${clubPath(club)}`;
  const content = PUBLIC_CONTENT_VERIFIED
    ? `<h1>${escapeHtml(club.name)}</h1><p>${escapeHtml(club.shortDescription)}</p><dl><dt>Campus</dt><dd>${link(campusPath(campus), campus.name)}</dd><dt>Category</dt><dd>${escapeHtml(club.category)}</dd><dt>Meeting days</dt><dd>${escapeHtml(club.meetingDays.join(', '))}</dd><dt>Meeting time</dt><dd>${escapeHtml(club.meetingTime)}</dd><dt>Room</dt><dd>${escapeHtml(club.roomNumber)}</dd></dl><p>${link(campusPath(campus), `More clubs at ${campus.shortName}`)}</p>`
    : `<h1>${escapeHtml(club.name)} preview</h1><p>This club profile contains sample information and is being prepared for public launch.</p><p>${link(campusPath(campus), `Visit the ${campus.shortName} hub`)}</p>`;
  save(`sites/${club.campusSlug}/${club.slug}/index.html`, decorate(home, {
    title: `${club.name} | ${campus.shortName} | Pioneer Clubs`,
    description: PUBLIC_CONTENT_VERIFIED
      ? `${club.shortDescription} Explore meeting details at ${campus.name}.`
      : `Preview of ${club.name} at ${campus.shortName}. Public club details are being prepared.`,
    url,
    content: frame(content),
    indexable: PUBLIC_CONTENT_VERIFIED,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: club.name,
      url,
      isPartOf: { '@type': 'WebSite', name: 'Pioneer Clubs', url: `${site}/` },
      ...(PUBLIC_CONTENT_VERIFIED ? { description: club.shortDescription } : {}),
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Pioneer Clubs', item: `${site}/` },
          { '@type': 'ListItem', position: 2, name: campus.name, item: `${site}${campusPath(campus)}` },
          { '@type': 'ListItem', position: 3, name: club.name, item: url },
        ],
      },
    },
  }));
}

const sitemapPaths = PUBLIC_CONTENT_VERIFIED
  ? ['/', '/credits', '/privacy', '/terms', '/support', ...INITIAL_CAMPUSES.map(campusPath), ...INITIAL_CLUBS.map(clubPath)]
  : ['/credits', '/privacy', '/terms'];
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths.map((url) => `  <url><loc>${escapeHtml(`${site}${url}`)}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);

console.log(`Prepared ${INITIAL_CAMPUSES.length} campus and ${INITIAL_CLUBS.length} club pages. Public indexing ${PUBLIC_CONTENT_VERIFIED ? 'enabled' : 'held until content is verified'}.`);
