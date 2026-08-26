'use strict';
/**
 * يبني ملف تقرير Word (.docx) حقيقي وقائم بذاته: يقرأ كل صورة فعلياً من القرص
 * (أو من Cloudinary عبر HTTP) ويُضمّنها كـ Buffer داخل بنية DOCX نفسها
 * (word/media/imageN.*) — لا روابط خارجية ولا مجلد صور منفصل عند التنزيل.
 */
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, VerticalAlign,
} = require('docx');
const { UPLOAD_DIR } = require('../middleware/upload');

const GOLD = 'B8924A', INK = '2A2520', MUT = '7A7268';

function safeFileName(s) {
  return String(s || 'تقرير').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'تقرير';
}

/** يقرأ صورة مرفقة فعلياً كـ Buffer، مهما كان شكل المسار المخزَّن
 *  (اسم ملف، "/uploads/x.jpg"، أو رابط Cloudinary كامل) — أو null إن تعذّر */
async function resolveImageBuffer(storedPath) {
  if (!storedPath) return null;
  try {
    if (/^https?:\/\//i.test(storedPath)) {
      const res = await fetch(storedPath);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return Buffer.from(await res.arrayBuffer());
    }
    // يمنع الخروج من مجلد uploads مهما كان شكل المسار الوارد (Path Traversal)
    const name = path.basename(storedPath.replace(/^\/?uploads\//, ''));
    const full = path.join(UPLOAD_DIR, name);
    if (!full.startsWith(UPLOAD_DIR)) throw new Error('مسار غير آمن');
    if (!fs.existsSync(full)) throw new Error('الملف غير موجود على القرص');
    return fs.readFileSync(full);
  } catch (e) {
    console.warn(`Report export: image not found: ${storedPath} (${e.message})`);
    return null;
  }
}

/** يحسب أبعاداً تحافظ على النسبة الأصلية ولا تتجاوز الحد الأقصى (بدون تمدّد) */
function fitSize(w, h, maxW, maxH) {
  const scale = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/** يبني ImageRun جاهزاً للإدراج مع أبعاد محسوبة، أو null إن تعذّرت قراءة الصورة/أبعادها */
function buildImage(buffer, maxW, maxH) {
  if (!buffer) return null;
  let dim;
  try { dim = sizeOf(buffer); } catch (e) { console.warn('Report export: unreadable image dimensions — skipped'); return null; }
  if (!dim || !dim.width || !dim.height) return null;
  const { width, height } = fitSize(dim.width, dim.height, maxW, maxH);
  const type = dim.type === 'png' ? 'png' : dim.type === 'webp' ? 'webp' : dim.type === 'gif' ? 'gif' : 'jpg';
  try {
    return { run: new ImageRun({ data: buffer, transformation: { width, height }, type }), width, height };
  } catch (e) { console.warn('Report export: failed to embed image — skipped (' + e.message + ')'); return null; }
}

function heading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, alignment: AlignmentType.RIGHT, bidirectional: true,
    spacing: { before: 260, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD } },
    children: [new TextRun({ text, bold: true, color: INK, size: 24 })],
  });
}
function textBlock(text, opts = {}) {
  const lines = String(text || '').split(/\r?\n/);
  return lines.map(line => new Paragraph({
    alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { after: 120 },
    children: [new TextRun({ text: line || ' ', color: opts.color || '3A342D', size: opts.size || 22 })],
  }));
}
function metaRow(k, v) {
  const cellStyle = { verticalAlign: VerticalAlign.CENTER, margins: { top: 90, bottom: 90, left: 140, right: 140 } };
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 34, type: WidthType.PERCENTAGE }, shading: { fill: 'FBF6EA' }, ...cellStyle,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: k, bold: true, color: MUT, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 66, type: WidthType.PERCENTAGE }, ...cellStyle,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: v || '—', color: INK, size: 22 })] })],
      }),
    ],
  });
}
function imageParagraph(imgResult, caption) {
  const out = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 60 }, children: [imgResult.run] })];
  if (caption) out.push(new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, spacing: { after: 220 }, children: [new TextRun({ text: caption, color: MUT, size: 18 })] }));
  return out;
}

