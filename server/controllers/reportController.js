'use strict';
/** متحكّم التقارير الختامية */
const { q, withTx } = require('../config/db');
const { hydrateRequest } = require('./helpers');
const { sendMail, templates } = require('../services/email');

/** يحفظ/يحدّث تقريراً ويربط صوره */
async function saveReport({ requestId, body, files, source, status }) {
  const reqRows = await q(`SELECT r.*, h.capacity AS hall_capacity FROM requests r LEFT JOIN halls h ON h.id=r.hall_id WHERE r.id=?`, [requestId]);
  if (!reqRows[0]) { const e = new Error('الطلب غير موجود'); e.status = 404; throw e; }
  const capacity = Number(body.capacity) || reqRows[0].hall_capacity || 0;
  const st = status || 'accepted';

  // ارفع صور التقرير أولاً (Cloudinary/القرص) قبل المعاملة
  const { persist } = require('../services/storage');
  const photoFiles = (files && files.photos) || [];
  const photoStored = [];
  for (const p of photoFiles) photoStored.push({ f: p, url: await persist(p) });

  await withTx(async (conn) => {
    await conn.execute(
      `INSERT INTO reports (request_id, attendees, capacity, has_video, summary, outcomes, notes, source, status)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE attendees=VALUES(attendees), capacity=VALUES(capacity),
         has_video=VALUES(has_video), summary=VALUES(summary), outcomes=VALUES(outcomes),
         notes=VALUES(notes), source=VALUES(source), status=VALUES(status)`,
      [requestId, Number(body.attendees) || 0, capacity, body.video === 'true' || body.video === true ? 1 : 0,
       body.summary || null, body.outcomes || null, body.notes || null, source, st]
    );
    // صور التقرير
    if (photoStored.length) {
      const existing = await conn.execute(`SELECT COUNT(*) c FROM attachments WHERE request_id=? AND kind='photo'`, [requestId]);
      let sort = existing[0][0].c;
      for (const p of photoStored) {
        await conn.execute(
          `INSERT INTO attachments (request_id, kind, file_name, stored_path, mime_type, size_bytes, sort)
           VALUES (?, 'photo', ?,?,?,?,?)`,
          [requestId, p.f.originalname, p.url, p.f.mimetype, p.f.size, sort++]
        );
      }
    }
  });
  return hydrateRequest(requestId);
}

/** GET /api/reports — الطلبات المعتمدة (مع/بدون تقرير) */
exports.list = async (req, res, next) => {
  try {
    const rows = await q(
      `SELECT r.id, r.event_name, r.organization, r.lecturer, r.hall_id, h.name AS hall_name,
              h.capacity AS hall_capacity, r.proposed_dates,
              rep.attendees, rep.capacity, rep.has_video, rep.status AS report_status, rep.source AS report_source,
              (rep.id IS NOT NULL) AS has_report,
              (SELECT COUNT(*) FROM attachments a WHERE a.request_id=r.id AND a.kind='photo') AS photo_count
       FROM requests r LEFT JOIN halls h ON h.id=r.hall_id
       LEFT JOIN reports rep ON rep.request_id=r.id
       WHERE r.status='approved' ORDER BY r.submitted_at DESC`
    );
    rows.forEach(x => { x.has_report = !!x.has_report; });
    res.json(rows);
  } catch (e) { next(e); }
};

/** GET /api/reports/:requestId */
exports.getOne = async (req, res, next) => {
  try {
    const full = await hydrateRequest(req.params.requestId);
    if (!full) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json(full);
  } catch (e) { next(e); }
};

/** POST /api/reports/:requestId  (داخلي — يتطلّب مصادقة) */
exports.create = async (req, res, next) => {
  try {
    const full = await saveReport({ requestId: req.params.requestId, body: req.body, files: req.files, source: 'internal', status: 'accepted' });
    res.status(201).json(full);
  } catch (e) { next(e); }
};

/** POST /api/reports/:requestId/accept — قبول تقرير ورد من الجهة المنفّذة */
exports.accept = async (req, res, next) => {
  try {
    await q(`UPDATE reports SET status='accepted' WHERE request_id=?`, [req.params.requestId]);
    const full = await hydrateRequest(req.params.requestId);
    res.json(full);
  } catch (e) { next(e); }
};

/** GET /api/share/:token — معاينة بيانات الفعالية للجهة المنفّذة (عام) */
exports.getByToken = async (req, res, next) => {
  try {
    const rows = await q(
      `SELECT r.id, r.event_name, r.organization, r.lecturer, r.hall_id, h.name AS hall_name,
              h.capacity AS hall_capacity, r.proposed_dates, r.days, r.goals, r.axes
       FROM requests r LEFT JOIN halls h ON h.id=r.hall_id WHERE r.share_token=? OR r.id=?`,
      [req.params.token, req.params.token]
    );
    if (!rows[0]) return res.status(404).json({ error: 'الرابط غير صالح' });
    res.json(rows[0]);
  } catch (e) { next(e); }
};

/** POST /api/share/:token — رفع التقرير من الجهة المنفّذة (عام) */
exports.submitByToken = async (req, res, next) => {
  try {
    const rows = await q(`SELECT id FROM requests WHERE share_token=? OR id=?`, [req.params.token, req.params.token]);
    if (!rows[0]) return res.status(404).json({ error: 'الرابط غير صالح' });
    const full = await saveReport({ requestId: rows[0].id, body: req.body, files: req.files, source: 'executor', status: 'pending' });
    // إشعار الفريق باستلام التقرير
    const tpl = templates.reportReceived(full);
    sendMail({ to: process.env.ADMIN_NOTIFY_EMAIL, ...tpl, template: 'reportReceived', requestId: full.id }).catch(() => {});
    res.status(201).json({ ok: true, id: full.id });
  } catch (e) { next(e); }
};
