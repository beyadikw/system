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
  // ملاحظة: الطلبات الفعلية حتى الآن هي BK-1042 و BK-1001 فقط — كما رُفعت من الجهات الطالبة
  const REQ = [
    { id: 'BK-1042', event: 'ملتقى مهارات القراءة للأطفال', org: 'فريق اقرأ التطوعي', lecturer: 'أ. منيرة العنزي',
      hall: 'main', status: 'review', cats: ['children','parents'], phone: '+965 9001 2233', insta: '@iqra_kw',
      dates: '٢١ يونيو ٢٠٢٦', submitted: '2026-06-07', goals: 'تنمية حب القراءة لدى الأطفال عبر أنشطة تفاعلية وقصص مصوّرة.',
      axes: 'القراءة الجهرية · ركن القصة · مسابقة المكتبة الصغيرة', month: 'يونيو', beneficiaries: 0 },

    { id: 'BK-1001', event: '—', org: '—', lecturer: '—',
      hall: 'main', status: 'review', cats: [], phone: '—', insta: '—',
      dates: '—', submitted: '', goals: '', axes: '', month: '', beneficiaries: 0 },
  ];

  // monthly time series (موسم 2025/2026)
  const TIMESERIES = [
    { m: 'أكتوبر', y: '٢٠٢٥', count: 0 },
    { m: 'نوفمبر', y: '٢٠٢٥', count: 0 },
    { m: 'ديسمبر', y: '٢٠٢٥', count: 0 },
    { m: 'يناير', y: '٢٠٢٦', count: 0 },
    { m: 'فبراير', y: '٢٠٢٦', count: 0 },
    { m: 'مارس', y: '٢٠٢٦', count: 0 },
    { m: 'أبريل', y: '٢٠٢٦', count: 0 },
    { m: 'مايو', y: '٢٠٢٦', count: 0 },
    { m: 'يونيو', y: '٢٠٢٦', count: 2 },
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
