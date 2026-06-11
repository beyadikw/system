'use strict';
/**
 * تهيئة قاعدة البيانات (مشتركة) — تعمل محلياً وعلى الاستضافات السحابية.
 *
 * على الاستضافة المجانية (مثل Aiven) لا يُسمح بإنشاء قاعدة بيانات جديدة،
 * بل تُعطى قاعدة جاهزة. في تلك الحالة اضبط DB_CREATE=false فتُنشأ الجداول
 * داخل القاعدة الموجودة (DB_NAME) مباشرةً، مع دعم SSL عبر DB_SSL=true.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

function sslOption() {
  return String(process.env.DB_SSL) === 'true' ? { rejectUnauthorized: false } : undefined;
}

function readSql(file, stripDbLines) {
  let sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
  if (stripDbLines) {
    // احذف أسطر إنشاء/اختيار قاعدة البيانات لتعمل ضمن قاعدة جاهزة
    sql = sql
      .replace(/CREATE DATABASE[^;]*;/gi, '')
      .replace(/USE\s+[`\w]+\s*;/gi, '');
  }
  return sql;
}

/** يهيّئ المخطط (وبيانات أولية اختيارية) ويضبط كلمة مرور المنسّق */
async function initDb({ seed = false, log = console.log } = {}) {
  const createDb = String(process.env.DB_CREATE) !== 'false'; // افتراضياً ينشئ القاعدة محلياً
  const dbName = process.env.DB_NAME || 'khudh_biyadi';

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: createDb ? undefined : dbName, // على الاستضافة نتصل بالقاعدة الجاهزة
    multipleStatements: true,
    ssl: sslOption(),
  });

  try {
    await conn.query(readSql('schema.sql', !createDb));
    log('✔ تم إنشاء الجداول');
    if (seed) {
      await conn.query(readSql('seed.sql', !createDb));
      const target = createDb ? `\`${dbName}\`.users` : 'users';
      // اضبط كلمة المرور أول مرة فقط (إن كانت ما تزال القيمة المبدئية من seed.sql)،
      // حتى لا تُعاد إلى الافتراضية عند كل إعادة تشغيل على الاستضافة.
      const PLACEHOLDER = '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDqQ8q1pWf6n8Qe7Yk5mQ2k3xY1Hq';
      const [rows] = await conn.query(`SELECT password_hash FROM ${target} WHERE email = ?`, ['coordinator@beyadik.kw']);
      if (rows[0] && rows[0].password_hash === PLACEHOLDER) {
        const defaultPass = process.env.SEED_COORDINATOR_PASSWORD || 'Beyadik@2026';
        const hash = await bcrypt.hash(defaultPass, 10);
        await conn.query(`UPDATE ${target} SET password_hash = ? WHERE email = ?`, [hash, 'coordinator@beyadik.kw']);
        log(`✔ كلمة مرور المنسّق الأولية: ${defaultPass}  (غيّرها بعد أول دخول)`);
      } else {
        log('• كلمة مرور المنسّق محفوظة كما هي (لم تُعدّل).');
      }
    }
    log('✅ اكتملت تهيئة قاعدة البيانات.');
  } finally {
    await conn.end();
  }
}

module.exports = { initDb, sslOption };
