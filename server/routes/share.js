'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { upload } = require('../middleware/upload');

// عام — برابط الرمز المخصّص للجهة المنفّذة
router.get('/:token', ctrl.getByToken);
router.post('/:token', upload.fields([{ name: 'photos', maxCount: 6 }]), ctrl.submitByToken);

module.exports = router;
