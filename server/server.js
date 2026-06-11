'use strict';
/**
 * خادم بوابة طلبات رعاية الفعاليات — مشروع خذ بيدي
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/error');
const { UPLOAD_DIR } = require('./middleware/upload');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ملفات المرفقات المرفوعة
app.use('/uploads', express.static(UPLOAD_DIR));

// الواجهة الأمامية (admin portal + public forms)
app.use(express.static(path.join(__dirname, '..', 'public')));

// فحص صحّة الخادم
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'khudh-biyadi', time: new Date().toISOString() }));

// مسارات API
app.use('/api', require('./routes/index'));        // auth + analytics
app.use('/api', require('./routes/meta'));          // halls + categories
app.use('/api/requests', require('./routes/requests'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/share', require('./routes/share'));   // عام — روابط الجهات المنفّذة

app.use('/api', notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);

// تهيئة تلقائية للجداول عند الإقلاع (مفيدة على الاستضافة المجانية بلا وصول طرفية):
// اضبط AUTO_INIT=true و AUTO_SEED=true في بيئة الخادم لأول تشغيل.
async function boot() {
  if (String(process.env.AUTO_INIT) === 'true') {
    try {
      const { initDb } = require('./db/initDb');
      await initDb({ seed: String(process.env.AUTO_SEED) === 'true' });
    } catch (e) {
      console.error('✖ فشلت التهيئة التلقائية:', e.message);
    }
  }
  app.listen(PORT, () => {
    console.log(`\n🚀 خادم خذ بيدي يعمل على المنفذ ${PORT}`);
    console.log(`   الواجهة:   http://localhost:${PORT}`);
    console.log(`   فحص الصحة: http://localhost:${PORT}/api/health`);
    if (!process.env.SMTP_HOST) console.log('   ✉️  البريد في وضع التطوير (طباعة في الـ console)');
  });
}
boot();

module.exports = app;
