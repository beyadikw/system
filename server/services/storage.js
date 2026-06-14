'use strict';
/**
 * خدمة التخزين — ترفع الملفات إلى Cloudinary (تخزين دائم) إن كانت مُعدّة،
 * وإلا تحفظها على القرص المحلي (مؤقّت على الاستضافات المجانية).
 *
 * الإعداد على Render: أضف متغيّر البيئة
 *   CLOUDINARY_URL = cloudinary://<api_key>:<api_secret>@<cloud_name>
 * (تجده في لوحة Cloudinary → Dashboard → API Environment variable)
 */
const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../middleware/upload');

const hasCloud = !!(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME);
let cloudinary = null;
if (hasCloud) {
  try {
    cloudinary = require('cloudinary').v2;
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    } // وإلا تُقرأ تلقائياً من CLOUDINARY_URL
    console.log('☁️  التخزين: Cloudinary (دائم)');
  } catch (e) {
    console.warn('⚠️  حزمة cloudinary غير مثبّتة — التخزين على القرص المحلي. شغّل: npm install');
    cloudinary = null;
  }
} else {
  console.log('💾 التخزين: القرص المحلي (مؤقّت). أضف CLOUDINARY_URL للتخزين الدائم.');
}

function uploadToCloud(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'khudh-biyadi', resource_type: 'auto', use_filename: true, unique_filename: true },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    );
    stream.end(file.buffer);
  });
}

function saveToDisk(file) {
  const ext = path.extname(file.originalname);
  const base = path.basename(file.originalname, ext).replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40);
  const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${base}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer);
  return name; // اسم الملف فقط — يُقدَّم عبر /uploads/<name>
}

/** يحفظ ملفاً ويعيد القيمة التي تُخزَّن في stored_path
 *  (رابط Cloudinary كامل، أو اسم ملف محلي) */
async function persist(file) {
  if (!file) return null;
  if (cloudinary) {
    try { return await uploadToCloud(file); }
    catch (e) { console.error('✖ فشل رفع Cloudinary، تحويل للقرص:', e.message); return saveToDisk(file); }
  }
  return saveToDisk(file);
}

module.exports = { persist, hasCloud: !!cloudinary };
