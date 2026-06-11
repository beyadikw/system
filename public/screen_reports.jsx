/* screen_reports.jsx — التقارير الختامية للفعاليات */
const { useState: useStateRp, useEffect: useEffectRp, useRef: useRefRp } = React;

function hallCap(id) { const h = window.SEED.HALLS.find(x => x.id === id); return h ? h.cap : 0; }

/* ---------- 6-slot photo uploader ---------- */
function PhotoUploader({ photos, onChange }) {
  const refs = useRefRp([]);
  function pick(i, file) {
    const r = new FileReader();
    r.onload = e => { const next = [...photos]; next[i] = e.target.result; onChange(next); };
    r.readAsDataURL(file);
  }
  return (
    <div className="upgrid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`upslot ${photos[i] ? 'filled' : ''}`} onClick={() => refs.current[i] && refs.current[i].click()}
          style={photos[i] ? { backgroundImage: `url(${photos[i]})` } : {}}>
          <input type="file" accept="image/*" ref={el => refs.current[i] = el} style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) pick(i, e.target.files[0]); }} />
          {!photos[i] && <React.Fragment><Icon name="monitoring" tone="gold" /><span>صورة {i + 1}</span></React.Fragment>}
          {photos[i] && <button className="rm" onClick={ev => { ev.stopPropagation(); const n = [...photos]; n[i] = null; onChange(n); }}>×</button>}
        </div>
      ))}
    </div>
  );
}

/* ---------- shared report form fields ---------- */
function ReportForm({ req, external, onSave, onCancel }) {
  const cap = hallCap(req.hall);
  const init = req.report || {};
  const [attendees, setAttendees] = useStateRp(init.attendees != null ? String(init.attendees) : '');
  const [video, setVideo] = useStateRp(!!init.video);
  const [summary, setSummary] = useStateRp(init.summary || '');
  const [outcomes, setOutcomes] = useStateRp(init.outcomes || '');
  const [notes, setNotes] = useStateRp(init.notes || '');
  const [photos, setPhotos] = useStateRp(() => {
    const base = Array(6).fill(null);
    (init.photoData || []).forEach((d, i) => { if (i < 6) base[i] = d; });
    return base;
  });
  const [err, setErr] = useStateRp({});

  function save() {
    const e = {};
    if (!String(attendees).trim()) e.attendees = 'مطلوب';
    if (!summary.trim()) e.summary = 'مطلوب';
    setErr(e);
    if (Object.keys(e).length) return;
    onSave(req.id, {
      attendees: Number(attendees), capacity: cap, video,
      summary, outcomes, notes,
      photoData: photos.filter(Boolean),
    });
  }

  return (
    <div>
      <div className="fgrp two">
        <div className="fgrp">
          <label className="flbl">الحضور الفعلي<span className="req">*</span><small>السعة القصوى للقاعة {cap}</small></label>
          <input className={`inp ${err.attendees ? 'err' : ''}`} type="number" value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="0" />
          {err.attendees && <div className="errmsg">{err.attendees}</div>}
        </div>
        <div className="fgrp">
          <label className="flbl">فيديو قصير من الفعالية</label>
          <div className="opt-grid cols2">
            <div className={`opt ${video ? 'sel' : ''}`} onClick={() => setVideo(true)}><span className="mk"></span><div className="ot"><b>متوفّر</b></div></div>
            <div className={`opt ${!video ? 'sel' : ''}`} onClick={() => setVideo(false)}><span className="mk"></span><div className="ot"><b>غير متوفّر</b></div></div>
          </div>
        </div>
      </div>

      <div className="fgrp">
        <label className="flbl">صور الفعالية<small>أرفق حتى ٦ صور عالية الجودة (بند من بنود الرعاية)</small></label>
        <PhotoUploader photos={photos} onChange={setPhotos} />
      </div>

      <div className="fgrp">
        <label className="flbl">ملخّص الفعالية<span className="req">*</span></label>
        <textarea className={`ta ${err.summary ? 'err' : ''}`} value={summary} onChange={e => setSummary(e.target.value)} placeholder="وصف موجز لما جرى في الفعالية ومستوى التفاعل…" />
        {err.summary && <div className="errmsg">{err.summary}</div>}
      </div>
      <div className="fgrp">
        <label className="flbl">النتائج والأثر</label>
        <textarea className="ta" value={outcomes} onChange={e => setOutcomes(e.target.value)} placeholder="ما النتائج الملموسة والأثر الذي تحقّق؟" />
      </div>
      <div className="fgrp">
        <label className="flbl">ملاحظات وتوصيات</label>
        <textarea className="ta" value={notes} onChange={e => setNotes(e.target.value)} placeholder="توصيات للفعاليات القادمة…" />
      </div>

      <div className="spread" style={{ borderTop: '1px solid var(--da-line)', paddingTop: 20 }}>
        {onCancel ? <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button> : <span></span>}
        <button className="btn btn-primary" onClick={save}>
          <Icon name="tasks" />{external ? 'إرسال التقرير إلى خذ بيدي' : 'حفظ ونشر التقرير'}
        </button>
      </div>
    </div>
  );
}

