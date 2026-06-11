'use strict';
/** معالج الأخطاء الموحّد */
function notFound(req, res) {
  res.status(404).json({ error: 'المسار غير موجود' });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('✖', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'حجم الملف يتجاوز الحد المسموح' });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'حدث خطأ في الخادم' });
}

module.exports = { notFound, errorHandler };
