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

module.exports = { initDb, sslOption, migrate };

/**
 * ترحيل خفيف وآمن (idempotent) — يضيف الأعمدة الناقصة إلى جداول موجودة.
 * يُستدعى عند كل إقلاع للخادم، ولا يؤثّر إن كانت الأعمدة موجودة.
 */
async function migrate({ log = console.log } = {}) {
  const dbName = process.env.DB_NAME || 'khudh_biyadi';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    ssl: sslOption(),
  });
  try {
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reports' AND COLUMN_NAME = 'status'`,
      [dbName]
    );
    if (rows[0] && rows[0].c === 0) {
      await conn.query(`ALTER TABLE \`reports\` ADD COLUMN status ENUM('pending','accepted') NOT NULL DEFAULT 'accepted'`);
      log('✔ ترحيل: أُضيف عمود status إلى جدول reports');
    }
    // ترحيل: عمود days في جدول requests
    const [drows] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'requests' AND COLUMN_NAME = 'days'`,
      [dbName]
    );
    if (drows[0] && drows[0].c === 0) {
      await conn.query(`ALTER TABLE \`requests\` ADD COLUMN days INT UNSIGNED NULL AFTER proposed_dates`);
      log('✔ ترحيل: أُضيف عمود days إلى جدول requests');
    }
  } finally {
    await conn.end();
  }
}