/* ---------- internal report builder ---------- */
function ReportBuilder({ req, onSave, onCancel }) {
  return (
    <div className="formwrap screen">
      <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ marginBottom: 16 }}><Icon name="arrow-right" />رجوع للقائمة</button>
      <div className="card" style={{ padding: '26px 28px' }}>
        <div className="card-h" style={{ marginBottom: 6 }}>
          <IconPlate name="reports" tone="gold" size={36} />
          <h3 style={{ fontSize: 17 }}>إنشاء التقرير الختامي <small>{req.event}</small></h3>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 18 }}>القاعة: {hallName(req.hall)} · السعة {hallCap(req.hall)} · التاريخ {req.dates}</p>
        <ReportForm req={req} onSave={onSave} onCancel={onCancel} />
      </div>
    </div>
  );
}

/* ---------- external (executor) report page ---------- */
function ExternalReportView({ req, onSave, onClose }) {
  const [submitted, setSubmitted] = useStateRp(false);
  return (
    <div className="ext">
      <div className="ext-top">
        <div className="in">
          <img src="assets/khudh-biyadi-logo.png" alt="خذ بيدي" />
          <div className="tt"><b>رفع تقرير الفعالية</b><small>مشروع خذ بيدي · رابط مخصّص للجهة المنفّذة</small></div>
          <button className="x" onClick={onClose} title="إغلاق المعاينة">✕</button>
        </div>
      </div>
      <div className="ext-wrap">
        {!submitted ? (
          <React.Fragment>
            <div className="ext-banner"><Icon name="lock" tone="gold" size={20} />هذه صفحة مخصّصة لـ «{req.org}» لرفع تقرير فعالية «{req.event}». بعد الإرسال يصل التقرير مباشرةً إلى فريق خذ بيدي.</div>
            <div className="card" style={{ padding: '24px 26px' }}>
              <h3 style={{ fontSize: 18, margin: '0 0 4px' }}>{req.event}</h3>
              <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 18 }}>{hallName(req.hall)} · {req.dates} · المحاضر {req.lecturer}</p>
              <ReportForm req={req} external onSave={(id, rep) => { onSave(id, rep); setSubmitted(true); window.scrollTo({ top: 0 }); }} />
            </div>
          </React.Fragment>
        ) : (
          <div className="success-wrap" style={{ margin: '40px auto' }}>
            <div className="seal"><Icon name="tasks" size={50} style={{ '--da-icon-fg-color': 'var(--da-green)', '--da-icon-bg-color': 'transparent' }} /></div>
            <h2>تم استلام تقريركم بنجاح</h2>
            <p>شكراً لكم. وصل تقرير فعالية «{req.event}» إلى فريق مشروع خذ بيدي وأصبح متاحاً في النظام.</p>
            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 14 }}>العودة إلى النظام</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- share-link modal ---------- */
function ShareLinkModal({ req, onClose, onOpenExt }) {
  const link = `https://beyadik.kw/r/${req.id}`;
  const [copied, setCopied] = useStateRp(false);
  function copy() { try { navigator.clipboard.writeText(link); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1800); }
  const msg = encodeURIComponent(`رابط رفع تقرير فعالية «${req.event}» — مشروع خذ بيدي:\n${link}`);
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="card-h" style={{ marginBottom: 6 }}>
          <IconPlate name="globe" tone="gold" size={36} />
          <h3 style={{ fontSize: 16 }}>إرسال رابط للجهة المنفّذة</h3>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>أرسل هذا الرابط لـ «{req.org}» ليقوموا برفع تقرير الفعالية وصوره، وسيصلكم مباشرةً في النظام.</p>
        <div className="linkbox">
          <input value={link} readOnly />
          <button className="btn btn-primary btn-sm" onClick={copy}>{copied ? 'تم النسخ ✓' : 'نسخ'}</button>
        </div>
        <div className="row-flex" style={{ gap: 8 }}>
          <a className="btn btn-ghost btn-sm" href={`https://wa.me/?text=${msg}`} target="_blank" rel="noreferrer" style={{ flex: 1 }}>واتساب</a>
          <a className="btn btn-ghost btn-sm" href={`mailto:?subject=${encodeURIComponent('رابط رفع تقرير الفعالية')}&body=${msg}`} style={{ flex: 1 }}>البريد</a>
        </div>
        <div style={{ borderTop: '1px solid var(--da-line)', margin: '18px 0 14px' }}></div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { onClose(); onOpenExt(req.id); }}>
          <Icon name="arrow-left" />فتح الرابط (معاينة صفحة الجهة المنفّذة)
        </button>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 10, marginBottom: 0, textAlign: 'center' }}>للمعاينة فقط — هكذا ستظهر الصفحة للجهة المنفّذة.</p>
      </div>
    </div>
  );
}

