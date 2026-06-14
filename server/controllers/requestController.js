'use strict';
/** متحكّم الطلبات */
const crypto = require('crypto');
const { q, withTx } = require('../config/db');
const { nextRequestId, hydrateRequest, listRequests } = require('./helpers');
const { sendMail, templates } = require('../services/email');

/** GET /api/requests?status= */
exports.list = async (req, res, next) => {
  try {
    res.json(await listRequests(req.query.status));
  } catch (e) { next(e); }
};

/** GET /api/requests/:id */
exports.getOne = async (req, res, next) => {
  try {
    const r = await hydrateRequest(req.params.id);
    if (!r) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json(r);
  } catch (e) { next(e); }
};

/**
 * POST /api/requests  (تقديم عام — multipart)
 * الحقول: event, org, lecturer, hall, phone, insta, dates, goals, axes, notes,
 *         cats (JSON array أو مكرّر), agree (true)
 * الملفات: requestDoc, cv
 */
exports.create = async (req, res, next) => {
  try {
    const b = req.body;
    if (String(b.agree) !== 'true') {
      return res.status(400).json({ error: 'يجب الموافقة على الشروط والأحكام' });
    }
    const required = ['event', 'org', 'goals', 'axes', 'hall', 'lecturer', 'dates', 'phone', 'insta'];
    for (const f of required) {
      if (!b[f] || !String(b[f]).trim()) return res.status(400).json({ error: `الحقل «${f}» مطلوب` });
    }
    let cats = [];
    try { cats = Array.isArray(b.cats) ? b.cats : JSON.parse(b.cats || '[]'); } catch { cats = [].concat(b.cats || []); }
    if (!cats.length) return res.status(400).json({ error: 'اختر فئة مستهدفة واحدة على الأقل' });

    const id = await nextRequestId();
    const shareToken = crypto.randomUUID();
    const insta = b.insta.startsWith('@') ? b.insta : '@' + b.insta;
    const today = new Date().toISOString().slice(0, 10);
    const files = req.files || {};
    const { persist } = require('../services/storage');
    // ارفع الملفات أولاً (إلى Cloudinary أو القرص) قبل المعاملة
    const reqDocFile = files.requestDoc ? files.requestDoc[0] : null;
    const cvFile = files.cv ? files.cv[0] : null;
    const reqDocStored = reqDocFile ? await persist(reqDocFile) : null;
    const cvStored = cvFile ? await persist(cvFile) : null;

    await withTx(async (conn) => {
      await conn.execute(
        `INSERT INTO requests
          (id, event_name, organization, lecturer, hall_id, status, phone, instagram,
           proposed_dates, goals, axes, notes, agreed_terms, share_token, submitted_at)
         VALUES (?,?,?,?,?, 'review', ?,?,?,?,?,?, 1, ?, ?)`,
        [id, b.event, b.org, b.lecturer, b.hall, b.phone, insta, b.dates, b.goals, b.axes, b.notes || null, shareToken, today]
      );
      for (const c of cats) {
        await conn.execute(`INSERT IGNORE INTO request_categories (request_id, category_id) VALUES (?,?)`, [id, c]);
      }
      const addFile = async (kind, f, stored) => {
        if (!f) return;
        await conn.execute(
          `INSERT INTO attachments (request_id, kind, file_name, stored_path, mime_type, size_bytes)
           VALUES (?,?,?,?,?,?)`,
          [id, kind, f.originalname, stored, f.mimetype, f.size]
        );
      };
      await addFile('request_doc', reqDocFile, reqDocStored);
      await addFile('cv', cvFile, cvStored);
    });

    const full = await hydrateRequest(id);
    // إشعار فريق المشروع
    const tpl = templates.newRequest(full);
    sendMail({ to: process.env.ADMIN_NOTIFY_EMAIL, ...tpl, template: 'newRequest', requestId: id }).catch(() => {});

    res.status(201).json(full);
  } catch (e) { next(e); }
};

/** PATCH /api/requests/:id/status  { status, rejectReason, notifyEmail } */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, rejectReason, notifyEmail } = req.body;
    if (!['review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'حالة غير صالحة' });
    }
    const exists = await q(`SELECT id FROM requests WHERE id = ?`, [req.params.id]);
    if (!exists[0]) return res.status(404).json({ error: 'الطلب غير موجود' });

    await q(`UPDATE requests SET status = ?, reject_reason = ? WHERE id = ?`,
      [status, status === 'rejected' ? (rejectReason || 'لم يستوفِ الطلب متطلبات الرعاية.') : null, req.params.id]);

    const full = await hydrateRequest(req.params.id);
    if (notifyEmail) {
      const tpl = templates.statusChanged(full);
      sendMail({ to: notifyEmail, ...tpl, template: 'statusChanged', requestId: full.id }).catch(() => {});
    }
    res.json(full);
  } catch (e) { next(e); }
};

/** POST /api/requests/:id/share  → يرسل/يعيد رابط رفع التقرير */
exports.shareLink = async (req, res, next) => {
  try {
    const rows = await q(`SELECT * FROM requests WHERE id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'الطلب غير موجود' });
    let token = rows[0].share_token;
    if (!token) {
      token = crypto.randomUUID();
      await q(`UPDATE requests SET share_token = ? WHERE id = ?`, [token, req.params.id]);
    }
    const link = `${process.env.PUBLIC_BASE_URL || ''}/report.html?token=${token}`;
    if (req.body && req.body.email) {
      const tpl = templates.shareReportLink(rows[0], link);
      sendMail({ to: req.body.email, ...tpl, template: 'shareReportLink', requestId: rows[0].id }).catch(() => {});
    }
    res.json({ token, link });
  } catch (e) { next(e); }
};

/** DELETE /api/requests/:id */
exports.remove = async (req, res, next) => {
  try {
    await q(`DELETE FROM requests WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

/** PUT /api/requests/:id  — تعديل حقول الطلب */
exports.update = async (req, res, next) => {
  try {
    const b = req.body;
    const exists = await q(`SELECT id FROM requests WHERE id = ?`, [req.params.id]);
    if (!exists[0]) return res.status(404).json({ error: 'الطلب غير موجود' });

    const insta = b.insta ? (String(b.insta).startsWith('@') ? b.insta : '@' + b.insta) : null;
    await withTx(async (conn) => {
      await conn.execute(
        `UPDATE requests SET
           event_name = COALESCE(?, event_name),
           organization = COALESCE(?, organization),
           lecturer = COALESCE(?, lecturer),
           hall_id = COALESCE(?, hall_id),
           phone = COALESCE(?, phone),
           instagram = COALESCE(?, instagram),
           proposed_dates = COALESCE(?, proposed_dates),
           goals = COALESCE(?, goals),
           axes = COALESCE(?, axes),
           notes = COALESCE(?, notes)
         WHERE id = ?`,
        [b.event || null, b.org || null, b.lecturer || null, b.hall || null,
         b.phone || null, insta, b.dates || null, b.goals || null, b.axes || null,
         b.notes || null, req.params.id]
      );
      if (Array.isArray(b.cats)) {
        await conn.execute(`DELETE FROM request_categories WHERE request_id = ?`, [req.params.id]);
        for (const c of b.cats) {
          await conn.execute(`INSERT IGNORE INTO request_categories (request_id, category_id) VALUES (?,?)`, [req.params.id, c]);
        }
      }
    });
    res.json(await hydrateRequest(req.params.id));
  } catch (e) { next(e); }
};
