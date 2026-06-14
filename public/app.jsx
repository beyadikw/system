/* app.jsx — الهيكل الرئيسي والتوجيه */
const { useState: useStateA, useRef: useRefA, useEffect: useEffectA } = React;

const NAV = [
  { id: 'dashboard', label: 'لوحة المتابعة', icon: 'monitoring' },
  { id: 'requests', label: 'الطلبات', icon: 'forms' },
  { id: 'new', label: 'تقديم طلب جديد', icon: 'plus' },
  { id: 'reports', label: 'التقارير الختامية', icon: 'reports' },
];

const PAGE_META = {
  dashboard: { t: 'لوحة المتابعة', s: 'نظرة عامة على طلبات الرعاية' },
  requests: { t: 'الطلبات', s: 'استقبال ومراجعة طلبات رعاية الفعاليات' },
  new: { t: 'تقديم طلب جديد', s: 'نموذج طلب رعاية فعالية' },
  reports: { t: 'التقارير الختامية', s: 'توثيق نتائج الفعاليات بعد انتهائها' },
};

let NOTIF_SEQ = 1;
function makeNotif(type, title, body, reqId) {
  const meta = {
    new:      { icon: 'forms',   tone: 'gold' },
    approved: { icon: 'tasks',   tone: 'info' },
    rejected: { icon: 'alert',   tone: 'warm' },
    report:   { icon: 'reports', tone: 'gold' },
    edit:     { icon: 'forms',   tone: 'neutral' },
  }[type] || { icon: 'bell', tone: 'gold' };
  return { id: 'n' + (NOTIF_SEQ++), type, title, body, reqId, icon: meta.icon, tone: meta.tone, time: 'الآن', read: false };
}

