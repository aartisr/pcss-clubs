import { CAMPUS_THEME_TOKENS, CLUB_CATEGORIES, MEETING_DAYS, type Campus } from '../data/registry';
import type { CampusDraft, ClubDraft } from '../data/registryDrafts';

type FieldKey = keyof CampusDraft | keyof ClubDraft;
type FieldKind = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'days' | 'category';
interface FieldSpec {
  key: FieldKey;
  label: string;
  kind?: FieldKind;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

export const SCHOOL_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'School name', required: true },
  { key: 'shortName', label: 'Short name', required: true },
  { key: 'slug', label: 'URL slug (generated from name if blank)' },
  { key: 'city', label: 'City and state' },
  { key: 'address', label: 'Address' },
  { key: 'gradesServed', label: 'Grades served' },
  { key: 'foundedYear', label: 'Founded year', kind: 'number', required: true },
  { key: 'themeColor', label: 'Theme', kind: 'select', options: Object.entries(CAMPUS_THEME_TOKENS).map(([value, token]) => ({ value, label: token.label })) },
];

export const CLUB_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Club name', required: true },
  { key: 'slug', label: 'URL slug (generated from name if blank)' },
  { key: 'campusSlug', label: 'School', kind: 'select' },
  { key: 'category', label: 'Category', kind: 'category' },
  { key: 'shortDescription', label: 'Description', kind: 'textarea' },
  { key: 'advisorName', label: 'Advisor' },
  { key: 'advisorEmail', label: 'Advisor email', kind: 'email' },
  { key: 'studentLead', label: 'Student lead' },
  { key: 'meetingDays', label: 'Meeting days', kind: 'days' },
  { key: 'meetingTime', label: 'Meeting time' },
  { key: 'roomNumber', label: 'Room' },
  { key: 'memberCount', label: 'Member count', kind: 'number' },
  { key: 'coverImage', label: 'Cover image path or URL' },
  { key: 'openEnrollment', label: 'Open enrollment', kind: 'checkbox' },
];

const inputClass = 'w-full rounded-lg border border-[#CBD5E1] dark:border-[#1E3A5F] bg-white dark:bg-[#071120] px-3 py-2 text-sm text-[#1E293B] dark:text-slate-100';

function FieldControl({ field, value, options, onChange }: {
  field: FieldSpec;
  value: unknown;
  options?: FieldSpec['options'];
  onChange: (value: unknown) => void;
}) {
  if (field.kind === 'checkbox') {
    return <span className="flex items-center gap-2"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />{field.label}</span>;
  }

  if (field.kind === 'days') {
    const days = Array.isArray(value) ? value as string[] : [];
    return <>
      <span className="mb-1.5 block">{field.label}</span>
      <span className="flex flex-wrap gap-2">{MEETING_DAYS.map((day) =>
        <span key={day} className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] px-2 py-1 dark:border-[#1E3A5F]">
          <input type="checkbox" checked={days.includes(day)} onChange={() => onChange(days.includes(day) ? days.filter((item) => item !== day) : [...days, day])} />
          {day}
        </span>
      )}</span>
    </>;
  }

  const shown = field.key === 'foundedYear' && value === 0 ? '' : String(value ?? '');
  return <>
    <span className="mb-1.5 block">{field.label}</span>
    {field.kind === 'textarea' ?
      <textarea rows={3} className={inputClass} value={shown} onChange={(event) => onChange(event.target.value)} /> :
      field.kind === 'select' ?
        <select className={inputClass} value={shown} onChange={(event) => onChange(event.target.value)}>
          {options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> :
        <>
          <input
            className={inputClass}
            type={field.kind === 'number' ? 'number' : field.kind === 'email' ? 'email' : 'text'}
            list={field.kind === 'category' ? 'registry-category-options' : undefined}
            required={field.required}
            min={field.key === 'foundedYear' ? 1 : field.kind === 'number' ? 0 : undefined}
            value={shown}
            onChange={(event) => onChange(field.kind === 'number' ? Number(event.target.value) : event.target.value)}
          />
          {field.kind === 'category' && <datalist id="registry-category-options">{CLUB_CATEGORIES.map((category) => <option key={category} value={category} />)}</datalist>}
        </>
    }
  </>;
}

export function RegistryFields({ kind, draft, campuses, onChange }: {
  kind: 'school' | 'club';
  draft: Record<string, unknown>;
  campuses: Campus[];
  onChange: (key: FieldKey, value: unknown) => void;
}) {
  const fields = kind === 'school' ? SCHOOL_FIELDS : CLUB_FIELDS;
  return <>{fields.map((field) => {
    const options = field.key === 'campusSlug'
      ? campuses.map((campus) => ({ value: campus.slug, label: campus.name }))
      : field.options;
    return <label key={field.key} className="block text-xs font-semibold text-[#1E293B] dark:text-slate-200">
      <FieldControl field={field} value={draft[field.key]} options={options} onChange={(value) => onChange(field.key, value)} />
    </label>;
  })}</>;
}
