/* ============================================================
   config.js — يحدّد عنوان الخادم (API) تلقائياً
   • إذا فُتحت الصفحة من Render مباشرةً → طلبات نسبية (نفس الموقع).
   • إذا فُتحت من GitHub Pages (لا خادم بها) → توجّه الطلبات إلى خادم Render.
   ⚠️ إن تغيّر رابط خدمتك على Render، حدّث القيمة أدناه فقط.
   ============================================================ */
(function () {
  var RENDER_API = 'https://khudh-biyadi.onrender.com';
  var host = location.hostname || '';
  // GitHub Pages أو أي استضافة ثابتة لا تشغّل الخادم
  if (host.endsWith('github.io') || host.endsWith('netlify.app') || host.endsWith('pages.dev')) {
    window.API_BASE = RENDER_API;
  }
  // خلاف ذلك (Render أو محلياً) تبقى الطلبات نسبية — نفس الموقع
})();
