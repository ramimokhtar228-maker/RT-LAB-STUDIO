/**
 * RT LAB - Presentation & PowerPoint Slide Deck Exporter
 * Generates PowerPoint compatible presentation files (.ppt) styled with RT LAB crimson & blue identity.
 */

export interface SlideContent {
  title: string;
  subtitle?: string;
  category?: string;
  sections: {
    heading?: string;
    bullets?: string[];
    table?: {
      headers: string[];
      rows: string[][];
    };
    highlight?: string;
  }[];
}

export function exportToPowerPoint(filename: string, presentationTitle: string, slides: SlideContent[]) {
  const slidesHtml = slides.map((slide, index) => `
    <div class="slide">
      <div class="slide-header">
        <div class="lab-brand">معامل RT LAB للتحاليل التشخيصية • د. رامي مختار</div>
        <div class="slide-number">شريحة ${index + 1} من ${slides.length}</div>
      </div>
      <div class="slide-content">
        ${slide.category ? `<div class="slide-category">${slide.category}</div>` : ''}
        <h2 class="slide-title">${slide.title}</h2>
        ${slide.subtitle ? `<div class="slide-subtitle">${slide.subtitle}</div>` : ''}
        
        <div class="slide-body">
          ${slide.sections.map(sec => `
            <div class="section-box">
              ${sec.heading ? `<h3 class="section-heading">${sec.heading}</h3>` : ''}
              ${sec.highlight ? `<div class="section-highlight">${sec.highlight}</div>` : ''}
              ${sec.bullets ? `
                <ul class="bullet-list">
                  ${sec.bullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
              ` : ''}
              ${sec.table ? `
                <table class="slide-table">
                  <thead>
                    <tr>${sec.table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
                  </thead>
                  <tbody>
                    ${sec.table.rows.map(row => `
                      <tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="slide-footer">
        <span>الفرع الرئيسي: ميدان بهتيم برج صيدلية العزبي الدور الثالث شبرا الخيمة</span>
        <span>تليفونات المعامل: 01100874444 • 01100046841 • 01013242777</span>
      </div>
    </div>
  `).join('\n<hr class="page-break" />\n');

  const fullHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${presentationTitle}</title>
<style>
  @page {
    size: landscape;
    margin: 0;
  }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    background-color: #0f172a;
    color: #1e293b;
    margin: 0;
    padding: 20px;
    direction: rtl;
  }
  .slide {
    width: 100%;
    max-width: 1000px;
    min-height: 600px;
    margin: 0 auto 30px auto;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    border: 3px solid #881337;
    padding: 30px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
  }
  .slide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #881337;
    padding-bottom: 12px;
    margin-bottom: 15px;
  }
  .lab-brand {
    font-weight: 900;
    font-size: 15px;
    color: #881337;
  }
  .slide-number {
    font-size: 12px;
    font-weight: bold;
    color: #64748b;
  }
  .slide-category {
    display: inline-block;
    background: #ffe4e6;
    color: #881337;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 8px;
  }
  .slide-title {
    font-size: 24px;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 6px 0;
  }
  .slide-subtitle {
    font-size: 13px;
    color: #475569;
    margin-bottom: 15px;
  }
  .slide-body {
    flex: 1;
  }
  .section-box {
    margin-bottom: 15px;
  }
  .section-heading {
    font-size: 14px;
    font-weight: 800;
    color: #1e3a8a;
    margin-bottom: 8px;
  }
  .section-highlight {
    background: #f8fafc;
    border-right: 4px solid #881337;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 10px;
  }
  .bullet-list {
    margin: 0;
    padding-right: 20px;
    font-size: 13px;
    line-height: 1.8;
  }
  .slide-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    margin-top: 10px;
  }
  .slide-table th {
    background: #881337;
    color: #ffffff;
    padding: 8px 10px;
    text-align: right;
    font-weight: 800;
  }
  .slide-table td {
    padding: 6px 10px;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 600;
  }
  .slide-footer {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 10px;
    margin-top: 15px;
  }
  .page-break {
    display: none;
  }
  @media print {
    body {
      background: none;
      padding: 0;
    }
    .slide {
      border: none;
      box-shadow: none;
      margin: 0;
      width: 100vw;
      height: 100vh;
      page-break-after: always;
    }
  }
</style>
</head>
<body>
  ${slidesHtml}
</body>
</html>`;

  // Create downloadable file with PowerPoint MIME type
  const blob = new Blob([fullHtml], { type: 'application/vnd.ms-powerpoint;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.ppt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
