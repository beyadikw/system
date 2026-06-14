'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { upload } = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');

// داخلي (فريق المشروع)
router.get('/', requireAuth, ctrl.list);
router.get('/:requestId', requireAuth, ctrl.getOne);
router.post('/:requestId', requireAuth, upload.fields([{ name: 'photos', maxCount: 6 }]), ctrl.create);
router.post('/:requestId/accept', requireAuth, ctrl.accept);

module.exports = router;
