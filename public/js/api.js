/* ============================================================
   api.js — عميل REST لبوابة خذ بيدي
   يغطّي كل مسارات الخادم. يُحمّل قبل ملفات React.
   الاستخدام:
     await API.login(email, password)
     const list = await API.requests.list('review')
     await API.requests.updateStatus(id, 'approved', { notifyEmail })
   ============================================================ */
(function () {
  const BASE = (window.API_BASE || '') + '/api';
  const TOKEN_KEY = 'bk_token';

  const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
  const setToken = (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

  async function req(method, url, body, isForm) {
    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    let payload;
    if (isForm) { payload = body; }              // FormData — المتصفح يضبط الترويسة
    else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

    const res = await fetch(BASE + url, { method, headers, body: payload });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((data && data.error) || 'تعذّر تنفيذ الطلب');
    return data;
  }

  const API = {
    // ---- المصادقة ----
    isAuthed: () => !!getToken(),
    logout: () => setToken(null),
    async login(email, password) {
      const d = await req('POST', '/auth/login', { email, password });
      setToken(d.token);
      return d.user;
    },
    me: () => req('GET', '/auth/me'),

    // ---- بيانات مرجعية ----
    meta: () => req('GET', '/meta'),
    analytics: {
      summary: () => req('GET', '/analytics/summary'),
      timeseries: () => req('GET', '/analytics/timeseries'),
      byHall: () => req('GET', '/analytics/by-hall'),
      byCategory: () => req('GET', '/analytics/by-category'),
    },

    // ---- الطلبات ----
    requests: {
      list: (status) => req('GET', '/requests' + (status && status !== 'all' ? `?status=${status}` : '')),
      get: (id) => req('GET', '/requests/' + id),
      /** تقديم طلب جديد — يقبل كائن الحقول + الملفات {requestDoc, cv} */
      create(fields, files) {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          fd.append(k, k === 'cats' ? JSON.stringify(v) : v);
        });
        if (files && files.requestDoc) fd.append('requestDoc', files.requestDoc);
        if (files && files.cv) fd.append('cv', files.cv);
        return req('POST', '/requests', fd, true);
      },
      updateStatus: (id, status, opts = {}) =>
        req('PATCH', `/requests/${id}/status`, { status, ...opts }),
      update: (id, fields) => req('PUT', `/requests/${id}`, {
        event: fields.event, org: fields.org, lecturer: fields.lecturer, hall: fields.hall,
        phone: fields.phone, insta: fields.insta, dates: fields.dates,
        goals: fields.goals, axes: fields.axes, notes: fields.notes, cats: fields.cats,
      }),
      share: (id, email) => req('POST', `/requests/${id}/share`, { email }),
      remove: (id) => req('DELETE', '/requests/' + id),
    },

    // ---- التقارير ----
    reports: {
      list: () => req('GET', '/reports'),
      get: (requestId) => req('GET', '/reports/' + requestId),
      /** حفظ تقرير داخلي — fields + صور (مصفوفة File) */
      save(requestId, fields, photos) {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
        (photos || []).forEach((p) => fd.append('photos', p));
        return req('POST', '/reports/' + requestId, fd, true);
      },
    },

    // ---- رابط الجهة المنفّذة (عام) ----
    share: {
      get: (token) => req('GET', '/share/' + token),
      submit(token, fields, photos) {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
        (photos || []).forEach((p) => fd.append('photos', p));
        return req('POST', '/share/' + token, fd, true);
      },
    },
  };

  window.API = API;
})();
