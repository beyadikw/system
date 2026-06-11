'use strict';
const router = require('express').Router();
const auth = require('../controllers/authController');
const analytics = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/auth');

// المصادقة
router.post('/auth/login', auth.login);
router.get('/auth/me', requireAuth, auth.me);

// التحليلات (لوحة المتابعة)
router.get('/analytics/summary', requireAuth, analytics.summary);
router.get('/analytics/timeseries', requireAuth, analytics.timeseries);
router.get('/analytics/by-hall', requireAuth, analytics.byHall);
router.get('/analytics/by-category', requireAuth, analytics.byCategory);

module.exports = router;