/* ---------- final report view ---------- */
function ReportView({ req, onBack }) {
  const rep = req.report;
  const pct = Math.round((rep.attendees / rep.capacity) * 100);
  const photos = (rep.photoData || []).filter(Boolean);
  const photoCount = photos.length || rep.photos || 6;
  const slots = photos.length ? photos : Array.from({ length: 6 }).map(() => null);
  return (
    <div className="screen">
      <div className="spread" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="arrow-right" />رجوع للقائمة</button>
        <div className="row-flex" style={{ gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => downloadReportPDF(req)}><Icon name="doc" tone="gold" />تنزيل PDF</button>
          <button className="btn btn-primary btn-sm" onClick={() => downloadReportWord(req)}><Icon name="doc" />تنزيل Word</button>
        </div>
      </div>
      <div className="report-doc">
        <div className="report-hero">
          <div className="eyebrow">تقرير ختامي · مشروع خذ بيدي</div>
          <h1>{req.event}</h1>
          <div className="meta">
            <span>الجهة الطالبة: {req.org}</span>
            <span>المحاضر: {req.lecturer}</span>
            <span>{req.dates}</span>
            <span>{hallName(req.hall)}</span>
          </div>
        </div>
        <div className="report-body">
          <div className="report-stats" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <div className="rs"><div className="v">{rep.attendees}<small> / {rep.capacity}</small></div><div className="l">الحضور الفعلي</div></div>
            <div className="rs"><div className="v">{pct}<small>٪</small></div><div className="l">نسبة الإشغال</div></div>
            <div className="rs"><div className="v">{photoCount}</div><div className="l">صور موثّقة</div></div>
            <div className="rs"><div className="v">{rep.video ? '✓' : '—'}</div><div className="l">فيديو</div></div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 26 }}>
            <div>
              <div className="muted" style={{ fontSize: 12.5, marginBottom: 8, fontWeight: 600 }}>نسبة إشغال القاعة</div>
              <div className="bars"><div className="row" style={{ gridTemplateColumns: '1fr 52px' }}>
                <div className="track" style={{ height: 16 }}><div className="fill" style={{ width: pct + '%', background: pct >= 90 ? 'var(--da-green)' : 'var(--bk-gold)' }}></div></div>
                <div className="vv">{pct}٪</div>
              </div></div>
              <div className="row-flex" style={{ flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
                {req.cats.map(c => <span key={c} className="chip gold">{catName(c)}</span>)}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12.5, marginBottom: 8, fontWeight: 600 }}>الالتزام ببنود الرعاية</div>
              {[
                { t: 'وضع شعار المشروع + منشن @beyadikw', ok: true },
                { t: 'صور عالية الجودة من الفعالية', ok: photoCount > 0 },
                { t: 'فيديو قصير من الفعالية', ok: rep.video },
              ].map((x, i) => (
                <div key={i} className="row-flex" style={{ gap: 9, padding: '6px 0', fontSize: 13 }}>
                  <Icon name={x.ok ? 'tasks' : 'alert'} size={18} style={x.ok ? { '--da-icon-fg-color': 'var(--da-green)', '--da-icon-bg-color': 'transparent' } : { '--da-icon-fg-color': 'var(--da-faint)', '--da-icon-bg-color': 'transparent' }} />
                  <span style={{ color: x.ok ? 'var(--da-ink)' : 'var(--da-muted)' }}>{x.t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-sec"><h4>ملخّص الفعالية</h4><p>{rep.summary}</p></div>
          {rep.outcomes && <div className="report-sec"><h4>النتائج والأثر</h4><p>{rep.outcomes}</p></div>}

          <div className="report-sec">
            <h4>توثيق مصوّر <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>· {photoCount} صورة</span></h4>
            <div className="photo-grid">
              {slots.map((d, i) => (
                <div className="photo-slot" key={i} style={d ? { backgroundImage: `url(${d})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                  {!d && <React.Fragment><Icon name="monitoring" tone="neutral" size={28} /><div className="cap">صورة {i + 1} من الفعالية</div></React.Fragment>}
                </div>
              ))}
            </div>
          </div>

          {rep.notes && <div className="report-sec"><h4>ملاحظات وتوصيات</h4><p>{rep.notes}</p></div>}

          <div style={{ borderTop: '1px solid var(--da-line)', marginTop: 20, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
              صدر هذا التقرير عن مشروع «خذ بيدي» — ثلث المرحوم عبدالله عبداللطيف العثمان
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- reports screen ---------- */
function ReportsScreen({ requests, onSaveReport, focusId, onClearFocus }) {
  const [mode, setMode] = useStateRp('list'); // list | build | view
  const [sel, setSel] = useStateRp(null);
  const [shareId, setShareId] = useStateRp(null);
  const [extId, setExtId] = useStateRp(null);

  const doneReqs = requests.filter(r => r.status === 'approved');
  const withReport = doneReqs.filter(r => r.report);
  const pending = doneReqs.filter(r => !r.report);

  useEffectRp(() => {
    if (focusId) {
      const r = requests.find(x => x.id === focusId);
      if (r && r.status === 'approved') { setSel(focusId); setMode(r.report ? 'view' : 'build'); }
      onClearFocus && onClearFocus();
    }
  }, [focusId]);

  const selReq = requests.find(r => r.id === sel);
  const shareReq = requests.find(r => r.id === shareId);
  const extReq = requests.find(r => r.id === extId);

  // external overlay can appear over any mode — portal to body so it covers the full viewport
  const overlay = ReactDOM.createPortal(
    <React.Fragment>
      {shareReq && <ShareLinkModal req={shareReq} onClose={() => setShareId(null)} onOpenExt={(id) => setExtId(id)} />}
      {extReq && <ExternalReportView req={extReq} onSave={onSaveReport} onClose={() => setExtId(null)} />}
    </React.Fragment>,
    document.body
  );

  if (mode === 'build' && selReq) {
    return <React.Fragment><ReportBuilder req={selReq} onCancel={() => { setMode('list'); setSel(null); }} onSave={(id, rep) => { onSaveReport(id, rep); setMode('view'); }} />{overlay}</React.Fragment>;
  }
  if (mode === 'view' && selReq && selReq.report) {
    return <React.Fragment><ReportView req={selReq} onBack={() => { setMode('list'); setSel(null); }} />{overlay}</React.Fragment>;
  }

  return (
    <div className="screen">
      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--bk-gold-line)', background: 'var(--bk-gold-tint)' }}>
          <div className="card-h">
            <IconPlate name="alert" tone="warm" size={34} />
            <h3>فعاليات بانتظار التقرير الختامي <small>{pending.length}</small></h3>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))' }}>
            {pending.map(r => (
              <div key={r.id} style={{ background: '#fff', border: '1px solid var(--bk-gold-line)', borderRadius: 12, padding: 16 }}>
                <div className="spread" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                  <div><b style={{ fontSize: 14 }}>{r.event}</b><div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{r.org} · {r.dates}</div></div>
                  <StatusPill status={r.status} />
                </div>
                <div className="row-flex" style={{ gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => { setSel(r.id); setMode('build'); }}><Icon name="plus" />إنشاء التقرير</button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShareId(r.id)}><Icon name="globe" tone="gold" />رابط للجهة المنفّذة</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-h" style={{ marginBottom: 14, paddingInline: 2 }}>
        <IconPlate name="reports" tone="gold" size={34} />
        <h3>التقارير المنشورة <small>{withReport.length} تقرير</small></h3>
      </div>
      {withReport.length === 0 && <div className="empty"><Icon name="reports" tone="neutral" />لا توجد تقارير منشورة بعد.</div>}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))' }}>
        {withReport.map(r => {
          const pct = Math.round((r.report.attendees / r.report.capacity) * 100);
          const pc = (r.report.photoData || []).filter(Boolean).length || r.report.photos || 6;
          return (
            <div key={r.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => { setSel(r.id); setMode('view'); }}>
              <div style={{ background: 'var(--bk-ink)', color: '#fff', padding: '16px 18px', position: 'relative' }}>
                <div style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--bk-gold-bright)' }}>تقرير ختامي</div>
                <b style={{ fontSize: 15.5, display: 'block', marginTop: 4, lineHeight: 1.4 }}>{r.event}</b>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.65)', marginTop: 4 }}>{r.dates} · {hallName(r.hall)}</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <div className="spread" style={{ marginBottom: 12 }}>
                  <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--bk-ink)' }}>{r.report.attendees}<span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>/{r.report.capacity}</span></div><div className="muted" style={{ fontSize: 11 }}>الحضور</div></div>
                  <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--bk-ink)' }}>{pct}<span className="muted" style={{ fontSize: 12 }}>٪</span></div><div className="muted" style={{ fontSize: 11 }}>الإشغال</div></div>
                  <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--bk-ink)' }}>{pc}</div><div className="muted" style={{ fontSize: 11 }}>صور</div></div>
                </div>
                <div className="row-flex" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {r.report.video && <span className="chip gold" style={{ fontSize: 10.5 }}>فيديو ✓</span>}
                  <span className="more" style={{ marginInlineStart: 'auto', fontSize: 12 }}>عرض ←</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {overlay}
    </div>
  );
}
window.ReportsScreen = ReportsScreen;
