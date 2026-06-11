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

-- ---------- طلبات نموذجية ----------
INSERT INTO requests
  (id, event_name, organization, lecturer, hall_id, status, phone, instagram, proposed_dates, goals, axes, agreed_terms, submitted_at)
VALUES
  ('BK-1041','دورة الإسعافات الأولية المنزلية','جمعية الهلال الأحمر — فرع حولي','د. خالد المطيري','s3','review','+965 5567 8890','@redcrescent_hawally','١٨ يونيو ٢٠٢٦','تأهيل الأمهات والمربيات على التعامل مع الطوارئ المنزلية الشائعة.','الإنعاش القلبي الرئوي · الحروق · الاختناق · النزيف',1,'2026-06-05'),
  ('BK-1040','أمسية الخط العربي','نادي الفنون الجميلة','أ. عبدالله الخطّاط','s1','review','+965 6612 4500','@finearts_club','٢٥ يونيو ٢٠٢٦','التعريف بجماليات الخط العربي وتدريب المشاركين على خط الرقعة.','تاريخ الخط · أدوات الخطاط · تطبيق عملي',1,'2026-06-04'),
  ('BK-1039','ورشة ريادة الأعمال للشباب','مبادرة رواد الكويت','أ. فهد الرشيدي','main','approved','+965 9988 7766','@ruwad_kw','١٢ يونيو ٢٠٢٦','تمكين الشباب من تحويل أفكارهم إلى مشاريع ناشئة قابلة للتنفيذ.','نموذج العمل · دراسة السوق · العرض الاستثماري',1,'2026-05-28'),
  ('BK-1037','مخيّم العلوم الصغير','دار العلوم التعليمية','أ. نورة الصباح','main','rejected','+965 9123 4567','@science_kids','٨ يونيو ٢٠٢٦','تبسيط المفاهيم العلمية للأطفال عبر تجارب عملية آمنة.','تجارب فيزيائية · ركن الفلك · صناعة البراكين',1,'2026-05-20'),
  ('BK-1031','ندوة الصحة النفسية للمراهقين','الجمعية الكويتية للإرشاد النفسي','د. هند العجمي','s3','approved','+965 6677 8899','@psych_kw','٢٢ مايو ٢٠٢٦','فتح حوار آمن حول الصحة النفسية للمراهقين وأسرهم.','القلق الدراسي · التواصل الأسري · طلب المساعدة',1,'2026-05-02')
ON DUPLICATE KEY UPDATE event_name = VALUES(event_name);

UPDATE requests SET reject_reason = 'تعارض الموعد المقترح مع حجز قائم للقاعة الرئيسية، ولم يتوفّر بديل مناسب.' WHERE id = 'BK-1037';

INSERT INTO request_categories (request_id, category_id) VALUES
  ('BK-1041','parents'), ('BK-1041','others'),
  ('BK-1040','students'),
  ('BK-1039','students'), ('BK-1039','others'),
  ('BK-1037','children'),
  ('BK-1031','students'), ('BK-1031','parents')
ON DUPLICATE KEY UPDATE category_id = VALUES(category_id);

-- ---------- تقرير ختامي نموذجي ----------
INSERT INTO reports (request_id, attendees, capacity, has_video, summary, outcomes, notes, source)
VALUES
  ('BK-1031', 14, 15, 1,
   'أُقيمت الندوة في القاعة الصغيرة رقم ٣ بحضور ١٤ مشاركاً من المراهقين وأولياء أمورهم، وتميّزت الجلسة بتفاعل عالٍ خلال الحوار المفتوح.',
   'سجّل ٩ مشاركين رغبتهم في جلسات متابعة فردية، ووُزّع دليل إرشادي مطبوع على جميع الحضور.',
   'يُنصح بتكرار الندوة في قاعة أكبر نظراً للإقبال الذي فاق سعة القاعة المحجوزة.',
   'internal')
ON DUPLICATE KEY UPDATE attendees = VALUES(attendees);
