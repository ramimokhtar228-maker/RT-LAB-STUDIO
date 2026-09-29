import React, { useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Printer, FileDown, Presentation, FileSpreadsheet, X, Save, Search } from 'lucide-react';
import { exportCsv, exportPptx, logoUrl, saveElementsAsPdf } from '../lib/exporters';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  showInTable?: boolean;
}

export interface RecordCollection {
  key: string;
  title: string;
  items: any[];
  fields: FieldDef[];
  allowAdd?: boolean;
  makeNew?: () => any;
  onSave: (item: any, isNew: boolean) => void | Promise<void>;
  onDelete: (item: any) => void | Promise<void>;
}

interface Props {
  collections: RecordCollection[];
  canDelete: boolean;
}

const cellText = (item: any, f: FieldDef): string => {
  const v = item[f.key];
  if (v === undefined || v === null) return '';
  if (f.type === 'select') return f.options?.find(o => o.value === String(v))?.label ?? String(v);
  return String(v);
};

export const RecordsView: React.FC<Props> = ({ collections, canDelete }) => {
  const [activeKey, setActiveKey] = useState(collections[0]?.key);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ item: any; isNew: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [busy, setBusy] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  const col = collections.find(c => c.key === activeKey) || collections[0];
  const tableFields = col.fields.filter(f => f.showInTable !== false).slice(0, 8);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return col.items;
    return col.items.filter(it => col.fields.some(f => cellText(it, f).toLowerCase().includes(q)));
  }, [col, query]);

  const stamp = new Date().toLocaleDateString('ar-EG');
  const fileBase = `RT-LAB-${col.key}-${new Date().toISOString().slice(0, 10)}`;

  const doPdf = async () => {
    if (!tableRef.current) return;
    setBusy('pdf');
    try { await saveElementsAsPdf([tableRef.current], fileBase, 'slice'); } catch (e) { console.error(e); alert('تعذر إنشاء PDF'); }
    setBusy('');
  };
  const doPptx = async () => {
    setBusy('pptx');
    try {
      await exportPptx(fileBase, `RT LAB - ${col.title}`, [{
        title: col.title,
        subtitle: `تقرير بتاريخ ${stamp} - عدد السجلات ${rows.length}`,
        table: { headers: tableFields.map(f => f.label), rows: rows.map(it => tableFields.map(f => cellText(it, f))) },
      }]);
    } catch (e) { console.error(e); alert('تعذر إنشاء PowerPoint'); }
    setBusy('');
  };
  const doCsv = () => exportCsv(fileBase, col.fields.map(f => f.label), rows.map(it => col.fields.map(f => cellText(it, f))));

  const save = async () => {
    if (!editing) return;
    const item = { ...editing.item };
    col.fields.forEach(f => { if (f.type === 'number') item[f.key] = Number(item[f.key]) || 0; });
    await col.onSave(item, editing.isNew);
    setEditing(null);
  };

  const inputCls = 'w-full text-xs font-semibold p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800';
  const btn = 'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border disabled:opacity-50';

  return (
    <div dir="rtl" className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      <div className="no-print flex flex-wrap gap-1.5">
        {collections.map(c => (
          <button key={c.key} onClick={() => { setActiveKey(c.key); setQuery(''); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold ${c.key === col.key ? 'bg-rose-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            {c.title} ({c.items.length})
          </button>
        ))}
      </div>

      <div className="no-print flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث..." className={inputCls + ' pr-9'} />
        </div>
        {col.allowAdd !== false && col.makeNew && (
          <button onClick={() => setEditing({ item: col.makeNew!(), isNew: true })} className={`${btn} bg-rose-900 text-white border-rose-900`}>
            <Plus className="w-4 h-4" /> إضافة
          </button>
        )}
        <button onClick={() => window.print()} className={`${btn} bg-white text-slate-800 border-slate-300`}><Printer className="w-4 h-4" /> طباعة</button>
        <button onClick={doPdf} disabled={busy !== ''} className={`${btn} bg-slate-100 text-slate-900 border-slate-300`}><FileDown className="w-4 h-4" /> {busy === 'pdf' ? '...' : 'PDF'}</button>
        <button onClick={doPptx} disabled={busy !== ''} className={`${btn} bg-orange-50 text-orange-900 border-orange-200`}><Presentation className="w-4 h-4" /> {busy === 'pptx' ? '...' : 'PowerPoint'}</button>
        <button onClick={doCsv} className={`${btn} bg-emerald-50 text-emerald-900 border-emerald-200`}><FileSpreadsheet className="w-4 h-4" /> Excel/CSV</button>
      </div>

      <div ref={tableRef} className="print-page bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center gap-3 border-b-2 border-rose-900 pb-3 mb-3">
          <img src={logoUrl()} alt="RT LABS" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: 12, background: '#000' }} />
          <div className="flex-1">
            <div className="font-black text-slate-900 text-base">معامل RT LAB - معامل رامي مختار</div>
            <div className="text-[11px] text-slate-600 font-bold">تقرير: {col.title} • {stamp} • {rows.length} سجل</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                {tableFields.map(f => <th key={f.key} className="p-2 text-right font-extrabold border-b-2 border-slate-300">{f.label}</th>)}
                <th className="no-print p-2 w-24 border-b-2 border-slate-300">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={tableFields.length + 1} className="p-6 text-center text-slate-400 font-bold">لا توجد سجلات</td></tr>
              )}
              {rows.map((it, i) => (
                <tr key={it.id ?? i} className="border-b border-slate-100 hover:bg-slate-50">
                  {tableFields.map(f => <td key={f.key} className="p-2 font-semibold text-slate-800">{cellText(it, f)}</td>)}
                  <td className="no-print p-2">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditing({ item: { ...it }, isNew: false })} title="تعديل" className="p-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100"><Pencil className="w-3.5 h-3.5" /></button>
                      {canDelete && (
                        <button onClick={() => setConfirmDelete(it)} title="حذف نهائي" className="p-1.5 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900">{editing.isNew ? 'إضافة' : 'تعديل'} - {col.title}</h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            {col.fields.map(f => (
              <label key={f.key} className="block">
                <span className="text-[11px] font-bold text-slate-600">{f.label}</span>
                {f.type === 'select' ? (
                  <select className={inputCls} value={editing.item[f.key] ?? ''} onChange={e => setEditing({ ...editing, item: { ...editing.item, [f.key]: e.target.value } })}>
                    {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea rows={2} className={inputCls} value={editing.item[f.key] ?? ''} onChange={e => setEditing({ ...editing, item: { ...editing.item, [f.key]: e.target.value } })} />
                ) : (
                  <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} className={inputCls}
                    value={editing.item[f.key] ?? ''} onChange={e => setEditing({ ...editing, item: { ...editing.item, [f.key]: e.target.value } })} />
                )}
              </label>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={save} className={`${btn} bg-rose-900 text-white border-rose-900 flex-1 justify-center`}><Save className="w-4 h-4" /> حفظ</button>
              <button onClick={() => setEditing(null)} className={`${btn} bg-slate-100 text-slate-700 border-slate-200`}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3 text-center">
            <Trash2 className="w-8 h-8 text-rose-800 mx-auto" />
            <div className="font-black text-slate-900">حذف نهائي؟</div>
            <p className="text-xs text-slate-600 font-semibold">سيتم حذف السجل نهائياً من البرنامج والسحابة ولا يمكن استرجاعه.</p>
            <div className="flex gap-2">
              <button onClick={async () => { await col.onDelete(confirmDelete); setConfirmDelete(null); }} className={`${btn} bg-rose-900 text-white border-rose-900 flex-1 justify-center`}>حذف نهائي</button>
              <button onClick={() => setConfirmDelete(null)} className={`${btn} bg-slate-100 text-slate-700 border-slate-200 flex-1 justify-center`}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
