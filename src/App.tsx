import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import { RegistryProvider, useRegistry } from './context/RegistryContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SavedClubsProvider } from './context/SavedClubsContext';
import { PRIVACY_PAGE, TERMS_PAGE } from './data/legalPages';
import { ProtectedEditorRoute } from './components/ProtectedEditorRoute';
import { RouteScrollManager } from './components/RouteScrollManager';
import { resolveTenantFromRequest } from './middleware/tenantRouting';
const PuckDocumentPage = lazy(() =>
  import('./pages/PuckDocumentPage').then((m) => ({ default: m.PuckDocumentPage }))
);

const ClubSitePage = lazy(() =>
  import('./pages/ClubSitePage').then((m) => ({ default: m.ClubSitePage }))
);
const MySpacePage = lazy(() =>
  import('./pages/MySpacePage').then((m) => ({ default: m.MySpacePage }))
);
const LegalPage = lazy(() =>
  import('./pages/LegalPage').then((m) => ({ default: m.LegalPage }))
);
const SupportPage = lazy(() =>
  import('./pages/SupportPage').then((m) => ({ default: m.SupportPage }))
);

function CampusRoute() {
  const { campusSlug = '' } = useParams<{ campusSlug: string }>();
  return <PuckDocumentPage page={{ kind: 'campus', campusSlug }} />;
}

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#071120] flex flex-col">
      <div className="h-16 bg-[#0B2240] border-b border-white/10" />
      <div className="max-w-6xl w-full mx-auto px-6 py-12 space-y-4">
        <div className="h-8 w-64 bg-slate-200 dark:bg-[#102A43] rounded-lg animate-pulse" />
        <div className="h-48 w-full bg-slate-200 dark:bg-[#102A43] rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

function SubdomainAwareRoot() {
  const { campuses } = useRegistry();
  const campusSlugs = useMemo(() => campuses.map((c) => c.slug), [campuses]);

  const tenant = useMemo(() => {
    if (typeof window === 'undefined') {
      return { mode: 'root' as const };
    }
    return resolveTenantFromRequest(
      window.location.host,
      window.location.pathname,
      new URLSearchParams(window.location.search),
      campusSlugs
    );
  }, [campusSlugs]);

  if (tenant.mode === 'club' && tenant.campusSlug && tenant.clubSlug) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <ClubSitePage
          forcedCampusSlug={tenant.campusSlug}
          forcedClubSlug={tenant.clubSlug}
        />
      </Suspense>
    );
  }

  if (tenant.mode === 'campus' && tenant.campusSlug) {
    return <PuckDocumentPage page={{ kind: 'campus', campusSlug: tenant.campusSlug }} />;
  }

  return <PuckDocumentPage page={{ kind: 'home' }} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <SavedClubsProvider>
      <RegistryProvider>
        <BrowserRouter>
          <RouteScrollManager />
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<SubdomainAwareRoot />} />
              <Route path="/credits" element={<PuckDocumentPage page={{ kind: 'credits' }} />} />
              <Route path="/my" element={<MySpacePage />} />
              <Route path="/my/clubs" element={<MySpacePage view="clubs" />} />
              <Route path="/my/schedule" element={<MySpacePage view="schedule" />} />
              <Route path="/privacy" element={<LegalPage page={PRIVACY_PAGE} />} />
              <Route path="/terms" element={<LegalPage page={TERMS_PAGE} />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/campus/:campusSlug" element={<CampusRoute />} />
              <Route
                path="/campus/:campusSlug/clubs/:clubSlug"
                element={<ClubSitePage />}
              />
              <Route path="/sites/:campusSlug/:clubSlug" element={<ClubSitePage />} />
              <Route path="/sites/:tenant" element={<ClubSitePage />} />
              <Route path="/editor" element={<ProtectedEditorRoute />} />
              <Route path="/editor/:campusSlug/:clubSlug" element={<ProtectedEditorRoute />} />
              <Route path="/editor/home" element={<ProtectedEditorRoute />} />
              <Route path="/editor/credits" element={<ProtectedEditorRoute />} />
              <Route path="/editor/campus/:campusSlug" element={<ProtectedEditorRoute />} />
              <Route path="/editor/:tenant" element={<ProtectedEditorRoute />} />
              <Route path="*" element={<SubdomainAwareRoot />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </RegistryProvider>
      </SavedClubsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
