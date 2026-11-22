import React, { useEffect, useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { type Campus, type Club } from '../data/registry';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildCampusPath, buildClubPath } from '../middleware/tenantRouting';
import { normalizeSlug } from '../data/registryModel';
import { RegistryFields } from './RegistryFields';

export function ManageRegistryPanel() {
  const { campuses, clubs, updateCampus, deleteCampus, updateClub, deleteClub, resetAllRegistry } = useRegistry();
  const location = useLocation();
  const navigate = useNavigate();
  const [kind, setKind] = useState<'school' | 'club'>('school');
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('');
  const items = kind === 'school' ? campuses : clubs;
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  useEffect(() => {
    setSelectedId(selected?.id ?? '');
    setDraft(selected ? { ...selected } : null);
    setMessage('');
  }, [kind, selected?.id]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !draft) return;
    try {
      const { id: _id, subdomain: _subdomain, ...changes } = draft;
      if (kind === 'school') {
        updateCampus(selected.id, changes as Partial<Campus>);
        const oldPath = buildCampusPath((selected as Campus).slug);
        if (location.pathname === oldPath) navigate(buildCampusPath(normalizeSlug(String(changes.slug))));
      } else {
        updateClub(selected.id, changes as Partial<Club>);
        const oldClub = selected as Club;
        if (location.pathname === buildClubPath(oldClub.campusSlug, oldClub.slug)) navigate(buildClubPath(String(changes.campusSlug), normalizeSlug(String(changes.slug))));
      }
      setMessage('Changes saved in this browser.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save changes.');
    }
  };

  const remove = () => {
    if (!selected) return;
    const affected = kind === 'school' ? clubs.filter((club) => club.campusSlug === (selected as Campus).slug).length : 0;
    if (!window.confirm(`Delete ${selected.name}${affected ? ` and its ${affected} clubs` : ''} from this browser?`)) return;
    try {
      if (kind === 'school') deleteCampus(selected.id);
      else deleteClub(selected.id);
      setMessage('Record deleted from this browser.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete record.');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#64748B] dark:text-slate-400">Changes here affect this browser. Public updates require a reviewed deployment.</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setKind('school')} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${kind === 'school' ? 'bg-[#0B2240] text-white' : 'dark:text-white'}`}>Schools</button>
        <button type="button" onClick={() => setKind('club')} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${kind === 'club' ? 'bg-[#0B2240] text-white' : 'dark:text-white'}`}>Clubs</button>
      </div>
      {selected ? <>
        <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-200">Choose {kind}
          <select className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] dark:border-[#1E3A5F] bg-white dark:bg-[#071120] px-3 py-2 text-sm dark:text-white" value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
            {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        {message && <p role="status" className="rounded-lg bg-[#F1F5F9] dark:bg-[#071120] p-3 text-sm text-[#0B2240] dark:text-white">{message}</p>}
        <form onSubmit={save} className="space-y-4">
          <RegistryFields kind={kind} draft={draft ?? {}} campuses={campuses} onChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))} />
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" className="rounded-lg bg-[#0B2240] px-4 py-2 text-sm font-semibold text-white">Save changes</button>
            <button type="button" onClick={remove} className="rounded-lg border border-[#8B1E24] px-4 py-2 text-sm font-semibold text-[#8B1E24] dark:text-[#FCA5A5]">Delete {kind}</button>
          </div>
        </form>
      </> : <p className="text-sm text-[#64748B]">No {kind}s yet. Use the Add tab to create one.</p>}
      <details className="border-t border-[#E2E8F0] pt-4 dark:border-[#1E3A5F]">
        <summary className="cursor-pointer text-sm font-semibold text-[#475569] dark:text-slate-300">Advanced local data</summary>
        <p className="mt-3 text-xs text-[#64748B] dark:text-slate-400">Resetting removes school and club changes saved in this browser.</p>
        <button type="button" onClick={() => { if (window.confirm('Reset all local school and club changes in this browser?')) { resetAllRegistry(); setMessage('Local school and club changes were reset.'); } }} className="mt-3 rounded-lg border border-[#8B1E24] px-3 py-2 text-xs font-semibold text-[#8B1E24] dark:text-[#FCA5A5]">Reset local data</button>
      </details>
    </div>
  );
}
