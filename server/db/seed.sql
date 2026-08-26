-- ============================================================
--  بيانات أولية — مشروع خذ بيدي
--  كلمة مرور المنسّق الافتراضية: Beyadik@2026  (تُغيّر بعد أول دخول)
--  الهاش أدناه bcrypt لـ Beyadik@2026
-- ============================================================
USE khudh_biyadi;

INSERT INTO users (name, email, password_hash, role) VALUES
  ('ماجد الشمري', 'coordinator@beyadik.kw', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDqQ8q1pWf6n8Qe7Yk5mQ2k3xY1Hq', 'coordinator')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO halls (id, name, note, capacity, sort) VALUES
  ('main', 'القاعة الرئيسية', 'القاعة الكبيرة', 80, 1),
  ('s1',   'القاعة الصغيرة رقم ١', 'تتسع لـ 10 أشخاص', 10, 2),
  ('s2',   'القاعة الصغيرة رقم ٢', 'تتسع لـ 10 أشخاص', 10, 3),
  ('s3',   'القاعة الصغيرة رقم ٣', 'تتسع لـ 15 شخص', 15, 4)
ON DUPLICATE KEY UPDATE name = VALUES(name), note = VALUES(note), capacity = VALUES(capacity);

INSERT INTO categories (id, name, sort) VALUES
  ('children', 'الأطفال', 1),
  ('students', 'الطلبة', 2),
  ('parents',  'أولياء الأمور', 3),
  ('others',   'فئات أخرى', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ملاحظة: أُزيلت الطلبات والتقارير النموذجية عمداً — هذا الملف يُهيّئ فقط بيانات
-- الإعداد الأساسية (المستخدم المنسّق، القاعات، الفئات) ولا يُدخل أي طلبات تجريبية
-- إلى القاعدة الحيّة، حفاظاً على الطلبات الفعلية (BK-1042، BK-1001) وما يُرفع من تقارير.
