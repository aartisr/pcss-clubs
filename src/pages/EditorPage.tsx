import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Puck, type Data } from '@measured/puck';
import '@measured/puck/puck.css';
import {
  ArrowLeft,
  Download,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { useRegistry } from '../context/RegistryContext';
import { puckConfig } from '../puck/puck.config';
import { PageScope } from '../puck/PageScope';
import { isValidPageData, normalizePageData, pageExists, pageKey, pageLabel, pagePath, parseEditorPath } from '../puck/pageModel';
import { usePageMetadata } from '../hooks/usePageMetadata';

export function EditorPage() {
  const location = useLocation();
  const { campuses, clubs, getPageLayout, savePageLayout, resetPageLayout } = useRegistry();
  const page = useMemo(() => parseEditorPath(location.pathname, campuses), [location.pathname, campuses]);
  const validPage = page && pageExists(page, campuses, clubs) ? page : null;
  const key = validPage ? pageKey(validPage) : 'unavailable';
  const initialData = validPage ? getPageLayout(validPage) : null;

  usePageMetadata({
    title: validPage ? `Edit ${pageLabel(validPage, campuses, clubs)} | Pioneer Clubs` : 'Page Editor | Pioneer Clubs',
    description: 'Local visual editor for Pioneer Clubs pages.',
    canonicalPath: validPage ? pagePath(validPage) : '/',
    indexable: false,
  });

  const [editorKey, setEditorKey] = useState(0);
  const [currentData, setCurrentData] = useState<Data | null>(initialData);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentData(initialData);
    setEditorKey((value) => value + 1);
    setStatusMessage(null);
  }, [key]);

  if (!validPage || !initialData) {
    return (
      <div className="site-canvas min-h-screen bg-[#F8FAFC] dark:bg-[#071120] flex items-center justify-center p-6 transition-colors">
        <div className="max-w-md bg-white dark:bg-[#0E1C33] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-8 text-center">
          <h1 className="font-display text-xl font-bold text-[#0B2240] dark:text-white">
            Page unavailable
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-2">
            Choose a page from the club directory to edit.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B2240] dark:bg-[#8B1E24] text-white hover:bg-[#102A43] dark:hover:bg-[#A61C24] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const save = (data: Data): boolean => {
    if (!isValidPageData(validPage, data)) {
      setStatusMessage('Restore the required page block before saving.');
      return false;
    }
    const saved = savePageLayout(validPage, data);
    setStatusMessage(saved ? 'Saved in this browser.' : 'Could not save. Export your changes.');
    return saved;
  };

  const handlePublish = (data: Data) => {
    if (save(data)) setCurrentData(data);
  };

  const handleReset = () => {
    if (!window.confirm('Restore this page to its default layout in this browser?')) return;
    const fresh = resetPageLayout(validPage);
    setCurrentData(fresh);
    setEditorKey((k) => k + 1);
    setStatusMessage('Page restored to its default layout.');
  };

  const handleExportJson = () => {
    const payload = currentData || initialData;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${key.replace(/:/g, '-')}-puck.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = normalizePageData(validPage, JSON.parse(await file.text()) as Data);
      if (!isValidPageData(validPage, parsed)) {
        setStatusMessage('This file is not a valid layout for this page.');
        return;
      }
      if (!savePageLayout(validPage, parsed)) {
        setStatusMessage('Could not import this layout in this browser.');
        return;
      }
      setCurrentData(parsed);
      setEditorKey((value) => value + 1);
      setStatusMessage('Layout imported and saved in this browser.');
    } catch {
      setStatusMessage('Could not read the selected JSON file.');
    } finally {
      if (importInput.current) importInput.current.value = '';
    }
  };

  return (
    <PageScope page={validPage} isEditing>
    <div className="site-canvas min-h-screen flex flex-col bg-white dark:bg-[#071120]">
      {/* Custom Pioneer Visual Builder Top Bar */}
      <header className="bg-[#0B2240] dark:bg-[#050D1A] text-white border-b border-white/10 px-4 sm:px-6 min-h-14 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            to={pagePath(validPage)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sm:hidden">Back</span><span className="hidden sm:inline">Back to page</span>
          </Link>
          <span className="hidden text-white/20 sm:inline" aria-hidden="true">
            |
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-white truncate">
              {pageLabel(validPage, campuses, clubs)}
            </p>
            <p className="hidden truncate font-mono text-[11px] text-[#D4AF37] sm:block">
              Changes are saved in this browser
            </p>
          </div>
        </div>

        <details className="relative shrink-0">
          <summary className="cursor-pointer rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">More actions</summary>
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-[#CBD5E1] bg-white p-2 text-[#0B2240] shadow-xl dark:border-[#1E3A5F] dark:bg-[#0E1C33] dark:text-white">
            <button type="button" onClick={handleReset} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-[#F8FAFC] dark:hover:bg-[#162947]"><RotateCcw className="h-4 w-4" aria-hidden="true" />Restore default layout</button>
            <button type="button" onClick={handleExportJson} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-[#F8FAFC] dark:hover:bg-[#162947]"><Download className="h-4 w-4" aria-hidden="true" />Export layout</button>
            <input ref={importInput} type="file" accept="application/json,.json" className="hidden" aria-label="Import layout JSON" onChange={(event) => void handleImportJson(event.target.files?.[0])} />
            <button type="button" onClick={() => importInput.current?.click()} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-[#F8FAFC] dark:hover:bg-[#162947]"><Upload className="h-4 w-4" aria-hidden="true" />Import layout</button>
          </div>
        </details>
      </header>
      {statusMessage && <p role="status" className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-sm text-[#0B2240] dark:border-[#1E3A5F] dark:bg-[#0E1C33] dark:text-white">{statusMessage}</p>}
      {validPage.kind === 'credits' && <p className="border-b border-[#D4AF37]/40 bg-[#FFF8E6] px-4 py-2 text-xs leading-5 text-[#0B2240] dark:bg-[#132A43] dark:text-slate-100 sm:px-6">Select <strong>Credits &amp; Contributors</strong> in the preview, then open <strong>Contribution Areas</strong>. Each area contains its heading, description, and people. Changes save in this browser.</p>}

      {/* Puck Drag-and-Drop Visual Editor */}
      <div className="flex-1 min-h-0">
        <Puck
          key={`${key}-${editorKey}`}
          config={puckConfig}
          data={currentData || initialData}
          onChange={(updated) => {
            setCurrentData(updated);
            save(updated);
          }}
          onPublish={handlePublish}
        />
      </div>
    </div>
    </PageScope>
  );
}
