'use strict';
/**
 * خدمة البريد — nodemailer.
 * في بيئة التطوير (بدون SMTP) تُطبع الرسائل في الـ console وتُسجّل في email_log.
 */
const nodemailer = require('nodemailer');
const { q } = require('../config/db');

let transporter = null;
const hasSmtp = !!process.env.SMTP_HOST;

if (hasSmtp) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

const FROM = process.env.MAIL_FROM || 'مشروع خذ بيدي <no-reply@beyadik.kw>';

async function logEmail(to, subject, template, requestId, status, error) {
  try {
    await q(
      `INSERT INTO email_log (to_email, subject, template, request_id, status, error)
       VALUES (?,?,?,?,?,?)`,
      [to, subject, template, requestId || null, status, error || null]
    );
  } catch (e) { /* تجاهل أخطاء التسجيل */ }
}

async function sendMail({ to, subject, html, template, requestId }) {
  if (!to) return;
  if (!hasSmtp) {
    console.log('\n📧 [بريد — وضع التطوير]');
    console.log('   إلى:', to);
    console.log('   الموضوع:', subject);
    await logEmail(to, subject, template, requestId, 'logged');
    return { logged: true };
  }
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    await logEmail(to, subject, template, requestId, 'sent');
    return info;
  } catch (err) {
    await logEmail(to, subject, template, requestId, 'failed', err.message);
    throw err;
  }
}

// ---------- قوالب ----------
const wrap = (body) => `<div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;background:#FAF8F2;padding:24px;color:#2A2520">
  <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #EADFC4;border-radius:14px;overflow:hidden">
    <div style="background:#2A2520;color:#fff;padding:18px 22px;font-weight:700">مشروع خذ بيدي · بوابة طلبات رعاية الفعاليات</div>
    <div style="padding:22px">${body}</div>
    <div style="padding:14px 22px;border-top:1px solid #eee;color:#9a9388;font-size:12px">ثلث المرحوم عبدالله عبداللطيف العثمان</div>
  </div></div>`;

const templates = {
  newRequest: (r) => ({
    subject: `طلب رعاية جديد: ${r.event_name} (${r.id})`,
    html: wrap(`<h2 style="color:#B8924A">طلب رعاية جديد</h2>
      <p>ورد طلب رعاية جديد بانتظار المراجعة:</p>
      <ul>
        <li><b>الفعالية:</b> ${r.event_name}</li>
        <li><b>الجهة الطالبة:</b> ${r.organization}</li>
        <li><b>رقم الطلب:</b> ${r.id}</li>
        <li><b>التواريخ المقترحة:</b> ${r.proposed_dates || '—'}</li>
      </ul>
      <p>يمكنك مراجعته من لوحة التحكّم.</p>`),
  }),
  statusChanged: (r) => ({
    subject: `تحديث حالة طلبك: ${r.event_name} (${r.id})`,
    html: wrap(`<h2 style="color:#B8924A">تحديث حالة الطلب</h2>
      <p>تم تحديث حالة طلب رعاية فعالية «${r.event_name}» إلى:
      <b>${({ review: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض' })[r.status] || r.status}</b>.</p>
      ${r.status === 'rejected' && r.reject_reason ? `<p><b>السبب:</b> ${r.reject_reason}</p>` : ''}
      ${r.status === 'approved' ? '<p>نتطلّع لإقامة فعالية ناجحة. سنرسل لاحقاً رابطاً لرفع تقرير الفعالية.</p>' : ''}`),
  }),
  shareReportLink: (r, link) => ({
    subject: `رابط رفع تقرير فعالية: ${r.event_name}`,
    html: wrap(`<h2 style="color:#B8924A">رابط رفع التقرير</h2>
      <p>يرجى رفع تقرير فعالية «${r.event_name}» وصورها عبر الرابط التالي:</p>
      <p><a href="${link}" style="background:#B8924A;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">رفع التقرير</a></p>
      <p style="color:#9a9388;font-size:12px">${link}</p>`),
  }),
  reportReceived: (r) => ({
    subject: `تم استلام تقرير فعالية: ${r.event_name} (${r.id})`,
    html: wrap(`<h2 style="color:#B8924A">تقرير ختامي جديد</h2>
      <p>استلم النظام تقرير فعالية «${r.event_name}» من الجهة المنفّذة، وأصبح متاحاً للعرض في لوحة التحكّم.</p>`),
  }),
};

module.exports = { sendMail, templates };
