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

app.use(cors());   // يسمح بطلبات الواجهة من أي مصدر (Render أو GitHub Pages) — لا تُستخدم الكوكيز، فالمصادقة عبر توكن في الترويسة
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
  // ترحيل تلقائي آمن عند كل إقلاع: يضيف أي عمود ناقص (مثل status) لقاعدة قائمة
  try {
    const { migrate } = require('./db/initDb');
    await migrate();
  } catch (e) {
    console.error('• تخطّي الترحيل:', e.message);
  }
  // إعادة ضبط كلمة مرور المنسّق إجبارياً عند الإقلاع (حلّ نهائي مضمون):
  // اضبط RESET_COORDINATOR_PASSWORD=كلمتك في بيئة الخادم، أعد النشر، ثم احذف المتغيّر.
  const resetPass = process.env.RESET_COORDINATOR_PASSWORD;
  if (resetPass && resetPass.trim()) {
    try {
      const bcrypt = require('bcryptjs');
      const { q } = require('./config/db');
      const email = process.env.RESET_COORDINATOR_EMAIL || 'coordinator@beyadik.kw';
      const hash = await bcrypt.hash(resetPass.trim(), 10);
      const rows = await q('SELECT id FROM users WHERE email = ?', [email]);
      if (rows[0]) {
        await q('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
      } else {
        await q('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
          ['ماجد الشمري', email, hash, 'coordinator']);
      }
      console.log(`🔑 تم ضبط كلمة مرور المستخدم ${email} من RESET_COORDINATOR_PASSWORD.`);
      console.log('   ⚠️ احذف المتغيّر RESET_COORDINATOR_PASSWORD بعد التأكد من الدخول.');
    } catch (e) {
      console.error('✖ تعذّر ضبط كلمة المرور:', e.message);
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
