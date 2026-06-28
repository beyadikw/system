/* lib.jsx — مكوّنات مشتركة + رسوم بيانية (خذ بيدي) */

function Icon({ name, tone, size, className = '', style = {} }) {
  const cls = ['da-icon', tone ? `tone-${tone}` : '', className].filter(Boolean).join(' ');
  const s = size ? { width: size, height: size, ...style } : style;
  return (
    <svg className={cls} viewBox="0 0 24 24" style={s} aria-hidden="true">
      <use href={`assets/icons.svg#icon-${name}`} />
    </svg>
  );
}
function IconPlate({ name, tone = 'gold', size = 36 }) {
  const cls = ['da-icon-plate', tone ? `tone-${tone}` : ''].filter(Boolean).join(' ');
  return (
    <span className={cls} style={{ width: size, height: size }}>
      <Icon name={name} tone={tone} />
    </span>
  );
}

function StatusPill({ status }) {
  const meta = window.SEED.STATUS_META[status];
  return <span className={`pill ${status}`}>{meta.label}</span>;
}

/* ---------- KPI card ---------- */
function Kpi({ icon, tone = 'gold', label, value, unit, delta, deltaDir, foot }) {
  return (
    <div className="kpi">
      <div className="top">
        <IconPlate name={icon} tone={tone} />
        <span className="lbl">{label}</span>
      </div>
      <div className="val">{value}{unit && <small>{unit}</small>}</div>
      <div className="foot">
        {delta && <span className={`delta ${deltaDir || 'up'}`}>{deltaDir === 'down' ? '↓' : '↑'} {delta}</span>}
        {foot && <span>{foot}</span>}
      </div>
    </div>
  );
}

/* ============================================================
   DONUT chart
   props: data = [{label, value, color}], size, thickness, centerLabel, centerSub
   ============================================================ */
