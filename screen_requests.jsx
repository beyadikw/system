/* screen_requests.jsx — إدارة ومراجعة الطلبات */
const { useState: useStateR, useEffect: useEffectR } = React;

/* ---------- نافذة تعديل الطلب ---------- */
function EditRequestModal({ req, onClose, onSave }) {
  const { HALLS, CATS } = window.SEED;
  const [f, setF] = useStateR(() => ({
    event: req.event || '', org: req.org || '', lecturer: req.lecturer || '',
    hall: req.hall || '', dates: req.dates || '', phone: req.phone || '', insta: req.insta || '',
    goals: req.goals || '', axes: req.axes || '', cats: [...(req.cats || [])], notes: req.notes || '',
  }));
  const [err, setErr] = useStateR({});
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const toggleCat = (id) => setF(p => ({ ...p, cats: p.cats.includes(id) ? p.cats.filter(c => c !== id) : [...p.cats, id] }));

  function save() {
    const e = {};
    ['event', 'org', 'lecturer', 'hall', 'dates'].forEach(k => { if (!String(f[k]).trim()) e[k] = 'مطلوب'; });
    if (f.cats.length === 0) e.cats = 'اختر فئة واحدة على الأقل';
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ ...req, ...f });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="card-h" style={{ marginBottom: 4 }}>
          <IconPlate name="forms" tone="gold" size={36} />
          <h3 style={{ fontSize: 16 }}>تعديل الطلب <small style={{ fontFamily: 'var(--font-mono)', color: 'var(--da-muted)' }}>{req.id}</small></h3>
          <button className="icon-btn" style={{ marginInlineStart: 'auto' }} onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="fgrp two">
            <div className="fgrp">
              <label className="flbl">اسم الفعالية<span className="req">*</span></label>
              <input className={`inp ${err.event ? 'err' : ''}`} value={f.event} onChange={e => set('event', e.target.value)} />
              {err.event && <div className="errmsg">{err.event}</div>}
            </div>
            <div className="fgrp">
              <label className="flbl">الجهة الطالبة<span className="req">*</span></label>
              <input className={`inp ${err.org ? 'err' : ''}`} value={f.org} onChange={e => set('org', e.target.value)} />
              {err.org && <div className="errmsg">{err.org}</div>}
            </div>
          </div>
          <div className="fgrp two">
            <div className="fgrp">
              <label className="flbl">المحاضر<span className="req">*</span></label>
              <input className={`inp ${err.lecturer ? 'err' : ''}`} value={f.lecturer} onChange={e => set('lecturer', e.target.value)} />
              {err.lecturer && <div className="errmsg">{err.lecturer}</div>}
            </div>
            <div className="fgrp">
              <label className="flbl">القاعة المطلوبة<span className="req">*</span></label>
              <select className={`sel ${err.hall ? 'err' : ''}`} value={f.hall} onChange={e => set('hall', e.target.value)}>
                <option value="">اختر القاعة…</option>
                {HALLS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              {err.hall && <div className="errmsg">{err.hall}</div>}
            </div>
          </div>
          <div className="fgrp two">
            <div className="fgrp">
              <label className="flbl">التواريخ المقترحة<span className="req">*</span></label>
              <input className={`inp ${err.dates ? 'err' : ''}`} value={f.dates} onChange={e => set('dates', e.target.value)} />
              {err.dates && <div className="errmsg">{err.dates}</div>}
            </div>
            <div className="fgrp">
              <label className="flbl">رقم الهاتف</label>
              <input className="inp" value={f.phone} onChange={e => set('phone', e.target.value)} style={{ direction: 'ltr', textAlign: 'right' }} />
            </div>
          </div>
          <div className="fgrp">
            <label className="flbl">حساب الإنستقرام</label>
            <input className="inp" value={f.insta} onChange={e => set('insta', e.target.value)} style={{ direction: 'ltr', textAlign: 'right' }} />
          </div>
          <div className="fgrp">
            <label className="flbl">الفئة المستهدفة<span className="req">*</span></label>
            <div className="opt-grid cols2">
              {CATS.map(c => (
                <div key={c.id} className={`opt check ${f.cats.includes(c.id) ? 'sel' : ''}`} onClick={() => toggleCat(c.id)}>
                  <span className="mk"></span><div className="ot"><b>{c.name}</b></div>
                </div>
              ))}
            </div>
            {err.cats && <div className="errmsg">{err.cats}</div>}
          </div>
          <div className="fgrp">
            <label className="flbl">أهداف الفعالية</label>
            <textarea className="ta" value={f.goals} onChange={e => set('goals', e.target.value)} />
          </div>
          <div className="fgrp">
            <label className="flbl">محاور الفعالية</label>
            <textarea className="ta" value={f.axes} onChange={e => set('axes', e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" onClick={save}><Icon name="tasks" />حفظ التعديلات</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- نافذة تأكيد الحذف ---------- */
function ConfirmDelete({ req, onCancel, onConfirm }) {
  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="card-h" style={{ marginBottom: 6 }}>
          <IconPlate name="alert" tone="warm" size={36} />
          <h3 style={{ fontSize: 16 }}>حذف الطلب</h3>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 6px' }}>
          هل أنت متأكد من حذف طلب «<b>{req.event}</b>» ({req.id})؟
        </p>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>لا يمكن التراجع عن هذا الإجراء، وسيُحذف الطلب ومرفقاته من القائمة.</p>
        <div className="row-flex" style={{ gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
          <button className="btn btn-danger" onClick={onConfirm}><Icon name="alert" />نعم، احذف الطلب</button>
        </div>
      </div>
    </div>
  );
}

function RequestDrawer({ req, onClose, onUpdate, onNav, onEdit, onDelete }) {
  if (!req) return null;
  const actions = [];
  if (req.status === 'review') {
    actions.push({ label: 'اعتماد الطلب', cls: 'btn-green', icon: 'tasks', to: 'approved' });
    actions.push({ label: 'رفض الطلب', cls: 'btn-danger', icon: 'alert', to: 'rejected' });
  } else if (req.status === 'approved') {
    actions.push({ label: req.report ? 'عرض التقرير الختامي' : 'إنشاء التقرير الختامي', cls: 'btn-primary', icon: 'reports', nav: true });
  }

  return (
    <aside className={`drawer ${req ? 'open' : ''}`}>
      <div className="drawer-h">
        <IconPlate name="forms" tone="gold" size={44} />
        <div style={{ flex: 1 }}>
          <div className="row-flex" style={{ gap: 8 }}>
            <span className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--da-muted)' }}>{req.id}</span>
            <StatusPill status={req.status} />
          </div>
          <h3 style={{ margin: '6px 0 2px', fontSize: 18 }}>{req.event}</h3>
          <div className="muted" style={{ fontSize: 12.5 }}>{req.org}</div>
        </div>
        <div className="row-flex" style={{ gap: 4 }}>
          <button className="icon-btn" title="تعديل الطلب" onClick={() => onEdit(req)}><Icon name="forms" tone="gold" size={19} /></button>
          <button className="icon-btn" title="حذف الطلب" onClick={() => onDelete(req)}><Icon name="alert" tone="warm" size={19} /></button>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
      </div>

      <div className="drawer-b">
        {req.status === 'rejected' && req.rejectReason && (
          <div style={{ padding: '13px 16px', background: 'var(--st-rejected-bg)', borderRadius: 12, marginBottom: 18, fontSize: 13, color: 'var(--st-rejected)', display: 'flex', gap: 10 }}>
            <Icon name="alert" tone="danger" size={20} />
            <div><b>سبب الرفض:</b> {req.rejectReason}</div>
          </div>
        )}

        <div className="field-row"><div className="k">المحاضر</div><div className="v">{req.lecturer}</div></div>
        <div className="field-row"><div className="k">القاعة المطلوبة</div><div className="v">{hallName(req.hall)}</div></div>
        <div className="field-row"><div className="k">التواريخ المقترحة</div><div className="v">{req.dates}</div></div>
        <div className="field-row"><div className="k">الفئة المستهدفة</div><div className="v"><div className="row-flex" style={{ flexWrap: 'wrap', gap: 6 }}>{req.cats.map(c => <span key={c} className="chip">{catName(c)}</span>)}</div></div></div>
        <div className="field-row"><div className="k">أهداف الفعالية</div><div className="v">{req.goals}</div></div>
        <div className="field-row"><div className="k">محاور الفعالية</div><div className="v">{req.axes}</div></div>
        <div className="field-row"><div className="k">رقم الهاتف</div><div className="v" style={{ fontFamily: 'var(--font-mono)', direction: 'ltr', textAlign: 'right' }}>{req.phone}</div></div>
        <div className="field-row"><div className="k">حساب الإنستقرام</div><div className="v" style={{ color: 'var(--bk-gold-deep)', fontWeight: 600, direction: 'ltr', textAlign: 'right' }}>{req.insta}</div></div>
        {req.notes && <div className="field-row"><div className="k">ملاحظات</div><div className="v">{req.notes}</div></div>}

        <div style={{ marginTop: 22, marginBottom: 12, fontSize: 13, fontWeight: 700 }}>المرفقات</div>
        <div className="att" onClick={() => downloadAttachment(req, 'request')}>
          <Icon name="doc" tone="gold" />
          <div><div className="nm">طلب رعاية فعالية (موقّع)</div><small>{req.files && req.files.request ? req.files.request.name : 'موقّع من الجهة الطالبة'}</small></div>
          <span className="dl">تنزيل</span>
        </div>
        <div className="att" onClick={() => downloadAttachment(req, 'cv')}>
          <Icon name="doc" tone="gold" />
          <div><div className="nm">السيرة الذاتية للمحاضر</div><small>{req.files && req.files.cv ? req.files.cv.name : req.lecturer}</small></div>
          <span className="dl">تنزيل</span>
        </div>

        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 14 }} onClick={() => downloadRequestPackage(req)}>
          <Icon name="reports" tone="gold" />تنزيل الطلب مع المرفقات (ZIP)
        </button>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.5 }}>
          حزمة تحتوي على نموذج الطلب المنسّق (جاهز للطباعة والاعتماد) مع المرفقات — لإرسالها إلى الإدارة للنظر والموافقة.
        </div>

        {req.report && (
          <div style={{ marginTop: 20, padding: 16, background: 'var(--st-done-bg)', borderRadius: 12 }}>
            <div className="row-flex" style={{ gap: 9, marginBottom: 8 }}>
              <Icon name="reports" size={20} style={{ '--da-icon-fg-color': 'var(--st-done)', '--da-icon-bg-color': '#fff' }} />
              <b style={{ fontSize: 13.5, color: 'var(--st-done)' }}>تقرير ختامي متوفّر</b>
            </div>
            <div className="muted" style={{ fontSize: 12.5 }}>الحضور الفعلي {req.report.attendees} من {req.report.capacity}</div>
          </div>
        )}
      </div>

      <div className="drawer-f">
        {actions.map((a, i) => (
          <button key={i} className={`btn ${a.cls}`} style={{ flex: 1 }}
            onClick={() => { if (a.nav) { onNav('reports', req.id); onClose(); } else { onUpdate(req.id, a.to); } }}>
            <Icon name={a.icon} />{a.label}
          </button>
        ))}
        {actions.length === 0 && <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => onEdit(req)}><Icon name="forms" tone="gold" />تعديل الطلب</button>}
      </div>
    </aside>
  );
}

