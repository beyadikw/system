'use strict';
/** رفع الملفات — multer مع تخزين على القرص وتصفية الأنواع */
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${base}${ext}`);
  },
});

const ALLOWED = /pdf|doc|docx|jpg|jpeg|png|webp|mp4|mov/i;

function fileFilter(req, file, cb) {
  const ok = ALLOWED.test(path.extname(file.originalname));
  if (ok) return cb(null, true);
  cb(new Error('نوع الملف غير مسموح. المسموح: PDF, Word, صور, فيديو'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: Number(process.env.MAX_FILE_MB || 15) * 1024 * 1024 },
});

module.exports = { upload, UPLOAD_DIR };
