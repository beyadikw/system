# النشر مجاناً — دليل مبسّط خطوة بخطوة

سننشر النظام **مجاناً** على خدمتين:
- **Aiven** → قاعدة بيانات MySQL مجانية.
- **Render** → تشغيل التطبيق، ويعطيك رابطاً آمناً (HTTPS) ونطاقاً مجانياً تلقائياً.

ستحتاج فقط إلى **حساب GitHub** (مجاني) لرفع ملفات المشروع. الوقت المتوقّع: ١٥–٢٠ دقيقة.

---

## 🗄️ أولاً: قاعدة البيانات على Aiven

1. ادخل إلى **aiven.io** وأنشئ حساباً مجانياً.
2. اضغط **Create service** → اختر **MySQL**.
3. اختر الخطة المجانية **Free plan**، ثم اسم الخدمة، واضغط **Create**.
4. انتظر حتى تتحوّل الحالة إلى **Running** (بضع دقائق).
5. من صفحة الخدمة، انسخ بيانات الاتصال (Connection information):
   - **Host** · **Port** · **User** · **Password** · **Database name** (غالباً `defaultdb`).

> احتفظ بهذه البيانات، سنضعها في Render بعد قليل.

---

## 📦 ثانياً: رفع المشروع إلى GitHub

1. أنشئ حساباً على **github.com** (إن لم يكن لديك).
2. أنشئ مستودعاً جديداً **New repository** (اجعله Private).
3. ارفع **محتويات مجلّد `app`** إلى المستودع (يمكنك السحب والإفلات عبر زر **Add file → Upload files**).

> المهم أن يكون ملف `package.json` و `render.yaml` في **جذر** المستودع.

---

## 🚀 ثالثاً: التطبيق على Render

1. ادخل إلى **render.com** وسجّل الدخول بحساب GitHub.
2. اضغط **New → Blueprint** ثم اختر مستودعك. سيقرأ Render ملف `render.yaml` تلقائياً.
   - (أو **New → Web Service** يدوياً: Build = `npm install` · Start = `npm start`).
3. عند طلب متغيّرات البيئة، أدخل بيانات Aiven:
   | المتغيّر | القيمة |
   |---|---|
   | `DB_HOST` | Host من Aiven |
   | `DB_PORT` | Port من Aiven |
   | `DB_USER` | User من Aiven |
   | `DB_PASSWORD` | Password من Aiven |
   | `DB_NAME` | `defaultdb` (أو اسم القاعدة) |
   | `SEED_COORDINATOR_PASSWORD` | كلمة مرور أولية قوية تختارها |
   | `PUBLIC_BASE_URL` | اتركه الآن، واملأه برابط Render بعد أول نشر |
   | `CLIENT_ORIGIN` | نفس رابط Render |

   > أمّا `JWT_SECRET` و `AUTO_INIT` و `DB_SSL` فمضبوطة تلقائياً من `render.yaml`.
4. اضغط **Deploy / Apply**. سيبني Render المشروع، ويُنشئ الجداول تلقائياً عند أول تشغيل.
5. بعد النجاح ستحصل على رابط مثل: `https://khudh-biyadi.onrender.com`
   - انسخه وضعه في `PUBLIC_BASE_URL` و `CLIENT_ORIGIN` ثم أعد النشر (Redeploy).

---

## 🔌 رابعاً: تفعيل الوضع الحيّ

في مستودع GitHub، افتح `public/index.html` وغيّر:
```html
<script>window.APP_MODE = 'demo';</script>
```
إلى:
```html
<script>window.APP_MODE = 'live';</script>
```
احفظ التعديل — سيعيد Render النشر تلقائياً.

---

## ✅ خامساً: الدخول والتأمين

- افتح: `https://رابطك.onrender.com/login.html`
- الدخول: `coordinator@beyadik.kw` + كلمة المرور التي وضعتها في `SEED_COORDINATOR_PASSWORD`.
- **مهم:** بعد التأكد أن كل شيء يعمل، افتح إعدادات Render وغيّر `AUTO_SEED` إلى `false` (حتى لا تُعاد البيانات الأولية عند كل تشغيل).

---

## ⚠️ ملاحظتان مهمّتان عن الخطة المجانية

1. **النوم بعد الخمول:** خدمة Render المجانية «تنام» بعد ١٥ دقيقة دون استخدام، وتستغرق أول فتحة بعد النوم ~٣٠ ثانية لتستيقظ. هذا طبيعي ومقبول لأداة داخلية.
2. **الملفات المرفوعة مؤقتة:** على الخطة المجانية، المرفقات والصور المرفوعة قد تُحذف عند إعادة النشر. الحلول:
   - للاستخدام الجادّ: فعّل **Persistent Disk** في Render (ميزة مدفوعة بسيطة)، أو
   - اربط تخزيناً سحابياً مجانياً للصور لاحقاً.
   - بيانات قاعدة البيانات (الطلبات والتقارير) **محفوظة دائماً** على Aiven ولا تتأثر.

---

## بديل أسهل بخدمة واحدة (اختياري)

**Railway.app** يجمع التطبيق + MySQL في مكان واحد برصيد تجريبي مجاني:
1. سجّل في railway.app بحساب GitHub.
2. **New Project → Deploy from GitHub** (اختر مستودعك).
3. **New → Database → MySQL** داخل المشروع نفسه.
4. في إعدادات خدمة التطبيق، اربط متغيّرات `DB_*` بمتغيّرات قاعدة بيانات Railway، واضبط `AUTO_INIT=true` و `DB_SSL=false` و `DB_CREATE=false`.
5. Railway يعطيك رابطاً عاماً (Generate Domain) — ضعه في `PUBLIC_BASE_URL`.

---

© مشروع خذ بيدي — ثلث المرحوم عبدالله عبداللطيف العثمان.
