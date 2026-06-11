'use strict';
/**
 * إدارة المستخدمين — إنشاء أو تغيير كلمة مرور عضو في الفريق.
 *
 *   node server/scripts/set-password.js <email> <new-password> [name] [role]
 *
 * أمثلة:
 *   node server/scripts/set-password.js coordinator@beyadik.kw "كلمة-قوية-جديدة"
 *   node server/scripts/set-password.js admin@beyadik.kw "Str0ng!Pass" "مدير النظام" admin
 *
 * إن لم يوجد المستخدم يُنشأ تلقائياً.
 */
const bcrypt = require('bcryptjs');
const { q } = require('../config/db');

(async () => {
  const [, , email, password, name, role] = process.argv;
  if (!email || !password) {
    console.error('الاستخدام: node server/scripts/set-password.js <email> <password> [name] [role]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('✖ كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
    process.exit(1);
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const existing = await q('SELECT id FROM users WHERE email = ?', [email]);
    if (existing[0]) {
      await q('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
      console.log(`✔ تم تحديث كلمة مرور ${email}`);
    } else {
      await q(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
        [name || email.split('@')[0], email, hash, role || 'coordinator']
      );
      console.log(`✔ تم إنشاء المستخدم ${email} (${role || 'coordinator'})`);
    }
  } catch (e) {
    console.error('✖ خطأ:', e.message);
    process.exitCode = 1;
  }
  process.exit();
})();