function RequestsScreen({ requests, onUpdate, onNav, onEdit, onDelete, focusId, onClearFocus }) {
  const { HALLS, CATS } = window.SEED;
  const [filter, setFilter] = useStateR('all');
  const [q, setQ] = useStateR('');
  const [hall, setHall] = useStateR('all');
  const [cat, setCat] = useStateR('all');
  const [reqNo, setReqNo] = useStateR('');
  const [openId, setOpenId] = useStateR(null);
  const [delReq, setDelReq] = useStateR(null);

  useEffectR(() => { if (focusId) { setOpenId(focusId); onClearFocus && onClearFocus(); } }, [focusId]);

  const counts = { all: requests.length };
  ['review', 'approved', 'rejected'].forEach(k => counts[k] = requests.filter(r => r.status === k).length);

  let rows = requests;
  if (filter !== 'all') rows = rows.filter(r => r.status === filter);
  if (hall !== 'all') rows = rows.filter(r => r.hall === hall);
  if (cat !== 'all') rows = rows.filter(r => r.cats.includes(cat));
  if (reqNo.trim()) {
    const t = reqNo.trim().replace(/\s+/g, '').toLowerCase();
    rows = rows.filter(r => r.id.toLowerCase().replace(/\s+/g, '').includes(t));
  }
  if (q.trim()) {
    const t = q.trim();
    rows = rows.filter(r => (r.event + r.org + r.id + r.lecturer).includes(t));
  }
  rows = [...rows].sort((a, b) => b.submitted.localeCompare(a.submitted));

  const open = requests.find(r => r.id === openId);
  const hasExtra = hall !== 'all' || cat !== 'all' || reqNo.trim() || q.trim();

  const segs = [
    { k: 'all', label: 'الكل' },
    { k: 'review', label: 'قيد المراجعة' },
    { k: 'approved', label: 'مقبول' },
    { k: 'rejected', label: 'مرفوض' },
  ];

  return (
    <div className="screen">
      <div className="toolbar">
        <div className="searchbox">
          <Icon name="search" />
          <input placeholder="ابحث باسم الفعالية أو الجهة أو رقم الطلب…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="seg">
          {segs.map(s => (
            <button key={s.k} className={filter === s.k ? 'active' : ''} onClick={() => setFilter(s.k)}>
              {s.label}<span className="n">{counts[s.k]}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => onNav('new')}><Icon name="plus" />طلب جديد</button>
      </div>

      <div className="filterbar">
        <div className="filter-field">
          <Icon name="forms" tone="gold" size={16} />
          <input className="filter-input" placeholder="رقم الطلب (مثال: BK-1042)" value={reqNo} onChange={e => setReqNo(e.target.value)} />
        </div>
        <div className="filter-field">
          <Icon name="apps" tone="gold" size={16} />
          <select value={hall} onChange={e => setHall(e.target.value)}>
            <option value="all">كل القاعات</option>
            {HALLS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <Icon name="beneficiaries" tone="gold" size={16} />
          <select value={cat} onChange={e => setCat(e.target.value)}>
            <option value="all">كل الفئات</option>
            {CATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <span className="filter-count">{rows.length} طلب</span>
        {hasExtra && <button className="filter-reset" onClick={() => { setHall('all'); setCat('all'); setReqNo(''); setQ(''); }}>مسح التصفية ✕</button>}
      </div>

      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>الفعالية / الجهة الطالبة</th>
              <th>القاعة</th>
              <th>الفئة المستهدفة</th>
              <th>التاريخ المقترح</th>
              <th>الحالة</th>
              <th style={{ textAlign: 'center' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} onClick={() => setOpenId(r.id)}>
                <td className="mono">{r.id}</td>
                <td className="ev"><b>{r.event}</b><small>{r.org} · {r.lecturer}</small></td>
                <td>{hallName(r.hall)}</td>
                <td><div className="row-flex" style={{ flexWrap: 'wrap', gap: 5 }}>{r.cats.slice(0, 2).map(c => <span key={c} className="chip" style={{ fontSize: 11, padding: '3px 9px' }}>{catName(c)}</span>)}{r.cats.length > 2 && <span className="muted" style={{ fontSize: 11 }}>+{r.cats.length - 2}</span>}</div></td>
                <td style={{ fontSize: 12.5 }}>{r.dates}</td>
                <td><StatusPill status={r.status} /></td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="row-actions">
                    <button className="ra-btn" title="تعديل" onClick={() => onEdit(r)}><Icon name="forms" tone="gold" size={17} /></button>
                    <button className="ra-btn danger" title="حذف" onClick={() => setDelReq(r)}><Icon name="alert" tone="warm" size={17} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty"><Icon name="search" tone="neutral" />لا توجد طلبات مطابقة.</div>}
      </div>

      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpenId(null)}></div>
      {open && <RequestDrawer req={open} onClose={() => setOpenId(null)} onUpdate={(id, to) => { onUpdate(id, to); setOpenId(null); }} onNav={onNav} onEdit={(r) => { onEdit(r); setOpenId(null); }} onDelete={(r) => { setDelReq(r); }} />}
      {delReq && <ConfirmDelete req={delReq} onCancel={() => setDelReq(null)} onConfirm={() => { onDelete(delReq.id); setDelReq(null); setOpenId(null); }} />}
    </div>
  );
}
window.RequestsScreen = RequestsScreen;
window.EditRequestModal = EditRequestModal;
