/**
 * Real PDF (jsPDF + html2canvas-pro) and real .pptx (pptxgenjs) export,
 * plus WhatsApp result sharing (attaches the PDF when the device supports it).
 */

export const logoUrl = () => `${import.meta.env.BASE_URL}logo.png`;

export function waNumber(phone: string): string {
  const d = (phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) return d.slice(2);
  if (d.startsWith('0')) return '20' + d.slice(1);
  return d;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/**
 * Render elements to A4 pages of a PDF.
 * mode 'fit'  : one element = one page (shrunk if too tall) - used for lab reports
 * mode 'slice': tall elements continue on following pages - used for long tables
 */
export async function elementsToPdfBlob(elements: HTMLElement[], mode: 'fit' | 'slice' = 'fit'): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const W = 210;
  const H = 297;
  let first = true;
  for (const el of elements) {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const fullH = (canvas.height * W) / canvas.width;
    if (mode === 'fit' || fullH <= H) {
      let w = W;
      let h = fullH;
      if (h > H) { h = H; w = (canvas.width * H) / canvas.height; }
      if (!first) pdf.addPage();
      first = false;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', (W - w) / 2, 0, w, h);
    } else {
      const pxPerPage = Math.floor((canvas.width * H) / W);
      for (let y = 0; y < canvas.height; y += pxPerPage) {
        const sliceH = Math.min(pxPerPage, canvas.height - y);
        const part = document.createElement('canvas');
        part.width = canvas.width;
        part.height = sliceH;
        part.getContext('2d')!.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        if (!first) pdf.addPage();
        first = false;
        pdf.addImage(part.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, (sliceH * W) / canvas.width);
      }
    }
  }
  return pdf.output('blob');
}

export async function saveElementsAsPdf(elements: HTMLElement[], filename: string, mode: 'fit' | 'slice' = 'fit') {
  const blob = await elementsToPdfBlob(elements, mode);
  downloadBlob(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Share the result PDF to WhatsApp.
 * Phones: opens the share sheet with the PDF attached (choose WhatsApp).
 * Otherwise: downloads the PDF and opens the patient's WhatsApp chat with a message.
 */
export async function sendPdfViaWhatsApp(opts: {
  elements: HTMLElement[];
  filename: string;
  phone: string;
  message: string;
}): Promise<'shared' | 'fallback'> {
  const blob = await elementsToPdfBlob(opts.elements);
  const name = opts.filename.endsWith('.pdf') ? opts.filename : `${opts.filename}.pdf`;
  const file = new File([blob], name, { type: 'application/pdf' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: opts.message, title: name });
      return 'shared';
    } catch {
      /* user cancelled or share failed -> fall back */
    }
  }
  downloadBlob(blob, name);
  const to = waNumber(opts.phone);
  const text = encodeURIComponent(opts.message + '\n\n📎 برجاء إرفاق ملف التقرير (PDF) الذي تم تحميله.');
  window.open(`https://wa.me/${to}?text=${text}`, '_blank');
  return 'fallback';
}

export interface PptxTable {
  headers: string[];
  rows: string[][];
}
export interface PptxSlideSpec {
  title: string;
  subtitle?: string;
  lines?: string[];
  table?: PptxTable;
}

/** Real .pptx. One slide per spec; long tables continue on extra slides. */
export async function exportPptx(filename: string, deckTitle: string, slides: PptxSlideSpec[]) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
  pptx.title = deckTitle;

  let logo: string | null = null;
  try {
    logo = await urlToDataUrl(logoUrl());
  } catch {
    logo = null;
  }

  const ROWS_PER_SLIDE = 11;
  const addChrome = (slide: any, title: string, subtitle?: string) => {
    slide.background = { color: 'FFFFFF' };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.95, fill: { color: '7F1D1D' } });
    if (logo) slide.addImage({ data: logo, x: 0.2, y: 0.08, w: 0.8, h: 0.8 });
    slide.addText(title, { x: 1.2, y: 0.12, w: 11.6, h: 0.5, fontSize: 22, bold: true, color: 'FFFFFF', rtlMode: true, align: 'right' });
    if (subtitle) slide.addText(subtitle, { x: 1.2, y: 0.55, w: 11.6, h: 0.32, fontSize: 12, color: 'FECACA', rtlMode: true, align: 'right' });
    slide.addText('معامل RT LAB للتحاليل التشخيصية - معامل رامي مختار | 01100874444', {
      x: 0.3, y: 7.1, w: 12.7, h: 0.3, fontSize: 10, color: '6B7280', align: 'center', rtlMode: true,
    });
  };

  for (const spec of slides) {
    const chunks: string[][][] = [];
    if (spec.table) {
      for (let i = 0; i < spec.table.rows.length; i += ROWS_PER_SLIDE) chunks.push(spec.table.rows.slice(i, i + ROWS_PER_SLIDE));
      if (chunks.length === 0) chunks.push([]);
    } else {
      chunks.push([]);
    }
    chunks.forEach((rows, idx) => {
      const slide = pptx.addSlide();
      addChrome(slide, spec.title + (chunks.length > 1 ? ` (${idx + 1}/${chunks.length})` : ''), spec.subtitle);
      let y = 1.2;
      if (idx === 0 && spec.lines && spec.lines.length) {
        slide.addText(spec.lines.join('\n'), { x: 0.5, y, w: 12.3, h: Math.min(2.2, 0.32 * spec.lines.length + 0.2), fontSize: 14, color: '111827', rtlMode: true, align: 'right', valign: 'top' });
        y += Math.min(2.2, 0.32 * spec.lines.length + 0.2) + 0.1;
      }
      if (spec.table) {
        const head = spec.table.headers.map(h => ({ text: h, options: { bold: true, color: 'FFFFFF', fill: { color: '1E3A8A' }, align: 'center' as const } }));
        const body = rows.map(r => r.map(c => ({ text: String(c ?? ''), options: { align: 'center' as const } })));
        slide.addTable([head, ...body], {
          x: 0.5, y, w: 12.3, fontSize: 11, color: '111827', rtlMode: true,
          border: { type: 'solid', pt: 0.5, color: 'CBD5E1' }, fill: { color: 'FFFFFF' },
        } as any);
      }
    });
  }
  await pptx.writeFile({ fileName: filename.endsWith('.pptx') ? filename : `${filename}.pptx` });
}

export function exportCsv(filename: string, headers: string[], rows: (string | number | undefined)[][]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename.endsWith('.csv') ? filename : `${filename}.csv`);
}