/** يبني Buffer لملف .docx كامل ومستقل لتقرير فعالية، بصوره مُضمَّنة فعلياً داخل الملف */
async function buildReportDocx(full) {
  const rep = full.report || {};
  const atts = full.attachments || [];
  const photoAtts = atts.filter(a => a.kind === 'photo').sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const posterAtt = atts.find(a => a.kind === 'poster');
  const cats = (full.categories || []).map(c => c.name).join('، ');
  const pct = rep.capacity ? Math.round((rep.attendees / rep.capacity) * 100) : 0;

  const posterBuf = posterAtt ? await resolveImageBuffer(posterAtt.stored_path) : null;
  const posterImg = posterBuf ? buildImage(posterBuf, 380, 520) : null;

  const photoImgs = [];
  for (let i = 0; i < photoAtts.length; i++) {
    const buf = await resolveImageBuffer(photoAtts[i].stored_path);
    const img = buf ? buildImage(buf, 520, 420) : null;
    if (img) photoImgs.push({ img, index: i + 1 });
  }

  const children = [];
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, bidirectional: true, spacing: { after: 40 },
    children: [new TextRun({ text: 'تقرير ختامي للفعالية', bold: true, color: GOLD, size: 20 })],
  }));
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, bidirectional: true, spacing: { after: 60 },
    children: [new TextRun({ text: full.event_name || '', bold: true, color: INK, size: 40 })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, bidirectional: true, spacing: { after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: GOLD } },
    children: [new TextRun({ text: `${full.organization || ''} · ${full.proposed_dates || ''}`, color: MUT, size: 22 })],
  }));

  children.push(heading('بيانات الفعالية'));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'EADFC4' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'EADFC4' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'EADFC4' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'EADFC4' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'EADFC4' }, insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'EADFC4' },
    },
    rows: [
      metaRow('اسم الفعالية', full.event_name),
      metaRow('الجهة المنفّذة', full.organization),
      metaRow('المحاضر', full.lecturer),
      metaRow('القاعة', full.hall_name),
      metaRow('التاريخ', full.proposed_dates),
      metaRow('عدد الأيام', full.days ? full.days + ' يوم' : ''),
      metaRow('الفئة المستهدفة', cats),
      metaRow('عدد المستفيدين', `${rep.attendees ?? 0} مستفيد` + (rep.capacity ? ` (نسبة إشغال ${pct}٪ من سعة ${rep.capacity})` : '')),
      metaRow('توثيق مصوّر', `${photoAtts.length || '—'} صورة${rep.has_video ? ' · فيديو متوفّر' : ''}`),
    ],
  }));

  if (posterImg) { children.push(heading('إعلان الفعالية')); children.push(...imageParagraph(posterImg, null)); }
  else if (posterAtt) { children.push(heading('إعلان الفعالية')); children.push(...textBlock('(تعذّر تحميل صورة الإعلان)', { color: '9A9388' })); }

  if (rep.summary) { children.push(heading('ملخّص الفعالية')); children.push(...textBlock(rep.summary)); }
  if (rep.outcomes) { children.push(heading('النتائج والأثر')); children.push(...textBlock(rep.outcomes)); }

  children.push(heading(`التوثيق المصوّر · ${photoAtts.length} صورة`));
  if (photoImgs.length) {
    photoImgs.forEach(p => children.push(...imageParagraph(p.img, `صورة ${p.index} من الفعالية`)));
  } else {
    children.push(...textBlock(photoAtts.length ? '(تعذّر تحميل صور الفعالية)' : 'لا توجد صور مرفقة بعد.', { color: '9A9388' }));
  }

  if (rep.notes) { children.push(heading('ملاحظات وتوصيات')); children.push(...textBlock(rep.notes)); }

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, bidirectional: true, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 16, color: GOLD } },
    children: [new TextRun({ text: 'صدر هذا التقرير عن مشروع «خذ بيدي» — ثلث المرحوم عبدالله عبداللطيف العثمان', color: MUT, size: 18 })],
  }));

  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1020, bottom: 1020, left: 1020, right: 1020 } },
      },
      children,
    }],
    styles: { default: { document: { run: { font: 'Arial' } } } },
  });

  const buffer = await Packer.toBuffer(doc);
  return { buffer, filename: safeFileName(full.event_name) + '.docx' };
}

module.exports = { buildReportDocx, safeFileName };
