'use strict';
/** متحكّم التحليلات — يغذّي رسوم لوحة المتابعة */
const { q } = require('../config/db');

/** GET /api/analytics/summary */
exports.summary = async (req, res, next) => {
  try {
    const [byStatus] = [await q(
      `SELECT status, COUNT(*) c FROM requests GROUP BY status`
    )];
    const statusMap = { review: 0, approved: 0, rejected: 0 };
    byStatus.forEach(r => { statusMap[r.status] = r.c; });

    const totalRow = await q(`SELECT COUNT(*) c FROM requests`);
    const benRow = await q(
      `SELECT COALESCE(SUM(rep.attendees),0) ben, COUNT(*) done
       FROM reports rep JOIN requests r ON r.id=rep.request_id WHERE r.status='approved'`
    );
    const utilRow = await q(
      `SELECT COALESCE(ROUND(AVG(rep.attendees / NULLIF(rep.capacity,0))*100),0) util
       FROM reports rep`
    );

    res.json({
      total: totalRow[0].c,
      byStatus: statusMap,
      beneficiaries: Number(benRow[0].ben),
      completedEvents: benRow[0].done,
      avgUtilization: Number(utilRow[0].util),
    });
  } catch (e) { next(e); }
};

/** GET /api/analytics/timeseries — الطلبات شهرياً */
exports.timeseries = async (req, res, next) => {
  try {
    const rows = await q(
      `SELECT DATE_FORMAT(submitted_at, '%Y-%m') ym, COUNT(*) count
       FROM requests WHERE submitted_at IS NOT NULL
       GROUP BY ym ORDER BY ym`
    );
    res.json(rows);
  } catch (e) { next(e); }
};

/** GET /api/analytics/by-hall */
exports.byHall = async (req, res, next) => {
  try {
    const rows = await q(
      `SELECT h.id, h.name, h.capacity, COUNT(r.id) count
       FROM halls h LEFT JOIN requests r ON r.hall_id=h.id
       GROUP BY h.id, h.name, h.capacity ORDER BY h.sort`
    );
    res.json(rows);
  } catch (e) { next(e); }
};

/** GET /api/analytics/by-category */
exports.byCategory = async (req, res, next) => {
  try {
    const rows = await q(
      `SELECT c.id, c.name, COUNT(rc.request_id) count
       FROM categories c LEFT JOIN request_categories rc ON rc.category_id=c.id
       GROUP BY c.id, c.name ORDER BY c.sort`
    );
    res.json(rows);
  } catch (e) { next(e); }
};
