# دليل النشر على الويب — مشروع خذ بيدي

دليل عملي خطوة بخطوة لرفع النظام على خادم حقيقي وربطه بنطاق مع HTTPS.

---

## الخطوة ١ — تفعيل الوضع الحيّ (ربط الواجهة بالخادم)

تم **ربط البوابة بالكامل** بالخادم. كل ما عليك:

في `public/index.html` غيّر السطر:
```html
<script>window.APP_MODE = 'demo';</script>
```
إلى:
```html
<script>window.APP_MODE = 'live';</script>
```

عند ذلك:
- تُحمّل لوحة المتابعة والطلبات والتقارير من قاعدة البيانات الحقيقية.
- اعتماد/رفض/تعديل/حذف الطلبات وحفظ التقارير ورفع الصور — كلها تُحفظ في الخادم.
- تُطلب صفحة تسجيل الدخول تلقائياً لغير المسجّلين، ويظهر زر تسجيل الخروج.
- نموذج التقديم يعطي رقم طلب حقيقياً من الخادم، وصفحة الجهة المنفّذة `report.html` تعمل مباشرةً.

> **ملف الربط:** `public/js/data.js` (مُحوِّل البيانات + المخزن) و `public/js/api.js` (عميل REST). لا حاجة لتعديلهما.

---

## الخطوة ٢ — تأمين الإنتاج

### أ. متغيّرات البيئة
```bash
cp .env.production.example .env
```
ثم في `.env`:
- **`JWT_SECRET`** — سرّ عشوائي جاهز ومضمّن في الملف. لتوليد غيره:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- **`DB_PASSWORD`** — كلمة مرور قوية لمستخدم قاعدة بيانات مخصّص (لا تستخدم root).
- **`SMTP_*`** — بيانات مزوّد البريد الحقيقي لتفعيل الإشعارات.
- اضبط **`CLIENT_ORIGIN`** و **`PUBLIC_BASE_URL`** على نطاقك بصيغة `https://`.

### ب. كلمة مرور المنسّق
بعد البذر، غيّر كلمة المرور فوراً:
```bash
npm run set-password -- coordinator@beyadik.kw "كلمة-مرور-قوية-جديدة"
```
لإضافة مدير جديد:
```bash
npm run set-password -- admin@beyadik.kw "Str0ng!Pass" "مدير النظام" admin
```

### ج. HTTPS عبر نطاق
**الأسهل — Caddy** (شهادة تلقائية مجانية):
1. وجّه DNS نطاقك إلى عنوان خادمك (سجلّ A).
2. انسخ `deploy/Caddyfile`، استبدل `beyadik.kw` بنطاقك.
3. `caddy run` (أو `caddy start`). انتهى — HTTPS يعمل ويتجدّد تلقائياً.

**بديل — nginx + certbot:** استخدم `deploy/nginx.conf` ثم:
```bash
sudo certbot --nginx -d beyadik.kw -d www.beyadik.kw
```

### د. إبقاء التطبيق يعمل (PM2)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup && pm2 save      # ليعمل تلقائياً بعد إعادة تشغيل الخادم
```

---

## التسلسل الكامل على خادم نظيف (Ubuntu مثلاً)

```bash
# 1) المتطلبات
sudo apt update && sudo apt install -y nodejs npm mysql-server
sudo mysql_secure_installation

# 2) إنشاء قاعدة ومستخدم
sudo mysql -e "CREATE DATABASE khudh_biyadi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'beyadik_app'@'localhost' IDENTIFIED BY 'كلمة-قوية'; GRANT ALL ON khudh_biyadi.* TO 'beyadik_app'@'localhost'; FLUSH PRIVILEGES;"

# 3) المشروع
cd app
cp .env.production.example .env     # واضبط القيم
npm install --omit=dev
npm run db:seed                     # ينشئ الجداول + البيانات الأولية
npm run set-password -- coordinator@beyadik.kw "كلمة-مرور-قوية"

# 4) التشغيل الدائم + HTTPS
npm install -g pm2 && pm2 start ecosystem.config.js && pm2 save
caddy start    # بعد ضبط Caddyfile ونطاقك
```

ثم افتح: **https://نطاقك/login.html**

---

## قائمة تحقّق قبل الإطلاق

- [ ] `APP_MODE = 'live'` في `public/index.html`
- [ ] `JWT_SECRET` عشوائي طويل، و `.env` غير مرفوع لـ Git
- [ ] كلمة مرور المنسّق غُيّرت، ومستخدم قاعدة البيانات ليس root
- [ ] `NODE_ENV=production` و `PUBLIC_BASE_URL` بنطاق https الصحيح
- [ ] HTTPS يعمل (Caddy أو nginx+certbot)
- [ ] بيانات SMTP صحيحة (جرّب طلباً تجريبياً وتأكّد من وصول الإشعار)
- [ ] نسخ احتياطي دوري لقاعدة البيانات ومجلّد `uploads/`

---

© مشروع خذ بيدي — ثلث المرحوم عبدالله عبداللطيف العثمان.
