'use strict';
/** رفع الملفات — multer في الذاكرة (لتمريرها إلى Cloudinary أو القرص) + تصفية الأنواع */
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = /pdf|doc|docx|jpg|jpeg|png|webp|mp4|mov/i;

function fileFilter(req, file, cb) {
  const ok = ALLOWED.test(path.extname(file.originalname));
  if (ok) return cb(null, true);
  cb(new Error('نوع الملف غير مسموح. المسموح: PDF, Word, صور, فيديو'));
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: Number(process.env.MAX_FILE_MB || 15) * 1024 * 1024 },
});

module.exports = { upload, UPLOAD_DIR };
