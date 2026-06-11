'use strict';
const router = require('express').Router();
const { q } = require('../config/db');

/** GET /api/meta — القاعات والفئات (عام، يغذّي نموذج التقديم) */
router.get('/meta', async (req, res, next) => {
  try {
    const halls = await q(`SELECT id, name, note, capacity FROM halls ORDER BY sort`);
    const categories = await q(`SELECT id, name FROM categories ORDER BY sort`);
    res.json({ halls, categories });
  } catch (e) { next(e); }
});

module.exports = router;
