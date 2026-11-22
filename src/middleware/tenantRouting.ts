export interface ResolvedTenant {
  mode: 'root' | 'campus' | 'club';
  campusSlug?: string;
  clubSlug?: string;
  source: 'subdomain' | 'path' | 'query';
  hostname: string;
}

export const PORTAL_BASE_DOMAIN = 'pcssclubs.org';

const RESERVED_SUBDOMAINS = new Set(['www', 'portal', 'app', 'localhost', '127']);

/**
 * Generic multi-tenant hostname & path resolver supporting:
 * 1. Wildcard club+campus subdomains:
 *    - robotics.pcss1.pcssclubs.org  -> mode: 'club', campusSlug: 'pcss1', clubSlug: 'robotics'
 *    - robotics-everett.pcssclubs.org -> mode: 'club', campusSlug: 'everett', clubSlug: 'robotics'
 * 2. Campus subdomains:
 *    - pcss2.pcssclubs.org           -> mode: 'campus', campusSlug: 'pcss2'
 *    - lowell.pcssclubs.org          -> mode: 'campus', campusSlug: 'lowell'
 * 3. Root portal:
 *    - pcssclubs.org                 -> mode: 'root'
 * 4. Local dev & preview path fallbacks:
 *    - /sites/:campusSlug/:clubSlug
 *    - /campus/:campusSlug/clubs/:clubSlug
 *    - /campus/:campusSlug
 */
export function resolveTenantFromRequest(
  hostHeader: string | undefined,
  pathname: string,
  searchParams?: URLSearchParams,
  knownCampusSlugs?: string[]
): ResolvedTenant {
  const cleanHost = (hostHeader || PORTAL_BASE_DOMAIN)
    .split(':')[0]
    .toLowerCase()
    .trim();

  // Optional query override for testing subdomain resolution locally
  const queryTenant = searchParams?.get('tenant');
  if (queryTenant) {
    const parsed = parseSubdomainString(queryTenant, knownCampusSlugs);
    if (parsed) {
      return { ...parsed, source: 'query', hostname: queryTenant };
    }
  }

  // Path-based multi-tenant routes
  const sitesMatch = pathname.match(/^\/sites\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/i);
  if (sitesMatch) {
    return {
      mode: 'club',
      campusSlug: sitesMatch[1].toLowerCase(),
      clubSlug: sitesMatch[2].toLowerCase(),
      source: 'path',
      hostname: cleanHost,
    };
  }

  const campusClubMatch = pathname.match(
    /^\/campus\/([a-z0-9-]+)\/clubs\/([a-z0-9-]+)\/?$/i
  );
  if (campusClubMatch) {
    return {
      mode: 'club',
      campusSlug: campusClubMatch[1].toLowerCase(),
      clubSlug: campusClubMatch[2].toLowerCase(),
      source: 'path',
      hostname: cleanHost,
    };
  }

  const campusOnlyMatch = pathname.match(/^\/campus\/([a-z0-9-]+)\/?$/i);
  if (campusOnlyMatch) {
    return {
      mode: 'campus',
      campusSlug: campusOnlyMatch[1].toLowerCase(),
      source: 'path',
      hostname: cleanHost,
    };
  }

  // Hostname subdomain parsing for *.pcssclubs.org and *.localhost
  const parsedFromHost = parseSubdomainString(cleanHost, knownCampusSlugs);
  if (parsedFromHost) {
    return { ...parsedFromHost, source: 'subdomain', hostname: cleanHost };
  }

  return {
    mode: 'root',
    source: 'path',
    hostname: cleanHost,
  };
}

export function parseSubdomainString(
  hostname: string,
  knownCampusSlugs?: string[]
): Omit<ResolvedTenant, 'source' | 'hostname'> | null {
  const host = hostname.split(':')[0].toLowerCase().trim();
  if (!host || host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }

  let prefix = '';
  const baseSuffix = `.${PORTAL_BASE_DOMAIN}`;
  if (host.endsWith(baseSuffix)) {
    prefix = host.slice(0, -baseSuffix.length);
  } else if (host.endsWith('.localhost')) {
    prefix = host.slice(0, -'.localhost'.length);
  } else if (host === PORTAL_BASE_DOMAIN) {
    return { mode: 'root' };
  } else {
    return null;
  }

  if (!prefix || RESERVED_SUBDOMAINS.has(prefix)) {
    return { mode: 'root' };
  }

  // Handle dot-separated: <club>.<campus>.pcssclubs.org
  if (prefix.includes('.')) {
    const parts = prefix.split('.').filter(Boolean);
    if (parts.length >= 2) {
      return {
        mode: 'club',
        clubSlug: parts[0],
        campusSlug: parts[1],
      };
    }
  }

  // Handle hyphen-separated: <club>-<campus>.pcssclubs.org
  if (prefix.includes('-')) {
    if (knownCampusSlugs && knownCampusSlugs.length > 0) {
      const matchedCampus = knownCampusSlugs.find(
        (slug) => prefix.endsWith(`-${slug.toLowerCase()}`) && prefix.length > slug.length + 1
      );
      if (matchedCampus) {
        return {
          mode: 'club',
          clubSlug: prefix.slice(0, -(matchedCampus.length + 1)),
          campusSlug: matchedCampus.toLowerCase(),
        };
      }
    }

    const lastDash = prefix.lastIndexOf('-');
    const maybeClub = prefix.slice(0, lastDash);
    const maybeCampus = prefix.slice(lastDash + 1);
    if (maybeClub.length > 0 && maybeCampus.length > 0) {
      // If prefix matches known campus-only slug (e.g. "pcss-south"), treat as campus
      if (knownCampusSlugs?.includes(prefix)) {
        return { mode: 'campus', campusSlug: prefix };
      }
      if (maybeCampus.startsWith('pcss')) {
        return {
          mode: 'club',
          clubSlug: maybeClub,
          campusSlug: maybeCampus,
        };
      }
    }
  }

  // Otherwise campus subdomain: <campus>.pcssclubs.org
  return {
    mode: 'campus',
    campusSlug: prefix,
  };
}

export function buildClubPath(campusSlug: string, clubSlug: string): string {
  return `/sites/${encodeURIComponent(campusSlug)}/${encodeURIComponent(clubSlug)}`;
}

export function buildCampusPath(campusSlug: string): string {
  return `/campus/${encodeURIComponent(campusSlug)}`;
}

export function buildEditorPath(campusSlug: string, clubSlug: string): string {
  return `/editor/${encodeURIComponent(campusSlug)}/${encodeURIComponent(clubSlug)}`;
}

export function buildClubSubdomain(
  campusSlug: string,
  clubSlug: string,
  baseDomain = PORTAL_BASE_DOMAIN
): string {
  return `${clubSlug}.${campusSlug}.${baseDomain}`;
}