function Donut({ data, size = 168, thickness = 26, centerValue, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = data.map((d, i) => {
    const frac = d.value / total;
    const len = frac * circ;
    const seg = (
      <circle key={i} cx={cx} cy={cy} r={r} fill="none"
        stroke={d.color} strokeWidth={thickness}
        strokeDasharray={`${len} ${circ - len}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        style={{ transition: 'stroke-dasharray 800ms var(--ease-standard)' }} />
    );
    offset += len;
    return seg;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--da-bg)" strokeWidth={thickness} />
      {segs}
      {centerValue != null && (
        <g style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
          <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 30, fontWeight: 700, fill: 'var(--bk-ink)', fontFamily: 'var(--font-sans)' }}>{centerValue}</text>
          <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: 11.5, fill: 'var(--da-muted)', fontFamily: 'var(--font-sans)' }}>{centerLabel}</text>
        </g>
      )}
    </svg>
  );
}

function DonutWithLegend({ data, centerValue, centerLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
      <Donut data={data} centerValue={centerValue} centerLabel={centerLabel} />
      <div className="legend" style={{ flex: 1, minWidth: 160 }}>
        {data.map((d, i) => (
          <div className="li" key={i}>
            <span className="sw" style={{ background: d.color }}></span>
            <span className="nm">{d.label}</span>
            <span className="v">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Horizontal BARS
   props: data = [{name, sub, value, color}], max
   ============================================================ */
function Bars({ data, unit }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div className="row" key={i}>
          <div className="nm">{d.name}{d.sub && <small>{d.sub}</small>}</div>
          <div className="track">
            <div className="fill" style={{ width: `${(d.value / max) * 100}%`, background: d.color || 'var(--bk-gold)' }}></div>
          </div>
          <div className="vv">{d.value}{unit}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   AREA + LINE chart (time series)
   props: data = [{m, y, count}]
   ============================================================ */
function AreaLine({ data, height = 200 }) {
  const w = 640, h = height, padL = 30, padR = 14, padT = 16, padB = 34;
  const max = Math.max(...data.map(d => d.count)) * 1.15;
  const iw = w - padL - padR, ih = h - padT - padB;
  const x = (i) => padL + (i / (data.length - 1)) * iw;
  const y = (v) => padT + ih - (v / max) * ih;
  const linePts = data.map((d, i) => `${x(i)},${y(d.count)}`).join(' ');
  const areaPts = `${padL},${padT + ih} ${linePts} ${x(data.length - 1)},${padT + ih}`;
  const gridVals = [0, Math.round(max / 2), Math.round(max)];
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--bk-gold)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--bk-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridVals.map((g, i) => (
        <g key={i}>
          <line x1={padL} x2={w - padR} y1={y(g)} y2={y(g)} stroke="var(--da-line)" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '3 4'} />
          <text x={padL - 8} y={y(g) + 4} textAnchor="end" style={{ fontSize: 10, fill: 'var(--da-faint)', fontFamily: 'var(--font-sans)' }} transform="scale(1,1)">{g}</text>
        </g>
      ))}
      <polygon points={areaPts} fill="url(#areaGrad)" />
      <polyline points={linePts} fill="none" stroke="var(--bk-gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.count)} r="3.5" fill="#fff" stroke="var(--bk-gold-deep)" strokeWidth="2" />
          <text x={x(i)} y={y(d.count) - 10} textAnchor="middle" style={{ fontSize: 10.5, fontWeight: 700, fill: 'var(--bk-ink)', fontFamily: 'var(--font-sans)' }}>{d.count}</text>
          <text x={x(i)} y={h - 14} textAnchor="middle" style={{ fontSize: 10.5, fill: 'var(--da-muted)', fontFamily: 'var(--font-sans)' }}>{d.m}</text>
        </g>
      ))}
    </svg>
  );
}

/* small inline sparkline */
function Spark({ data, color = 'var(--bk-gold)', w = 90, h = 28 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = (max - min) || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- helpers ---------- */
function hallName(id) { const x = window.SEED.HALLS.find(h => h.id === id); return x ? x.name : id; }
function catName(id) { const x = window.SEED.CATS.find(c => c.id === id); return x ? x.name : id; }

/* ---------- تواريخ ---------- */
// ينسّق تاريخ ISO (YYYY-MM-DD) إلى نص عربي
function fmtDateAr(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch (e) { return iso; }
}
// عدد الأيام بين تاريخين شاملاً الطرفين
function daysBetween(fromIso, toIso) {
  if (!fromIso) return 0;
  const a = new Date(fromIso + 'T00:00:00'); const b = new Date((toIso || fromIso) + 'T00:00:00');
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}
// يبني نص التواريخ المعروض من مدى
function fmtDateRange(fromIso, toIso) {
  if (!fromIso) return '';
  if (!toIso || toIso === fromIso) return fmtDateAr(fromIso);
  return `من ${fmtDateAr(fromIso)} إلى ${fmtDateAr(toIso)}`;
}

/* ============================================================
   تنزيل الطلب مع المرفقات (حزمة ZIP)
   ============================================================ */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
}

function requestDocHTML(req) {
  const cats = (req.cats || []).map(catName).join('، ');
  const terms = [
    { t: 'المحافظة على مرافق القاعة ومحتوياتها', d: 'نرجو المحافظة على جميع مرافق ومعدات القاعة، وفي حال حدوث أي تلف أو ضرر — لا قدّر الله — تتحمّل الجهة المنظّمة مسؤولية إصلاحه أو تعويضه.' },
    { t: 'الالتزام بمواعيد الحجز', d: 'يرجى الالتزام بالوقت المحدّد لبداية الفعالية وانتهائها، بما يضمن حسن تنظيم الحجوزات والاستفادة المثلى من القاعة.' },
    { t: 'تعديل موعد الحجز', d: 'يمكن طلب تعديل موعد الحجز لمرّة واحدة فقط، على أن يتمّ ذلك قبل موعد الفعالية بـ 72 ساعة على الأقل، ويخضع التعديل لتوفّر القاعة في الموعد المطلوب.' },
    { t: 'إبراز هوية المشروع', d: 'يلتزم المستفيد بوضع شعار مشروع خذ بيدي على جميع التصاميم والإعلانات الخاصة بالفعالية، مع الإشارة إلى حساب المشروع عبر وسائل التواصل الاجتماعي: @beyadikw' },
    { t: 'تزويد المشروع بالصور', d: 'يرجى تزويد المشروع بمجموعة من الصور الاحترافية وعالية الجودة التي توثّق الفعالية، لاستخدامها في النشر الإعلامي أو التقارير الخاصة بالمشروع.' },
    { t: 'تزويد المشروع بمقطع فيديو (إن وجد)', d: 'في حال توفّر مقطع فيديو يوثّق الفعالية، نأمل تزويد المشروع بنسخة عالية الجودة، للاستفادة منها في التغطية الإعلامية أو التقارير.' },
  ];
  const row = (k, v) => `<tr><th>${k}</th><td>${v || '—'}</td></tr>`;
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>طلب رعاية فعالية · ${req.id}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: 'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif; color:#2A2520; margin:0; padding:32px; background:#fff; line-height:1.7; }
  .doc { max-width: 800px; margin:0 auto; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #B8924A; padding-bottom:16px; margin-bottom:6px; }
  .head .brand { display:flex; align-items:center; gap:13px; }
  .head .brand img { height:52px; width:auto; }
  .head .brand b { font-size:24px; color:#2A2520; letter-spacing:-.5px; }
  .head .brand small { display:block; color:#7a7268; font-size:12px; margin-top:2px; }
  .head .ref { text-align:left; font-size:12px; color:#7a7268; }
  .head .ref b { display:block; font-family:monospace; font-size:18px; color:#B8924A; }
  h1 { font-size:18px; margin:18px 0 14px; color:#2A2520; }
  h1 .pill { font-size:11px; background:#F4ECD9; color:#997633; padding:3px 12px; border-radius:100px; margin-inline-start:8px; vertical-align:middle; }
  table { width:100%; border-collapse:collapse; margin-bottom:18px; }
  th,td { text-align:right; padding:9px 12px; border-bottom:1px solid #eee; font-size:13.5px; vertical-align:top; }
  th { color:#7a7268; font-weight:600; width:170px; background:#FBF6EA; }
  .sec-title { font-size:14px; font-weight:700; margin:20px 0 8px; padding-inline-start:10px; border-inline-start:4px solid #B8924A; }
  ol { margin:0; padding-inline-start:20px; font-size:13px; color:#4A433B; }
  ol li { margin-bottom:6px; }
  .agreed { display:inline-flex; align-items:center; gap:8px; background:#E5F5EA; color:#1E7A32; padding:8px 16px; border-radius:10px; font-size:13px; font-weight:600; margin-top:6px; }
  .approval { margin-top:30px; border:1.5px solid #B8924A; border-radius:12px; padding:18px 20px; }
  .approval h3 { margin:0 0 14px; font-size:14px; color:#997633; }
  .approval .grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .approval .box { font-size:12.5px; color:#7a7268; }
  .approval .line { border-bottom:1px solid #999; height:30px; margin-top:6px; }
  .opts { display:flex; gap:24px; font-size:13px; margin-bottom:14px; }
  .opts span { display:inline-flex; align-items:center; gap:8px; }
  .opts .sq { width:16px; height:16px; border:1.5px solid #2A2520; display:inline-block; border-radius:3px; }
  .foot { margin-top:26px; padding-top:12px; border-top:1px solid #eee; font-size:11px; color:#9a9388; text-align:center; }
  @media print { body { padding:0; } }
</style></head>
<body><div class="doc">
  <div class="head">
    <div class="brand"><img src="${window.BK_LOGO || ''}" alt="خذ بيدي"><div><b>خذ بيدي</b><small>بوابة طلبات رعاية الفعاليات</small></div></div>
    <div class="ref">رقم الطلب<b>${req.id}</b>تاريخ التقديم: ${req.submitted || '—'}</div>
  </div>
  <h1>نموذج طلب رعاية فعالية</h1>
  <div class="sec-title">بيانات الفعالية</div>
  <table>
    ${row('اسم الفعالية', req.event)}
    ${row('الجهة الطالبة', req.org)}
    ${row('المحاضر', req.lecturer)}
    ${row('أهداف الفعالية', req.goals)}
    ${row('محاور الفعالية', req.axes)}
    ${row('الفئة المستهدفة', cats)}
  </table>
  <div class="sec-title">القاعة والموعد والتواصل</div>
  <table>
    ${row('القاعة المطلوبة', hallName(req.hall))}
    ${row('التواريخ المقترحة', req.dates)}
    ${row('عدد الأيام', req.days ? req.days + ' يوم' : '')}
    ${row('رقم الهاتف', req.phone)}
    ${row('حساب الإنستقرام', req.insta)}
    ${row('ملاحظات', req.notes)}
  </table>
  <div class="sec-title">الشروط والأحكام</div>
  <ol>${terms.map(t => `<li><b>${t.t}</b><br>${t.d}</li>`).join('')}</ol>
  <div class="agreed">✓ أتعهّدت الجهة الطالبة بأنها اطّلعت على الشروط والأحكام ووافقت على الالتزام بها كاملة.</div>
  <div class="sec-title" style="margin-top:18px">المرفقات</div>
  <ol>
    <li>طلب رعاية فعالية موقّع من الجهة الطالبة.</li>
    <li>السيرة الذاتية للمحاضر.</li>
  </ol>
  <div class="foot">صدر هذا النموذج عن مشروع «خذ بيدي» — ثلث المرحوم عبدالله عبداللطيف العثمان</div>
</div></body></html>`;
}

/** يجلب الملف من رابطه (الوضع الحيّ) ويعيده Blob، أو يعيد الـ Blob/File كما هو (الوضع التجريبي) */
async function resolveFileBlob(f) {
  if (!f) return null;
  if (f instanceof Blob) return f;            // ملف مرفوع محلياً (File/Blob)
  if (f.url) {                                 // مرفوع على الخادم — نجلبه برابطه
    try { const res = await fetch(f.url); if (res.ok) return await res.blob(); } catch (e) {}
  }
  return null;
}

async function downloadAttachment(req, which) {
  const f = req.files && req.files[which];
  const blob = await resolveFileBlob(f);
  if (blob) { triggerDownload(blob, (f && f.name) || `${which}-${req.id}`); return; }
  const txt = which === 'request' ? 'ملف طلب الرعاية الموقّع من الجهة الطالبة' : 'السيرة الذاتية للمحاضر';
  const nm = which === 'request' ? 'طلب-رعاية-موقّع' : 'السيرة-الذاتية-للمحاضر';
  triggerDownload(new Blob(['\ufeff(لا يوجد ملف مرفوع) — ' + txt + ' للطلب ' + req.id], { type: 'text/plain;charset=utf-8' }), `${nm}-${req.id}.txt`);
}

async function downloadRequestPackage(req) {
  const docHtml = '\ufeff' + requestDocHTML(req);
  if (!window.JSZip) {
    triggerDownload(new Blob([docHtml], { type: 'text/html;charset=utf-8' }), `طلب-${req.id}.html`);
    return;
  }
  const zip = new window.JSZip();
  zip.file(`نموذج-الطلب-${req.id}.html`, docHtml);
  const att = zip.folder('المرفقات');
  const reqBlob = await resolveFileBlob(req.files && req.files.request);
  if (reqBlob) att.file((req.files.request.name) || `طلب-رعاية-موقّع-${req.id}`, reqBlob);
  else att.file(`طلب-رعاية-موقّع-${req.id}.txt`, '\ufeff(لا يوجد ملف مرفوع) — يُرفق هنا ملف طلب الرعاية الموقّع من الجهة الطالبة.');
  const cvBlob = await resolveFileBlob(req.files && req.files.cv);
  if (cvBlob) att.file((req.files.cv.name) || `السيرة-الذاتية-${req.id}`, cvBlob);
  else att.file(`السيرة-الذاتية-للمحاضر-${req.id}.txt`, '\ufeff(لا يوجد ملف مرفوع) — تُرفق هنا السيرة الذاتية للمحاضر.');
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, `طلب-رعاية-${req.id}.zip`);
}

/* ============================================================
   وثيقة التقرير الختامي + طباعة PDF + تنزيل Word
   ============================================================ */
function reportDocHTML(req) {
  const rep = req.report || {};
  const photos = (rep.photoData || []).filter(Boolean);
  const pct = rep.capacity ? Math.round((rep.attendees / rep.capacity) * 100) : 0;
  const cats = (req.cats || []).map(catName).join('، ');
  const GOLD = '#B8924A', INK = '#2A2520', MUT = '#7a7268';
  const intro = 'مشروع «خذ بيدي» مجموعة من البرامج والأنشطة الداعمة للمجتمع بالتعاون مع الجهات المتخصّصة، تستهدف الأطفال والشباب والأمهات لإمدادهم بالمعلومات اللازمة لتطوير مهاراتهم وقدراتهم، من خلال الدورات التدريبية والمحاضرات والبرامج التوعوية والثقافية الهادفة. والمشروع مساهمة ومبادرة من ثلث المرحوم عبدالله عبداللطيف العثمان تحت إشراف بيت الزكاة، ومن خلال مبرّة المتميّزين بالتعاون مع دار العثمان ومركز البروميناد الثقافي، وهو معتمد من وزارة الشؤون الاجتماعية.';

  const h2 = (t) => `<h2 style="font-size:16px; color:${INK}; margin:26px 0 10px; padding-bottom:7px; border-bottom:2px solid ${GOLD};">${t}</h2>`;
  const para = (t) => `<p style="font-size:14px; line-height:1.9; color:#3a342d; margin:0 0 10px; text-align:justify; white-space:pre-wrap;">${t}</p>`;
  const drow = (k, v) => `<tr>
    <td style="width:38%; background:#FBF6EA; color:${MUT}; font-size:13px; padding:9px 14px; border:1px solid #EADFC4; font-weight:600;">${k}</td>
    <td style="font-size:14px; color:${INK}; padding:9px 14px; border:1px solid #EADFC4;">${v || '—'}</td></tr>`;

  const photoRows = (() => {
    if (!photos.length) {
      return `<tr><td colspan="2" style="padding:26px; text-align:center; color:#b5b0a6; font-size:13px; border:1px dashed #d8d2c4;">تُرفق هنا صور عالية الجودة من الفعالية (حتى ٦ صور).</td></tr>`;
    }
    let html = '';
    for (let i = 0; i < photos.length; i += 2) {
      html += '<tr>';
      for (let j = i; j < i + 2; j++) {
        if (photos[j]) html += `<td style="width:50%; padding:6px; border:none;"><img src="${photos[j]}" width="330" style="width:100%; max-width:330px; border-radius:8px; border:1px solid #eee;" alt="صورة ${j + 1}"></td>`;
        else html += '<td style="width:50%; border:none;"></td>';
      }
      html += '</tr>';
    }
    return html;
  })();

  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>تقرير فعالية · ${req.event}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: 'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif; color:${INK}; margin:0; padding:34px; line-height:1.8; }
  .doc { max-width:820px; margin:0 auto; }
  table { border-collapse:collapse; }
</style></head>
<body><div class="doc">

  <div style="text-align:center; padding-bottom:18px; border-bottom:3px solid ${GOLD}; margin-bottom:6px;">
    <img src="${window.BK_LOGO || ''}" alt="خذ بيدي" style="height:84px; width:auto;">
    <div style="font-size:13px; letter-spacing:3px; color:${MUT}; margin-top:8px;">مشروع خذ بيدي · تقرير فعالية ٢٠٢٦</div>
  </div>

  <div style="text-align:center; margin:24px 0 6px;">
    <div style="font-size:12px; letter-spacing:2px; color:${GOLD}; font-weight:700;">تقرير ختامي للفعالية</div>
    <h1 style="font-size:26px; color:${INK}; margin:8px 0 6px;">${req.event}</h1>
    <div style="font-size:13px; color:${MUT};">${req.org} · ${req.dates}</div>
  </div>

  ${h2('نبذة عن المشروع')}
  ${para(intro)}

  ${h2('بيانات الفعالية')}
  <table width="100%">
    ${drow('اسم الفعالية', req.event)}
    ${drow('الجهة المنفّذة', req.org)}
    ${drow('المحاضر', req.lecturer)}
    ${drow('القاعة', hallName(req.hall))}
    ${drow('التاريخ', req.dates)}
    ${drow('عدد الأيام', req.days ? req.days + ' يوم' : '')}
    ${drow('الفئة المستهدفة', cats)}
    ${drow('عدد المستفيدين', `${rep.attendees} مستفيد` + (rep.capacity ? ` (نسبة إشغال ${pct}٪ من سعة ${rep.capacity})` : ''))}
    ${drow('توثيق مصوّر', `${photos.length || '—'} صورة${rep.video ? ' · فيديو متوفّر' : ''}`)}
  </table>

  ${req.goals ? h2('أهداف الفعالية') + para(req.goals) : ''}
  ${req.axes ? h2('محاور الفعالية') + para(req.axes) : ''}
  ${rep.summary ? h2('ملخّص الفعالية') + para(rep.summary) : ''}
  ${rep.outcomes ? h2('النتائج والأثر') + para(rep.outcomes) : ''}

  ${h2('التوثيق المصوّر')}
  <table width="100%">${photoRows}</table>

  ${rep.notes ? h2('ملاحظات وتوصيات') + para(rep.notes) : ''}

  <div style="margin-top:30px; padding-top:14px; border-top:2px solid ${GOLD}; font-size:11.5px; color:${MUT}; text-align:center; line-height:1.7;">
    صدر هذا التقرير عن مشروع «خذ بيدي» — ثلث المرحوم عبدالله عبداللطيف العثمان<br>
    بإشراف بيت الزكاة · مبرّة المتميّزين · بالتعاون مع دار العثمان ومركز البروميناد الثقافي
  </div>
</div></body></html>`;
}

function printHTML(html) {
  const ifr = document.createElement('iframe');
  ifr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(ifr);
  const d = ifr.contentWindow.document;
  d.open(); d.write(html); d.close();
  const go = () => { try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch (e) {} };
  ifr.onload = () => { setTimeout(go, 300); setTimeout(() => ifr.remove(), 60000); };
  setTimeout(go, 700);
}

/** اسم ملف آمن من اسم الفعالية */
function safeFileName(s) {
  return String(s || 'تقرير').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** يحوّل رابط صورة إلى Data URL (لتضمينها في ملف Word بحيث تظهر دون إنترنت) */
async function imgToDataURL(url) {
  if (!url || /^data:/i.test(url)) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => resolve(url);
      fr.readAsDataURL(blob);
    });
  } catch (e) { return url; }
}

/** نسخة من الطلب بصور مُضمَّنة (Data URLs) — تُستخدم لملف Word */
async function reqWithEmbeddedImages(req) {
  const rep = req.report || {};
  const photos = await Promise.all((rep.photoData || []).map(imgToDataURL));
  return { ...req, report: { ...rep, photoData: photos } };
}

function downloadReportPDF(req) { printHTML(reportDocHTML(req)); }

async function downloadReportWord(req) {
  const embedded = await reqWithEmbeddedImages(req);   // ضمّن الصور لتظهر في Word
  triggerDownload(new Blob(['\ufeff' + reportDocHTML(embedded)], { type: 'application/msword' }), `تقرير - ${safeFileName(req.event)}.doc`);
}

Object.assign(window, { Icon, IconPlate, StatusPill, Kpi, Donut, DonutWithLegend, Bars, AreaLine, Spark, hallName, catName, fmtDateAr, daysBetween, fmtDateRange, triggerDownload, requestDocHTML, downloadAttachment, downloadRequestPackage, reportDocHTML, printHTML, downloadReportPDF, downloadReportWord });
