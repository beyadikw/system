'use strict';
/** أدوات مشتركة لتجميع بيانات الطلب */
const { q } = require('../config/db');

/** يبني رقم طلب جديد مثل BK-1043 */
async function nextRequestId() {
  const rows = await q(
    `SELECT id FROM requests WHERE id LIKE 'BK-%' ORDER BY CAST(SUBSTRING(id,4) AS UNSIGNED) DESC LIMIT 1`
  );
  const last = rows[0] ? parseInt(rows[0].id.slice(3), 10) : 1000;
  return 'BK-' + (last + 1);
}

/** يجمّع طلباً واحداً مع الفئات والمرفقات والتقرير */
async function hydrateRequest(id) {
  const reqRows = await q(
    `SELECT r.*, h.name AS hall_name, h.capacity AS hall_capacity
     FROM requests r LEFT JOIN halls h ON h.id = r.hall_id WHERE r.id = ?`, [id]
  );
  if (!reqRows[0]) return null;
  const req = reqRows[0];

  const cats = await q(
    `SELECT c.id, c.name FROM request_categories rc
     JOIN categories c ON c.id = rc.category_id WHERE rc.request_id = ?`, [id]
  );
  const atts = await q(
    `SELECT id, kind, file_name, stored_path, mime_type, size_bytes, sort
     FROM attachments WHERE request_id = ? ORDER BY kind, sort`, [id]
  );
  const repRows = await q(`SELECT * FROM reports WHERE request_id = ?`, [id]);

  return {
    ...req,
    agreed_terms: !!req.agreed_terms,
    categories: cats,
    attachments: atts,
    report: repRows[0] || null,
    report_photos: atts.filter(a => a.kind === 'photo'),
  };
}

/** تنسيق مختصر لقائمة الطلبات */
async function listRequests(status) {
  let sql = `SELECT r.id, r.event_name, r.organization, r.lecturer, r.status,
                    r.hall_id, h.name AS hall_name, r.proposed_dates, r.submitted_at,
                    (SELECT COUNT(*) FROM reports rep WHERE rep.request_id = r.id) AS has_report
             FROM requests r LEFT JOIN halls h ON h.id = r.hall_id`;
  const params = [];
  if (status && status !== 'all') { sql += ` WHERE r.status = ?`; params.push(status); }
  sql += ` ORDER BY r.submitted_at DESC, r.created_at DESC`;
  const rows = await q(sql, params);
  // اربط الفئات لكل صف
  for (const row of rows) {
    const cats = await q(
      `SELECT c.id, c.name FROM request_categories rc JOIN categories c ON c.id = rc.category_id WHERE rc.request_id = ?`,
      [row.id]
    );
    row.categories = cats;
    row.has_report = !!row.has_report;
  }
  return rows;
}

module.exports = { nextRequestId, hydrateRequest, listRequests };
