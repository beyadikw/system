/* بيانات تجريبية لبوابة طلبات رعاية الفعاليات — خذ بيدي
   التاريخ المرجعي: 8 يونيو 2026 */
(function () {
  const HALLS = [
    { id: 'main', name: 'القاعة الرئيسية', en: 'القاعة الكبيرة', cap: 80 },
    { id: 's1', name: 'القاعة الصغيرة رقم ١', en: 'تتسع لـ 10 أشخاص', cap: 10 },
    { id: 's2', name: 'القاعة الصغيرة رقم ٢', en: 'تتسع لـ 10 أشخاص', cap: 10 },
    { id: 's3', name: 'القاعة الصغيرة رقم ٣', en: 'تتسع لـ 15 شخص', cap: 15 },
  ];

  const CATS = [
    { id: 'children', name: 'الأطفال' },
    { id: 'students', name: 'الطلبة' },
    { id: 'parents', name: 'أولياء الأمور' },
    { id: 'others', name: 'فئات أخرى' },
  ];

  // status: new | review | approved | rejected | done
  const REQ = [
    { id: 'BK-1042', event: 'ملتقى مهارات القراءة للأطفال', org: 'فريق اقرأ التطوعي', lecturer: 'أ. منيرة العنزي',
      hall: 'main', status: 'review', cats: ['children','parents'], phone: '+965 9001 2233', insta: '@iqra_kw',
      dates: '٢١ يونيو ٢٠٢٦', submitted: '2026-06-07', goals: 'تنمية حب القراءة لدى الأطفال عبر أنشطة تفاعلية وقصص مصوّرة.',
      axes: 'القراءة الجهرية · ركن القصة · مسابقة المكتبة الصغيرة', month: 'يونيو', beneficiaries: 0 },

    { id: 'BK-1041', event: 'دورة الإسعافات الأولية المنزلية', org: 'جمعية الهلال الأحمر — فرع حولي', lecturer: 'د. خالد المطيري',
      hall: 's3', status: 'review', cats: ['parents','others'], phone: '+965 5567 8890', insta: '@redcrescent_hawally',
      dates: '١٨ يونيو ٢٠٢٦', submitted: '2026-06-05', goals: 'تأهيل الأمهات والمربيات على التعامل مع الطوارئ المنزلية الشائعة.',
      axes: 'الإنعاش القلبي الرئوي · الحروق · الاختناق · النزيف', month: 'يونيو', beneficiaries: 0 },

    { id: 'BK-1040', event: 'أمسية الخط العربي', org: 'نادي الفنون الجميلة', lecturer: 'أ. عبدالله الخطّاط',
      hall: 's1', status: 'review', cats: ['students'], phone: '+965 6612 4500', insta: '@finearts_club',
      dates: '٢٥ يونيو ٢٠٢٦', submitted: '2026-06-04', goals: 'التعريف بجماليات الخط العربي وتدريب المشاركين على خط الرقعة.',
      axes: 'تاريخ الخط · أدوات الخطاط · تطبيق عملي', month: 'يونيو', beneficiaries: 0 },

    { id: 'BK-1039', event: 'ورشة ريادة الأعمال للشباب', org: 'مبادرة رواد الكويت', lecturer: 'أ. فهد الرشيدي',
      hall: 'main', status: 'approved', cats: ['students','others'], phone: '+965 9988 7766', insta: '@ruwad_kw',
      dates: '١٢ يونيو ٢٠٢٦', submitted: '2026-05-28', goals: 'تمكين الشباب من تحويل أفكارهم إلى مشاريع ناشئة قابلة للتنفيذ.',
      axes: 'نموذج العمل · دراسة السوق · العرض الاستثماري', month: 'يونيو', beneficiaries: 0 },

    { id: 'BK-1038', event: 'لقاء التوعية بالأمن الرقمي للأسرة', org: 'مركز الكويت للأمن السيبراني', lecturer: 'م. سارة الدوسري',
      hall: 's3', status: 'approved', cats: ['parents'], phone: '+965 5544 3322', insta: '@cyber_kw',
      dates: '١٠ يونيو ٢٠٢٦', submitted: '2026-05-25', goals: 'رفع وعي أولياء الأمور بمخاطر الإنترنت وحماية الأبناء.',
      axes: 'الرقابة الأبوية · التنمر الإلكتروني · الخصوصية', month: 'يونيو', beneficiaries: 0 },

    { id: 'BK-1037', event: 'مخيّم العلوم الصغير', org: 'دار العلوم التعليمية', lecturer: 'أ. نورة الصباح',
      hall: 'main', status: 'rejected', cats: ['children'], phone: '+965 9123 4567', insta: '@science_kids',
      dates: '٨ يونيو ٢٠٢٦', submitted: '2026-05-20', goals: 'تبسيط المفاهيم العلمية للأطفال عبر تجارب عملية آمنة.',
      axes: 'تجارب فيزيائية · ركن الفلك · صناعة البراكين', month: 'يونيو', beneficiaries: 0,
      rejectReason: 'تعارض الموعد المقترح مع حجز قائم للقاعة الرئيسية، ولم يتوفّر بديل مناسب.' },

    { id: 'BK-1031', event: 'ندوة الصحة النفسية للمراهقين', org: 'الجمعية الكويتية للإرشاد النفسي', lecturer: 'د. هند العجمي',
      hall: 's3', status: 'approved', cats: ['students','parents'], phone: '+965 6677 8899', insta: '@psych_kw',
      dates: '٢٢ مايو ٢٠٢٦', submitted: '2026-05-02', goals: 'فتح حوار آمن حول الصحة النفسية للمراهقين وأسرهم.',
      axes: 'القلق الدراسي · التواصل الأسري · طلب المساعدة', month: 'مايو', beneficiaries: 14,
      report: { attendees: 14, capacity: 15, spent: 320, photos: 6, video: true,
        summary: 'أُقيمت الندوة في القاعة الصغيرة رقم ٣ بحضور ١٤ مشاركاً من المراهقين وأولياء أمورهم. تميّزت الجلسة بتفاعل عالٍ خلال الحوار المفتوح، وقدّمت د. هند العجمي أدوات عملية للتعامل مع القلق الدراسي.',
        outcomes: 'سجّل ٩ مشاركين رغبتهم في جلسات متابعة فردية. وزّع دليل إرشادي مطبوع على جميع الحضور.',
        notes: 'يُنصح بتكرار الندوة في قاعة أكبر نظراً للإقبال الذي فاق سعة القاعة المحجوزة.' } },

    { id: 'BK-1029', event: 'ورشة الطبخ الصحي للأمهات', org: 'فريق غذاء وصحة', lecturer: 'أ. أمل الفضلي',
      hall: 's1', status: 'approved', cats: ['parents'], phone: '+965 9876 5432', insta: '@food_health_kw',
      dates: '١٥ مايو ٢٠٢٦', submitted: '2026-04-26', goals: 'تعريف الأمهات بأساسيات التغذية المتوازنة لأطفالهن.',
      axes: 'الهرم الغذائي · وجبات المدرسة · بدائل السكر', month: 'مايو', beneficiaries: 10,
      report: { attendees: 10, capacity: 10, spent: 410, photos: 8, video: true,
        summary: 'ورشة عملية اكتملت فيها السعة بالكامل (١٠ مشاركات). تضمّنت تحضيراً حياً لوجبتين صحيتين.',
        outcomes: 'حصلت كل مشاركة على كتيّب وصفات. تقييم الرضا بلغ ٩٦٪.',
        notes: 'الإقبال يفوق سعة القاعة الصغيرة؛ يُقترح نقلها للقاعة الرئيسية مستقبلاً.' } },

    { id: 'BK-1024', event: 'دورة مهارات الإلقاء والتقديم', org: 'منصة منبر', lecturer: 'أ. يوسف الكندري',
      hall: 's2', status: 'approved', cats: ['students'], phone: '+965 5512 0099', insta: '@minbar_kw',
      dates: '٢٨ أبريل ٢٠٢٦', submitted: '2026-04-08', goals: 'تطوير مهارات الطلبة في الإلقاء والتحدث أمام الجمهور.',
      axes: 'لغة الجسد · بناء العرض · إدارة التوتر', month: 'أبريل', beneficiaries: 9,
      report: { attendees: 9, capacity: 10, spent: 280, photos: 5, video: false,
        summary: 'دورة تطبيقية قدّم خلالها كل مشارك عرضاً قصيراً تلقّى عليه تغذية راجعة فورية.',
        outcomes: 'تحسّن ملحوظ في ثقة المشاركين، ورُشّح ٣ منهم للمشاركة في مسابقة الإلقاء.',
        notes: 'مدة الدورة كانت قصيرة نسبياً؛ يُقترح تمديدها إلى يومين.' } },

    { id: 'BK-1019', event: 'ملتقى أولياء الأمور التربوي', org: 'مدرسة الأجيال الأهلية', lecturer: 'د. عبدالعزيز الهاجري',
      hall: 'main', status: 'approved', cats: ['parents'], phone: '+965 6600 1122', insta: '@ajyal_school',
      dates: '٢٠ أبريل ٢٠٢٦', submitted: '2026-03-30', goals: 'تعزيز الشراكة التربوية بين الأسرة والمدرسة.',
      axes: 'التربية الإيجابية · الحوار مع المراهق · المتابعة الدراسية', month: 'أبريل', beneficiaries: 62,
      report: { attendees: 62, capacity: 80, spent: 560, photos: 10, video: true,
        summary: 'ملتقى واسع الحضور في القاعة الرئيسية شارك فيه ٦٢ من أولياء الأمور.',
        outcomes: 'تأسست مجموعة تواصل دائمة بين الأسر والمدرسة، وجرى توزيع دليل التربية الإيجابية.',
        notes: 'تنظيم ممتاز؛ يُوصى بجعله فعالية سنوية ثابتة.' } },

    { id: 'BK-1012', event: 'ورشة البرمجة للأطفال (سكراتش)', org: 'أكاديمية المبرمج الصغير', lecturer: 'م. دلال العتيبي',
      hall: 's3', status: 'approved', cats: ['children'], phone: '+965 9234 5611', insta: '@kidscode_kw',
      dates: '٣٠ مارس ٢٠٢٦', submitted: '2026-03-10', goals: 'تعليم الأطفال أساسيات التفكير البرمجي بأسلوب لعبي.',
      axes: 'البرمجة المرئية · بناء لعبة · التفكير المنطقي', month: 'مارس', beneficiaries: 15,
      report: { attendees: 15, capacity: 15, spent: 390, photos: 7, video: true,
        summary: 'اكتملت سعة القاعة بالكامل. أنجز كل طفل لعبة بسيطة بنفسه بنهاية الورشة.',
        outcomes: 'حماس عالٍ من الأطفال وطلب من الأهالي بسلسلة مستمرة.',
        notes: 'نجاح كبير؛ التوصية بإطلاق مسار تدريبي متكامل للأطفال.' } },

    { id: 'BK-1007', event: 'لقاء التوعية المالية للشباب', org: 'مبادرة وعي مالي', lecturer: 'أ. بدر الشمري',
      hall: 's2', status: 'approved', cats: ['students','others'], phone: '+965 5500 4411', insta: '@maliwaai_kw',
      dates: '١٨ مارس ٢٠٢٦', submitted: '2026-02-26', goals: 'بناء وعي مالي مبكّر لدى الشباب حول الادخار والإنفاق.',
      axes: 'الميزانية الشخصية · الادخار · تجنّب الديون', month: 'مارس', beneficiaries: 10,
      report: { attendees: 10, capacity: 10, spent: 250, photos: 4, video: false,
        summary: 'جلسة تفاعلية امتلأت بالكامل، تخلّلتها محاكاة عملية لإعداد ميزانية شهرية.',
        outcomes: 'التزم ٧ مشاركين بخطة ادخار شهرية. تقييم المحتوى ٩٢٪.',
        notes: 'محتوى قيّم؛ يُقترح إضافة محور عن الاستثمار المبسّط.' } },

    { id: 'BK-0998', event: 'مهرجان القراءة العائلي', org: 'مكتبة الكويت الوطنية', lecturer: 'أ. ريم الخالدي',
      hall: 'main', status: 'approved', cats: ['children','parents'], phone: '+965 6678 1200', insta: '@knl_kw',
      dates: '٢٨ فبراير ٢٠٢٦', submitted: '2026-02-05', goals: 'ترسيخ عادة القراءة كنشاط عائلي مشترك.',
      axes: 'ركن القصة · تبادل الكتب · ورشة الرسم', month: 'فبراير', beneficiaries: 71,
      report: { attendees: 71, capacity: 80, spent: 640, photos: 12, video: true,
        summary: 'مهرجان حافل بحضور ٧١ فرداً من العائلات. تنوّعت الأركان بين القصة والرسم وتبادل الكتب.',
        outcomes: 'تبرّع الحضور بأكثر من ٢٠٠ كتاب لمكتبة المشروع. حضور إعلامي جيد.',
        notes: 'من أنجح فعاليات الموسم؛ توصية بتكراره فصلياً.' } },

    { id: 'BK-0987', event: 'دورة التصوير بالهاتف', org: 'نادي عدسة', lecturer: 'أ. طلال الرومي',
      hall: 's1', status: 'approved', cats: ['students','others'], phone: '+965 9011 2255', insta: '@adasa_kw',
      dates: '١٥ فبراير ٢٠٢٦', submitted: '2026-01-24', goals: 'تطوير مهارات التصوير الفوتوغرافي باستخدام الهاتف.',
      axes: 'قواعد التكوين · الإضاءة · التحرير السريع', month: 'فبراير', beneficiaries: 10,
      report: { attendees: 10, capacity: 10, spent: 230, photos: 9, video: false,
        summary: 'دورة عملية ممتلئة، خرج فيها المشاركون لجلسة تصوير ميدانية قصيرة.',
        outcomes: 'معرض مصغّر لأعمال المشاركين عُرض على حساب المشروع.',
        notes: 'تفاعل ممتاز؛ يُقترح دورة متقدمة لاحقاً.' } },

    { id: 'BK-0975', event: 'ورشة المهارات الحياتية للطلبة', org: 'فريق نماء', lecturer: 'أ. شيخة المنصور',
      hall: 's3', status: 'approved', cats: ['students'], phone: '+965 5523 7788', insta: '@namaa_kw',
      dates: '٢٢ يناير ٢٠٢٦', submitted: '2026-01-02', goals: 'إكساب الطلبة مهارات إدارة الوقت وتنظيم الدراسة.',
      axes: 'إدارة الوقت · تنظيم المذاكرة · تحديد الأهداف', month: 'يناير', beneficiaries: 13,
      report: { attendees: 13, capacity: 15, spent: 300, photos: 6, video: true,
        summary: 'ورشة تطبيقية ساعدت الطلبة على بناء جدول دراسي واقعي.',
        outcomes: 'التزم معظم المشاركين بخطة أسبوعية، مع متابعة عبر مجموعة المشروع.',
        notes: 'محتوى مناسب لموسم الاختبارات؛ توصية بربطه بفترات الامتحانات.' } },
  ];

  // monthly time series (موسم 2025/2026)
  const TIMESERIES = [
    { m: 'أكتوبر', y: '٢٠٢٥', count: 6 },
    { m: 'نوفمبر', y: '٢٠٢٥', count: 8 },
    { m: 'ديسمبر', y: '٢٠٢٥', count: 7 },
    { m: 'يناير', y: '٢٠٢٦', count: 9 },
    { m: 'فبراير', y: '٢٠٢٦', count: 11 },
    { m: 'مارس', y: '٢٠٢٦', count: 12 },
    { m: 'أبريل', y: '٢٠٢٦', count: 10 },
    { m: 'مايو', y: '٢٠٢٦', count: 13 },
    { m: 'يونيو', y: '٢٠٢٦', count: 6 },
  ];

  const STATUS_META = {
    new:      { label: 'جديد', color: 'var(--st-new)', bg: 'var(--st-new-bg)' },
    review:   { label: 'قيد المراجعة', color: 'var(--st-review)', bg: 'var(--st-review-bg)' },
    approved: { label: 'مقبول', color: 'var(--st-approved)', bg: 'var(--st-approved-bg)' },
    rejected: { label: 'مرفوض', color: 'var(--st-rejected)', bg: 'var(--st-rejected-bg)' },
    done:     { label: 'مكتملة', color: 'var(--st-done)', bg: 'var(--st-done-bg)' },
  };

  window.SEED = { HALLS, CATS, REQ, TIMESERIES, STATUS_META };
})();
