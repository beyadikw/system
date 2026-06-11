'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/requestController');
const { upload } = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');

// التقديم العام (بدون مصادقة) — مع مرفقَي الطلب والسيرة الذاتية
router.post('/', upload.fields([
  { name: 'requestDoc', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
]), ctrl.create);

// إدارة الطلبات — تتطلّب مصادقة
router.get('/', requireAuth, ctrl.list);
router.get('/:id', requireAuth, ctrl.getOne);
router.patch('/:id/status', requireAuth, ctrl.updateStatus);
router.put('/:id', requireAuth, ctrl.update);
router.post('/:id/share', requireAuth, ctrl.shareLink);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
