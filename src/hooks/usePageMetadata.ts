import { useEffect } from 'react';

interface PageMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  indexable: boolean;
  enabled?: boolean;
}

function setMeta(selector: string, attribute: string, value: string): void {
  const element = document.querySelector<HTMLMetaElement>(selector);
  if (element) element.setAttribute(attribute, value);
}

export function usePageMetadata({ title, description, canonicalPath, indexable, enabled = true }: PageMetadata): void {
  useEffect(() => {
    if (!enabled) return;
    const canonical = `https://pcssclubs.org${canonicalPath}`;
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonical);

    const canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.href = canonical;

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!indexable) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex, follow';
    } else {
      robots?.remove();
    }
  }, [title, description, canonicalPath, indexable, enabled]);
}
