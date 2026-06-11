'use strict';
/**
 * تهيئة قاعدة البيانات من سطر الأوامر.
 *   node server/db/init.js            ← الجداول فقط
 *   node server/db/init.js --seed     ← الجداول + البيانات الأولية
 *
 * المنطق المشترك في initDb.js (يُستخدم أيضاً للتهيئة التلقائية عند الإقلاع).
 */
require('dotenv').config();
const { initDb } = require('./initDb');

(async () => {
  try {
    await initDb({ seed: process.argv.includes('--seed') });
  } catch (e) {
    console.error('✖ فشل التهيئة:', e.message);
    process.exitCode = 1;
  }
  process.exit();
})();
