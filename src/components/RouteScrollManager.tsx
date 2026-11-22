import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** BrowserRouter changes views without performing a document navigation. */
export function RouteScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef({ key: location.key, pathname: location.pathname });

  useLayoutEffect(() => {
    const changedPage = previous.current.pathname !== location.pathname;
    const newEntry = previous.current.key !== location.key;
    previous.current = { key: location.key, pathname: location.pathname };

    // A link to the current page (such as the footer's directory link) should
    // also return to the top. Leave Back/Forward to browser restoration.
    if (!location.hash && ((navigationType === 'PUSH' && newEntry) || (navigationType === 'REPLACE' && changedPage))) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.key, location.pathname, location.hash, navigationType]);

  useEffect(() => {
    if (!location.hash) return;
    let id: string;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      id = location.hash.slice(1);
    }
    if (!id) return;

    let frame = 0;
    let timeout = 0;
    const observer = new MutationObserver(() => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: 'start' });
        observer.disconnect();
        window.clearTimeout(timeout);
      }
    });
    observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
    frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: 'start' });
        observer.disconnect();
        window.clearTimeout(timeout);
      }
    });
    timeout = window.setTimeout(() => observer.disconnect(), 5000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, [location.pathname, location.hash]);

  return null;
}
