import React, { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  CopyPlus,
  Download,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import {
  type Club,
} from '../data/registry';
import { useRegistry } from '../context/RegistryContext';
import { campusHostname, clubHostname, normalizeSlug } from '../data/registryModel';
import { emptyCampusDraft, emptyClubDraft, type CampusDraft, type ClubDraft } from '../data/registryDrafts';
import { RegistryFields } from './RegistryFields';
import { ManageRegistryPanel } from './ManageRegistryPanel';

interface AddEntityDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultCampusSlug?: string;
  initialTab?: 'club' | 'campus' | 'associate' | 'manage';
  onCreatedClub?: (campusSlug: string, clubSlug: string, club: Club) => void;
  onCreatedCampus?: (campusSlug: string) => void;
}

export function AddEntityDrawer({
  open,
  onClose,
  defaultCampusSlug,
  initialTab = 'club',
  onCreatedClub,
  onCreatedCampus,
}: AddEntityDrawerProps) {
  const {
    campuses,
    clubs,
    availableCategories,
    addCampus,
    addClub,
    associateClubWithCampus,
    exportRegistrySnapshot,
    importRegistrySnapshot,
  } = useRegistry();

  const [mode, setMode] = useState<'club' | 'campus' | 'associate' | 'manage'>(initialTab);

  const [campusDraft, setCampusDraft] = useState<CampusDraft>(emptyCampusDraft);
  const [clubDraft, setClubDraft] = useState<ClubDraft>(() => emptyClubDraft(defaultCampusSlug || campuses[0]?.slug || ''));

  // Associate / Import state
  const [sourceClubId, setSourceClubId] = useState(clubs[0]?.id || '');
  const [targetCampusSlug, setTargetCampusSlug] = useState(
    campuses[1]?.slug || campuses[0]?.slug || ''
  );
  const [associateMode, setAssociateMode] = useState<'clone' | 'move'>('clone');
  const [importJson, setImportJson] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (open) {
      setMode(initialTab);
      setClubDraft((current) => ({ ...current, campusSlug: defaultCampusSlug || campuses[0]?.slug || '' }));
      if (clubs.length > 0 && !clubs.some((c) => c.id === sourceClubId)) {
        setSourceClubId(clubs[0].id);
      }
      setError('');
      setSuccessMsg('');
    }
  }, [open, initialTab, defaultCampusSlug]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmitCampus = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const created = addCampus(campusDraft);
      setCampusDraft(emptyCampusDraft());
      onCreatedCampus?.(created.slug);
      onClose();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not add school.'); }
  };

  const handleSubmitClub = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const created = addClub(clubDraft);
      setClubDraft(emptyClubDraft(created.campusSlug));
      onCreatedClub?.(created.campusSlug, created.slug, created);
      onClose();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not add club.'); }
  };

  const handleAssociateClub = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!sourceClubId || !targetCampusSlug) {
      setError('Select both a club and a target campus.');
      return;
    }

    const result = associateClubWithCampus(sourceClubId, targetCampusSlug, associateMode);
    if (!result) {
      setError(
        'Cannot associate: a club with the same subdomain slug already exists at that campus.'
      );
      return;
    }

    setSuccessMsg(
      `${associateMode === 'clone' ? 'Cloned' : 'Moved'} "${result.name}" to ${result.subdomain}.`
    );
  };

  const handleDownloadSnapshot = () => {
    const snapshot = exportRegistrySnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pcss-clubs-registry.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSnapshot = () => {
    setError('');
    setSuccessMsg('');
    if (!importJson.trim()) {
      setError('Paste a valid registry JSON payload first.');
      return;
    }
    const res = importRegistrySnapshot(importJson);
    if (!res.ok) {
      setError(res.error || 'Import failed.');
      return;
    }
    setImportJson('');
    setSuccessMsg(`Imported registry cleanly (${res.count} clubs active).`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B2240]/55 dark:bg-[#050D1A]/75 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Registry and school administration"
      onClick={onClose}
    >
      <div
        className="site-card flex h-[100dvh] w-full max-w-lg flex-col border-l border-[#E2E8F0] bg-white shadow-2xl dark:border-[#1E3A5F] dark:bg-[#0E1C33]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gap-2 px-4 sm:px-6 py-5 border-b border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-[#0B2240] dark:text-white">
              Manage clubs and schools
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Add and manage schools and clubs in this browser
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="shrink-0 p-2 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-[#F1F5F9] dark:bg-[#071120] border border-transparent dark:border-[#1E3A5F] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('club');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'club'
                  ? 'bg-white dark:bg-[#0E1C33] text-[#0B2240] dark:text-white shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white'
              }`}
            >
              Add Club
            </button>
            <button
              type="button"
              onClick={() => { setMode('manage'); setError(''); setSuccessMsg(''); }}
              className={`py-2 px-1 rounded-md text-xs font-semibold transition-colors ${mode === 'manage' ? 'bg-white dark:bg-[#0E1C33] text-[#0B2240] dark:text-white shadow-xs' : 'text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white'}`}
            >
              Manage
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('campus');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'campus'
                  ? 'bg-white dark:bg-[#0E1C33] text-[#0B2240] dark:text-white shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white'
              }`}
            >
              Add School
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('associate');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'associate'
                  ? 'bg-white dark:bg-[#0E1C33] text-[#0B2240] dark:text-white shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white'
              }`}
            >
              More tools
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-[#FEF2F2] dark:bg-[#8B1E24]/25 border border-[#FECACA] dark:border-[#8B1E24]/60 text-xs font-medium text-[#991B1B] dark:text-[#FCA5A5]"
            >
              {error}
            </div>
          )}
          {successMsg && (
            <div
              role="status"
              className="mb-4 p-3 rounded-lg bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-700/60 text-xs font-medium text-[#065F46] dark:text-emerald-300"
            >
              {successMsg}
            </div>
          )}

          {mode === 'club' && (
            <form id="add-club-form" onSubmit={handleSubmitClub} className="space-y-4">
              <p className="text-xs text-[#64748B] dark:text-slate-400">Enter verified details. Unknown contact or meeting fields can stay blank.</p>
              <RegistryFields kind="club" draft={clubDraft as unknown as Record<string, unknown>} campuses={campuses} onChange={(key, value) => setClubDraft((current) => ({ ...current, [key]: value }))} />
              <p className="text-xs text-[#64748B] dark:text-slate-400">URL: {clubHostname(clubDraft.campusSlug, normalizeSlug(clubDraft.slug || clubDraft.name) || 'club')}</p>
            </form>
          )}

          {mode === 'campus' && (
            <form id="add-campus-form" onSubmit={handleSubmitCampus} className="space-y-4">
              <p className="text-xs text-[#64748B] dark:text-slate-400">Add a school once; navigation, routes, and Puck page templates use the registry record.</p>
              <RegistryFields kind="school" draft={campusDraft as unknown as Record<string, unknown>} campuses={campuses} onChange={(key, value) => setCampusDraft((current) => ({ ...current, [key]: value }))} />
              <p className="text-xs text-[#64748B] dark:text-slate-400">URL: {campusHostname(normalizeSlug(campusDraft.slug || campusDraft.name) || 'school')}</p>
            </form>
          )}

          {mode === 'associate' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAssociateClub}
                className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#071120] space-y-4"
              >
                <div>
                  <h3 className="font-display text-sm font-bold text-[#0B2240] dark:text-white">
                    Copy or move a club
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                    Clone a club chapter to expand it to another campus, or move an existing
                    organization between schools.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-200 mb-1.5">
                    Select Club
                  </label>
                  <select
                    value={sourceClubId}
                    onChange={(e) => setSourceClubId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0E1C33] text-[#1E293B] dark:text-slate-100 border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg focus:outline-none focus:border-[#0B2240] dark:focus:border-[#D4AF37]"
                  >
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name} ({club.campusSlug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-200 mb-1.5">
                    Target School / Campus
                  </label>
                  <select
                    value={targetCampusSlug}
                    onChange={(e) => setTargetCampusSlug(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0E1C33] text-[#1E293B] dark:text-slate-100 border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg focus:outline-none focus:border-[#0B2240] dark:focus:border-[#D4AF37]"
                  >
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.slug}>
                        {campus.name} ({campus.subdomain})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssociateMode('clone')}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      associateMode === 'clone'
                        ? 'bg-[#0B2240] dark:bg-[#1E3A5F] text-white border-[#0B2240] dark:border-[#93C5FD]/40'
                        : 'bg-white dark:bg-[#0E1C33] text-[#475569] dark:text-slate-300 border-[#CBD5E1] dark:border-[#1E3A5F]'
                    }`}
                  >
                    <CopyPlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Clone Chapter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssociateMode('move')}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      associateMode === 'move'
                        ? 'bg-[#8B1E24] text-white border-[#8B1E24]'
                        : 'bg-white dark:bg-[#0E1C33] text-[#475569] dark:text-slate-300 border-[#CBD5E1] dark:border-[#1E3A5F]'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reassign Campus</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg text-xs font-semibold bg-[#0B2240] dark:bg-[#1E3A5F] text-white hover:bg-[#102A43] dark:hover:bg-[#284B78] transition-colors"
                >
                  Apply School Association
                </button>
              </form>

              <div className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-white dark:bg-[#071120] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#0B2240] dark:text-white">
                      Back up local data
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400">
                      Export or import an entire schools &amp; clubs snapshot.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSnapshot}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#CBD5E1] dark:border-[#1E3A5F] text-[#1E293B] dark:text-slate-100 hover:border-[#0B2240] dark:hover:border-slate-400 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Export JSON</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='Paste {"campuses": [...], "clubs": [...]} JSON...'
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#0E1C33] text-[#1E293B] dark:text-slate-100 placeholder:text-[#64748B] dark:placeholder:text-slate-500 border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg focus:outline-none focus:border-[#0B2240] dark:focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={handleImportSnapshot}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#8B1E24] text-white hover:bg-[#A61C24] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Import Registry JSON</span>
                </button>
              </div>
            </div>
          )}
          {mode === 'manage' && <ManageRegistryPanel />}
        </div>

        <div className="px-6 py-4 border-t border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#071120] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#475569] dark:text-slate-300 hover:text-[#1E293B] dark:hover:text-white transition-colors"
          >
            {mode === 'associate' || mode === 'manage' ? 'Done' : 'Cancel'}
          </button>
          {mode !== 'associate' && mode !== 'manage' && (
            <button
              type="submit"
              form={mode === 'club' ? 'add-club-form' : 'add-campus-form'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#8B1E24] text-white hover:bg-[#A61C24] transition-colors"
            >
              {mode === 'club' ? <Plus className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              <span>{mode === 'club' ? 'Add Club Locally' : 'Add School Locally'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