/* لوحة الإشعارات */
function NotificationsPanel({ items, onClose, onClear, onOpenReq }) {
  const unread = items.filter(n => !n.read).length;
  return (
    <div className="notif-pop">
      <div className="notif-h">
        <b>الإشعارات {unread > 0 && <span className="notif-badge">{unread}</span>}</b>
        {items.length > 0 && <button className="notif-clear" onClick={onClear}>تعليم الكل كمقروء</button>}
      </div>
      <div className="notif-list">
        {items.length === 0 && <div className="notif-empty"><Icon name="bell" tone="neutral" size={30} /><span>لا توجد إشعارات</span></div>}
        {items.map(n => (
          <button key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => { onOpenReq(n); onClose(); }}>
            <IconPlate name={n.icon} tone={n.tone} size={34} />
            <div className="notif-tx">
              <b>{n.title}</b>
              <span>{n.body}</span>
              <small>{n.reqId ? n.reqId + ' · ' : ''}{n.time}</small>
            </div>
            {!n.read && <span className="notif-dot"></span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function App() {
  const LIVE = window.Store && window.Store.LIVE;
  const [requests, setRequests] = useStateA(() => LIVE ? [] : window.SEED.REQ.map(r => ({ ...r })));
  const [loading, setLoading] = useStateA(LIVE);
  const [screen, setScreen] = useStateA('dashboard');
  const [focusId, setFocusId] = useStateA(null);
  const [editReq, setEditReq] = useStateA(null);
  const [toast, setToast] = useStateA(null);
  const [notifs, setNotifs] = useStateA(() => {
    if (window.Store && window.Store.LIVE) return [];
    const seed = window.SEED.REQ;
    const list = [];
    seed.filter(r => r.status === 'review').slice(0, 3).forEach(r =>
      list.push({ ...makeNotif('new', 'طلب بانتظار المراجعة', r.event, r.id), read: false, time: 'اليوم' }));
    seed.filter(r => r.report && r.report.pending).forEach(r =>
      list.push({ ...makeNotif('report', 'تقرير ختامي بانتظار القبول', r.event, r.id), read: false, time: 'اليوم' }));
    seed.filter(r => r.status === 'approved' && !r.report).slice(0, 2).forEach(r =>
      list.push({ ...makeNotif('approved', 'فعالية معتمدة بانتظار التقرير', r.event, r.id), read: true, time: 'أمس' }));
    return list;
  });
  const [notifOpen, setNotifOpen] = useStateA(false);
  const bellRef = useRefA(null);
  const seenIds = useRefA(null);   // مجموعة أرقام الطلبات المعروفة (للوضع الحيّ)
  const seenReports = useRefA(null); // أرقام الطلبات التي ورد لها تقرير بانتظار القبول
  const firstLoad = useRefA(true);

  const unread = notifs.filter(n => !n.read).length;

  function pushNotif(n) { setNotifs(prev => [n, ...prev]); }
  function showToast(msg) { setToast(msg); clearTimeout(window.__t); window.__t = setTimeout(() => setToast(null), 3200); }

  function nav(s, id) { setScreen(s); setFocusId(id || null); window.scrollTo({ top: 0 }); }

  // ---- الوضع الحيّ: حارس الدخول + تحميل البيانات من الخادم ----
  async function refreshRequests() {
    if (!LIVE) return;
    try { setRequests(await window.Store.loadRequests()); } catch (e) { showToast('تعذّر تحميل الطلبات: ' + e.message); }
  }

  // يفحص الطلبات الواردة ويولّد إشعارات للطلبات الجديدة (الوضع الحيّ)
  function syncNotifs(list) {
    if (!seenIds.current) seenIds.current = new Set();
    if (!seenReports.current) seenReports.current = new Set();
    if (firstLoad.current) {
      // أول تحميل: أنشئ إشعارات لما ينتظر المراجعة والتقارير بانتظار القبول
      const seedList = [];
      list.filter(r => r.status === 'review').forEach(r =>
        seedList.push({ ...makeNotif('new', 'طلب بانتظار المراجعة', r.event, r.id), time: 'بانتظارك' }));
      list.filter(r => r.report && r.report.pending).forEach(r => {
        seedList.push({ ...makeNotif('report', 'تقرير ختامي بانتظار القبول', r.event, r.id), time: 'بانتظارك' });
        seenReports.current.add(r.id);
      });
      list.filter(r => r.status === 'approved' && !r.report).forEach(r =>
        seedList.push({ ...makeNotif('approved', 'فعالية معتمدة بانتظار التقرير', r.event, r.id), read: true, time: '' }));
      if (seedList.length) setNotifs(seedList);
      list.forEach(r => seenIds.current.add(r.id));
      firstLoad.current = false;
      return;
    }
    // التحديثات اللاحقة: نبّه على كل طلب جديد لم نره من قبل
    const fresh = list.filter(r => !seenIds.current.has(r.id));
    fresh.forEach(r => {
      seenIds.current.add(r.id);
      pushNotif(makeNotif('new', 'طلب رعاية جديد ورد الآن', r.event, r.id));
    });
    if (fresh.length) showToast(`ورد ${fresh.length === 1 ? 'طلب جديد' : fresh.length + ' طلبات جديدة'}`);
    // نبّه على التقارير الجديدة الواردة من الجهات المنفّذة
    const freshReports = list.filter(r => r.report && r.report.pending && !seenReports.current.has(r.id));
    freshReports.forEach(r => {
      seenReports.current.add(r.id);
      pushNotif(makeNotif('report', 'تقرير ختامي ورد الآن بانتظار القبول', r.event, r.id));
    });
    if (freshReports.length) showToast(`ورد ${freshReports.length === 1 ? 'تقرير جديد' : freshReports.length + ' تقارير'} بانتظار القبول`);
    // أزل التي لم تعد معلّقة (قُبِلت من جهاز آخر)
    seenReports.current.forEach(id => {
      const r = list.find(x => x.id === id);
      if (!r || !r.report || !r.report.pending) seenReports.current.delete(id);
    });
  }

  useEffectA(() => {
    if (!LIVE) return;
    if (!window.API.isAuthed()) { location.href = 'login.html'; return; }
    let timer = null;
    async function load(initial) {
      try {
        if (initial) { await window.Store.loadMeta(); await window.Store.loadTimeseries(); }
        const list = await window.Store.loadRequests();
        setRequests(list);
        syncNotifs(list);
      } catch (e) {
        if (/جلسة|تسجيل/.test(e.message)) { window.API.logout(); location.href = 'login.html'; return; }
        if (initial) showToast('تعذّر الاتصال بالخادم: ' + e.message);
      } finally { if (initial) setLoading(false); }
    }
    load(true);
    // تفقّد دوري للطلبات الجديدة كل ٤٥ ثانية
    timer = setInterval(() => load(false), 45000);
    // تفقّد فوري عند العودة إلى التبويب
    const onFocus = () => load(false);
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, []);

  function updateStatus(id, status) {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, status };
      if (status === 'rejected' && !next.rejectReason) next.rejectReason = 'لم يستوفِ الطلب أحد متطلبات الرعاية، أو تعذّر توفير القاعة في الموعد المطلوب.';
      return next;
    }));
    const r = requests.find(x => x.id === id);
    if (r) {
      if (status === 'approved') pushNotif(makeNotif('approved', 'تم اعتماد الطلب', r.event, id));
      if (status === 'rejected') pushNotif(makeNotif('rejected', 'تم رفض الطلب', r.event, id));
      showToast(status === 'approved' ? `تم اعتماد «${r.event}»` : status === 'rejected' ? `تم رفض «${r.event}»` : 'تم التحديث');
    }
    if (LIVE) window.Store.updateStatus(id, status).then(refreshRequests)
      .catch(e => showToast('تعذّر حفظ الحالة: ' + e.message));
  }
  function submitNew(req) {
    if (!LIVE) setRequests(prev => [{ ...req, status: 'review' }, ...prev]);
    else if (seenIds.current && req && req.id) seenIds.current.add(req.id); // لا تُنبّه عليه ثانيةً
    pushNotif(makeNotif('new', 'طلب رعاية جديد', req.event, req.id));
    showToast(`تم استلام طلب «${req.event}»`);
    if (LIVE) refreshRequests();
  }
  function saveReport(id, rep) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', report: rep, beneficiaries: rep.attendees } : r));
    const r = requests.find(x => x.id === id);
    const name = r ? r.event : id;
    if (rep.pending) {
      pushNotif(makeNotif('report', 'تقرير ختامي بانتظار القبول', name, id));
      showToast(`ورد تقرير «${name}» بانتظار قبولك`);
      if (seenReports.current) seenReports.current.add(id);
    } else {
      pushNotif(makeNotif('report', 'تم حفظ التقرير الختامي', name, id));
      showToast(`تم حفظ تقرير «${name}»`);
    }
    if (LIVE) window.Store.saveReport(id, rep).then(refreshRequests)
      .catch(e => showToast('تعذّر حفظ التقرير: ' + e.message));
  }
  function acceptReport(id) {
    setRequests(prev => prev.map(r => (r.id === id && r.report) ? { ...r, report: { ...r.report, pending: false, status: 'accepted' } } : r));
    const r = requests.find(x => x.id === id);
    if (seenReports.current) seenReports.current.delete(id);
    pushNotif(makeNotif('report', 'تم قبول التقرير الختامي', r ? r.event : id, id));
    showToast(r ? `تم قبول تقرير «${r.event}»` : 'تم قبول التقرير');
    if (LIVE) window.Store.acceptReport(id).then(refreshRequests)
      .catch(e => showToast('تعذّر القبول: ' + e.message));
  }
  function applyEdit(updated) {
    setRequests(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
    pushNotif(makeNotif('edit', 'تم تعديل بيانات الطلب', updated.event, updated.id));
    showToast(`تم حفظ تعديلات «${updated.event}»`);
    setEditReq(null);
    if (LIVE) window.Store.editRequest(updated).then(refreshRequests)
      .catch(e => showToast('تعذّر حفظ التعديل: ' + e.message));
  }
  function deleteRequest(id) {
    const r = requests.find(x => x.id === id);
    setRequests(prev => prev.filter(x => x.id !== id));
    setNotifs(prev => prev.filter(n => n.reqId !== id));
    showToast(r ? `تم حذف الطلب «${r.event}»` : 'تم حذف الطلب');
    if (LIVE) window.Store.deleteRequest(id).catch(e => { showToast('تعذّر الحذف: ' + e.message); refreshRequests(); });
  }

  function openNotif(n) {
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    if (n.reqId) {
      if (n.type === 'report') nav('reports', n.reqId);
      else nav('requests', n.reqId);
    }
  }
  function markAllRead() { setNotifs(prev => prev.map(n => ({ ...n, read: true }))); }

  useEffectA(() => {
    if (!notifOpen) return;
    const h = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [notifOpen]);

  const reviewCount = requests.filter(r => r.status === 'review').length;
  const pendingReports = requests.filter(r => r.status === 'approved' && !r.report).length;
  const meta = PAGE_META[screen];
  const todayStr = (() => {
    try {
      const f = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const p = f.formatToParts(new Date());
      const g = (t) => (p.find(x => x.type === t) || {}).value || '';
      return `${g('weekday')} · ${g('day')} ${g('month')} ${g('year')}`;
    } catch (e) {
      return new Date().toLocaleDateString('ar');
    }
  })();

  return (
    <div className="app">
      {/* SIDEBAR */}
      <nav className="sb">
        <div className="sb-brand">
          <img className="sb-logo" src="assets/khudh-biyadi-logo.png" alt="خذ بيدي" />
          <small className="sb-sub">بوابة طلبات رعاية الفعاليات</small>
        </div>
        <div className="sb-sec">القائمة</div>
        {NAV.map(n => (
          <button key={n.id} className={`sb-item ${screen === n.id ? 'active' : ''}`} onClick={() => nav(n.id)}>
            <Icon name={n.icon} />
            <span>{n.label}</span>
            {n.id === 'requests' && reviewCount > 0 && <span className="ct alert">{reviewCount}</span>}
            {n.id === 'reports' && pendingReports > 0 && <span className="ct alert">{pendingReports}</span>}
          </button>
        ))}
      </nav>

      {/* STAGE */}
      <div className="stage">
        <header className="topbar">
          <div className="pg-tt"><b>{meta.t}</b><small>{meta.s}</small></div>
          <div className="sp"></div>
          <div className="tdate"><Icon name="calendar" tone="gold" size={18} />{todayStr}</div>
          <div className="notif-wrap" ref={bellRef}>
            <button className={`icon-btn ${notifOpen ? 'active' : ''}`} onClick={() => setNotifOpen(o => !o)} aria-label="الإشعارات">
              <Icon name="bell" tone="gold" />
              {unread > 0 && <span className="bell-count">{unread > 9 ? '٩+' : unread}</span>}
            </button>
            {notifOpen && <NotificationsPanel items={notifs} onClose={() => setNotifOpen(false)} onClear={markAllRead} onOpenReq={openNotif} />}
          </div>
          <div className="who">
            <span className="ava">م</span>
            <span className="nm"><b>ماجد الشمري</b><small>منسّق المشروع</small></span>
            {LIVE && <button className="icon-btn" title="تسجيل الخروج" style={{ marginInlineStart: 4 }} onClick={() => { window.API.logout(); location.href = 'login.html'; }}><Icon name="lock" tone="gold" size={18} /></button>}
          </div>
        </header>

        <main className="canvas">
          {loading && <div className="empty" style={{ paddingTop: 90 }}><Icon name="monitoring" tone="neutral" size={46} />جارٍ تحميل البيانات من الخادم…</div>}
          {!loading && screen === 'dashboard' && <DashboardScreen requests={requests} onNav={nav} />}
          {!loading && screen === 'requests' && <RequestsScreen requests={requests} onUpdate={updateStatus} onNav={nav} onEdit={setEditReq} onDelete={deleteRequest} focusId={focusId} onClearFocus={() => setFocusId(null)} />}
          {!loading && screen === 'new' && <NewRequestScreen onSubmit={submitNew} onNav={nav} />}
          {!loading && screen === 'reports' && <ReportsScreen requests={requests} onSaveReport={saveReport} onAcceptReport={acceptReport} focusId={focusId} onClearFocus={() => setFocusId(null)} />}
        </main>
      </div>

      {editReq && <EditRequestModal req={editReq} onClose={() => setEditReq(null)} onSave={applyEdit} />}
      {toast && <div className="toast"><Icon name="tasks" size={18} style={{ '--da-icon-fg-color': 'var(--da-green)', '--da-icon-bg-color': 'transparent' }} />{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
