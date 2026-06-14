/* ============================================================
   data.js — طبقة البيانات والمُحوِّل بين الخادم والواجهة
   تعمل في وضعين حسب window.APP_MODE:
     'demo' → بيانات window.SEED محلياً (بدون خادم)
     'live' → الاتصال بالـ API عبر window.API ومزامنة الحالة
   كل دوال Store ترجع Promise حتى يتطابق منطق App في الوضعين.
   ============================================================ */
(function () {
  const LIVE = window.APP_MODE === 'live';

  /* ----- تحويل طلب من شكل الخادم إلى شكل الواجهة ----- */
  function normalizeRequest(r) {
    if (!r) return null;
    const base = window.API_BASE || '';   // عنوان الخادم (مطلوب عند الفتح من GitHub Pages)
    // روابط Cloudinary كاملة تُستخدم كما هي؛ الملفات المحلية تُقدَّم عبر /uploads
    const fileUrl = (p) => /^https?:\/\//i.test(p) ? p : `${base}/uploads/${p}`;
    const photos = (r.report_photos || r.attachments && r.attachments.filter(a => a.kind === 'photo') || [])
      .map(p => p.stored_path ? fileUrl(p.stored_path) : null).filter(Boolean);
    const atts = r.attachments || [];
    const findAtt = (kind) => atts.find(a => a.kind === kind);
    const reqDoc = findAtt('request_doc');
    const cv = findAtt('cv');
    return {
      id: r.id,
      event: r.event_name,
      org: r.organization,
      lecturer: r.lecturer,
      hall: r.hall_id,
      status: r.status,
      phone: r.phone,
      insta: r.instagram,
      dates: r.proposed_dates,
      goals: r.goals,
      axes: r.axes,
      notes: r.notes,
      submitted: r.submitted_at || '',
      shareToken: r.share_token || null,
      cats: (r.categories || []).map(c => c.id),
      rejectReason: r.reject_reason || null,
      beneficiaries: r.report ? r.report.attendees : 0,
      report: r.report ? {
        attendees: r.report.attendees,
        capacity: r.report.capacity,
        video: !!r.report.has_video,
        summary: r.report.summary,
        outcomes: r.report.outcomes,
        notes: r.report.notes,
        photoData: photos,
        source: r.report.source || 'internal',
        status: r.report.status || 'accepted',
        pending: (r.report.status || 'accepted') === 'pending',
      } : null,
      files: {
        request: reqDoc ? { name: reqDoc.file_name, url: fileUrl(reqDoc.stored_path) } : null,
        cv: cv ? { name: cv.file_name, url: fileUrl(cv.stored_path) } : null,
      },
      _photoNames: photos,
    };
  }

  /* ----- تحويل data URL إلى ملف لرفعه ----- */
  function dataUrlToFile(dataUrl, name) {
    const [head, b64] = dataUrl.split(',');
    const mime = (head.match(/data:(.*?);/) || [, 'image/jpeg'])[1];
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], name, { type: mime });
  }

  const Store = {
    LIVE,

    /* القاعات والفئات — تملأ window.SEED ليعمل hallName/catName والشاشات */
    async loadMeta() {
      if (!LIVE) return { halls: window.SEED.HALLS, categories: window.SEED.CATS };
      const m = await window.API.meta();
      window.SEED.HALLS = m.halls.map(h => ({ id: h.id, name: h.name, en: h.note, cap: h.capacity }));
      window.SEED.CATS = m.categories;
      return m;
    },

    /* السلسلة الزمنية للوحة المتابعة */
    async loadTimeseries() {
      if (!LIVE) return window.SEED.TIMESERIES;
      const rows = await window.API.analytics.timeseries();
      const months = { '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل', '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس', '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر' };
      const ts = rows.map(r => { const [y, mm] = r.ym.split('-'); return { m: months[mm] || mm, y, count: Number(r.count) }; });
      window.SEED.TIMESERIES = ts;
      return ts;
    },

    /* كل الطلبات (مُحوّلة لشكل الواجهة) */
    async loadRequests() {
      if (!LIVE) return window.SEED.REQ.map(r => ({ ...r }));
      const list = await window.API.requests.list('all');
      // القائمة مختصرة؛ نجمّع التفاصيل الكاملة لكل طلب لعرض اللوحة والتقارير
      const full = await Promise.all(list.map(r => window.API.requests.get(r.id)));
      return full.map(normalizeRequest);
    },

    /* تقديم طلب جديد — fields: شكل الواجهة، files: {request, cv} (كائنات File) */
    async createRequest(payload) {
      if (!LIVE) return { ...payload, status: 'review' };
      const fields = {
        event: payload.event, org: payload.org, lecturer: payload.lecturer, hall: payload.hall,
        phone: payload.phone, insta: payload.insta, dates: payload.dates,
        goals: payload.goals, axes: payload.axes, notes: payload.notes || '',
        cats: payload.cats, agree: 'true',
      };
      const files = { requestDoc: payload.files && payload.files.request, cv: payload.files && payload.files.cv };
      const created = await window.API.requests.create(fields, files);
      return normalizeRequest(created);
    },

    async updateStatus(id, status, opts = {}) {
      if (!LIVE) return;
      await window.API.requests.updateStatus(id, status, opts);
    },

    async editRequest(updated) {
      if (!LIVE) return;
      await window.API.requests.update(updated.id, updated);
    },

    async deleteRequest(id) {
      if (!LIVE) return;
      await window.API.requests.remove(id);
    },

    async saveReport(id, rep) {
      if (!LIVE) return;
      const photos = (rep.photoData || []).map((d, i) =>
        typeof d === 'string' && d.startsWith('data:') ? dataUrlToFile(d, `photo-${i + 1}.jpg`) : null
      ).filter(Boolean);
      const fields = {
        attendees: rep.attendees, capacity: rep.capacity,
        video: String(!!rep.video), summary: rep.summary || '',
        outcomes: rep.outcomes || '', notes: rep.notes || '',
      };
      await window.API.reports.save(id, fields, photos);
    },

    async acceptReport(id) {
      if (!LIVE) return;
      await window.API.reports.accept(id);
    },

    /** يولّد/يجلب رمز رابط رفع التقرير للجهة المنفّذة */
    async getShareToken(req) {
      if (!LIVE) return req.shareToken || req.id;
      const r = await window.API.requests.share(req.id);
      return (r && r.token) || req.shareToken || req.id;
    },
  };

  window.Store = Store;
  window.normalizeRequest = normalizeRequest;
})();
