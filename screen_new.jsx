/* screen_new.jsx — تقديم طلب جديد (شروط + نموذج متعدّد الخطوات) */
const { useState: useStateN, useRef: useRefN } = React;

const TERMS = [
  'عدم إلحاق أي ضرر بالمرافق أو المعدات داخل القاعة، وفي حال حدوث ذلك يتحمّل العميل المسؤولية الكاملة.',
  'احترام المواعيد المحدّدة للبدء والانتهاء من المحاضرة ومن حجز القاعة.',
  'يمكن تغيير موعد الحجز مرّة واحدة فقط قبل ٧٢ ساعة من موعد المحاضرة، وذلك في حال توفّر القاعة للموعد الجديد.',
  'وضع شعار المشروع على التصميم، مع عمل منشن (إشارة) لحساب المشروع @beyadikw.',
  'تزويد الجهة الراعية بصور عالية الجودة من الفعالية لنشرها في وسائل التواصل الاجتماعي أو استخدامها في تقرير المشروع.',
  'تزويد الجهة الراعية بفيديو قصير (إن وُجد) عالي الجودة من الفعالية لنشره في وسائل التواصل أو استخدامه في تقرير المشروع.',
];

const STEPS = ['الشروط والأحكام', 'بيانات الفعالية', 'القاعة والتواصل', 'مراجعة وإرسال'];

function FileDrop({ label, hint, value, onPick }) {
  const ref = useRefN(null);
  return (
    <div>
      <label className="flbl">{label}<span className="req">*</span></label>
      <input type="file" ref={ref} style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onPick(e.target.files[0]); }} />
      {!value ? (
        <div className="drop" onClick={() => ref.current.click()}>
          <Icon name="doc" tone="gold" />
          <b>اضغط لرفع الملف</b>
          <small>{hint}</small>
        </div>
      ) : (
        <div className="drop filled" onClick={() => ref.current.click()}>
          <Icon name="doc" tone="info" />
          <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{value.name}</b><small className="muted" style={{ display: 'block', fontSize: 11.5 }}>تم الرفع · اضغط للتبديل</small></div>
          <Icon name="tasks" size={20} style={{ '--da-icon-fg-color': 'var(--da-green)', '--da-icon-bg-color': '#fff' }} />
        </div>
      )}
    </div>
  );
}

function NewRequestScreen({ onSubmit, onNav }) {
  const { HALLS, CATS } = window.SEED;
  const [step, setStep] = useStateN(0);
  const [agree, setAgree] = useStateN(false);
  const [done, setDone] = useStateN(null); // ref id on success
  const [err, setErr] = useStateN({});
  const [f, setF] = useStateN({
    event: '', org: '', lecturer: '', goals: '', axes: '', cats: [],
    hall: '', dates: '', phone: '', insta: '', notes: '',
    fileRequest: '', fileCv: '',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const toggleCat = (id) => setF(p => ({ ...p, cats: p.cats.includes(id) ? p.cats.filter(c => c !== id) : [...p.cats, id] }));

  function validate(s) {
    const e = {};
    if (s === 1) {
      if (!f.event.trim()) e.event = 'مطلوب';
      if (!f.org.trim()) e.org = 'مطلوب';
      if (!f.goals.trim()) e.goals = 'مطلوب';
      if (!f.axes.trim()) e.axes = 'مطلوب';
      if (f.cats.length === 0) e.cats = 'اختر فئة واحدة على الأقل';
    }
    if (s === 2) {
      if (!f.hall) e.hall = 'مطلوب';
      if (!f.lecturer.trim()) e.lecturer = 'مطلوب';
      if (!f.dates.trim()) e.dates = 'مطلوب';
      if (!f.phone.trim()) e.phone = 'مطلوب';
      if (!f.insta.trim()) e.insta = 'مطلوب';
      if (!f.fileRequest) e.fileRequest = 'مطلوب';
      if (!f.fileCv) e.fileCv = 'مطلوب';
    }
    setErr(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 0 && !agree) { setErr({ agree: 'يجب الموافقة على الشروط والأحكام للمتابعة' }); return; }
    if (validate(step)) { setStep(s => s + 1); window.scrollTo({ top: 0 }); }
  }
  function back() { setStep(s => Math.max(0, s - 1)); }

  const [submitting, setSubmitting] = useStateN(false);

  async function submit() {
    const ref = 'BK-' + (1043 + Math.floor(Math.random() * 50));
    const payload = {
      id: ref, event: f.event, org: f.org, lecturer: f.lecturer, hall: f.hall,
      status: 'new', cats: f.cats, phone: f.phone, insta: f.insta.startsWith('@') ? f.insta : '@' + f.insta,
      dates: f.dates, submitted: '2026-06-08', goals: f.goals, axes: f.axes, notes: f.notes,
      month: 'يونيو', beneficiaries: 0,
      files: { request: f.fileRequest || null, cv: f.fileCv || null },
    };
    if (window.Store && window.Store.LIVE) {
      setSubmitting(true);
      try {
        const created = await window.Store.createRequest(payload);
        onSubmit(created);
        setDone(created);
        window.scrollTo({ top: 0 });
      } catch (e) {
        setErr({ submit: 'تعذّر إرسال الطلب: ' + e.message });
      } finally { setSubmitting(false); }
      return;
    }
    onSubmit(payload);
    setDone(payload);
    window.scrollTo({ top: 0 });
  }

  if (done) {
    return (
      <div className="screen success-wrap">
        <div className="seal"><Icon name="tasks" size={50} style={{ '--da-icon-fg-color': 'var(--da-green)', '--da-icon-bg-color': 'transparent' }} /></div>
        <h2>تم استلام طلبك بنجاح</h2>
        <p>شكراً لك. سيقوم فريق مشروع «خذ بيدي» بمراجعة طلبك، وسيتم التواصل معك عبر الوسيلة الموضّحة. يمكنك متابعة حالة الطلب باستخدام رقمه أدناه.</p>
        <div className="ref-chip"><Icon name="forms" tone="gold" size={18} />رقم الطلب: {done.id}</div>
        <div className="row-flex" style={{ justifyContent: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => downloadRequestPackage(done)}><Icon name="reports" />تنزيل الطلب مع المرفقات</button>
          <button className="btn btn-ghost" onClick={() => onNav('requests')}>عرض في قائمة الطلبات</button>
          <button className="btn btn-ghost" onClick={() => { setDone(null); setStep(0); setAgree(false); setF({ event: '', org: '', lecturer: '', goals: '', axes: '', cats: [], hall: '', dates: '', phone: '', insta: '', notes: '', fileRequest: '', fileCv: '' }); }}>تقديم طلب آخر</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen formwrap">
      <div className="stepper">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className={`stp ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <span className="dot">{i < step ? '✓' : i + 1}</span>
              <span className="lb">{s}</span>
            </div>
            {i < STEPS.length - 1 && <span className={`ln ${i < step ? 'done' : ''}`}></span>}
          </React.Fragment>
        ))}
      </div>

      <div className="card" style={{ padding: '26px 28px' }}>
        {/* ---------- STEP 0: TERMS ---------- */}
        {step === 0 && (
          <div>
            <div className="card-h" style={{ marginBottom: 8 }}>
              <IconPlate name="lock" tone="gold" size={36} />
              <h3 style={{ fontSize: 17 }}>الشروط والأحكام المطلوب اتّباعها لطلب الرعاية</h3>
            </div>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 0, marginBottom: 8 }}>يُرجى قراءة البنود التالية بعناية. الموافقة عليها شرط أساسي لتقديم الطلب.</p>
            <div>
              {TERMS.map((t, i) => (
                <div className="term" key={i}>
                  <span className="n">{i + 1}</span>
                  <span className="tx">{t}</span>
                </div>
              ))}
            </div>
            <div className="agree-bar">
              <div className={`cbx ${agree ? 'on' : ''}`} onClick={() => { setAgree(a => !a); setErr({}); }}></div>
              <label onClick={() => { setAgree(a => !a); setErr({}); }}>أقرّ بأنني اطّلعت على جميع الشروط والأحكام أعلاه وأوافق على الالتزام بها بالكامل.</label>
            </div>
            {err.agree && <div className="errmsg" style={{ marginTop: 8 }}>{err.agree}</div>}
          </div>
        )}

        {/* ---------- STEP 1: EVENT DATA ---------- */}
        {step === 1 && (
          <div>
            <div className="card-h" style={{ marginBottom: 18 }}>
              <IconPlate name="spark" tone="gold" size={36} />
              <h3 style={{ fontSize: 17 }}>بيانات الفعالية</h3>
            </div>
            <div className="fgrp two">
              <div className="fgrp">
                <label className="flbl">اسم الفعالية<span className="req">*</span></label>
                <input className={`inp ${err.event ? 'err' : ''}`} value={f.event} onChange={e => set('event', e.target.value)} placeholder="مثال: ملتقى مهارات القراءة للأطفال" />
                {err.event && <div className="errmsg">{err.event}</div>}
              </div>
              <div className="fgrp">
                <label className="flbl">الجهة الطالبة<span className="req">*</span></label>
                <input className={`inp ${err.org ? 'err' : ''}`} value={f.org} onChange={e => set('org', e.target.value)} placeholder="اسم الفريق أو الجهة المنظِّمة" />
                {err.org && <div className="errmsg">{err.org}</div>}
              </div>
            </div>
            <div className="fgrp">
              <label className="flbl">أهداف الفعالية<span className="req">*</span></label>
              <textarea className={`ta ${err.goals ? 'err' : ''}`} value={f.goals} onChange={e => set('goals', e.target.value)} placeholder="ما الذي تسعى الفعالية لتحقيقه؟" />
              {err.goals && <div className="errmsg">{err.goals}</div>}
            </div>
            <div className="fgrp">
              <label className="flbl">محاور الفعالية<span className="req">*</span></label>
              <textarea className={`ta ${err.axes ? 'err' : ''}`} value={f.axes} onChange={e => set('axes', e.target.value)} placeholder="المواضيع الرئيسية التي ستُغطّى — افصل بينها بفاصلة" />
              {err.axes && <div className="errmsg">{err.axes}</div>}
            </div>
            <div className="fgrp">
              <label className="flbl">الفئة المستهدفة<span className="req">*</span><small>يمكن اختيار أكثر من فئة</small></label>
              <div className="opt-grid cols2">
                {CATS.map(c => (
                  <div key={c.id} className={`opt check ${f.cats.includes(c.id) ? 'sel' : ''}`} onClick={() => toggleCat(c.id)}>
                    <span className="mk"></span>
                    <div className="ot"><b>{c.name}</b></div>
                  </div>
                ))}
              </div>
              {err.cats && <div className="errmsg">{err.cats}</div>}
            </div>
          </div>
        )}

        {/* ---------- STEP 2: HALL & CONTACT ---------- */}
        {step === 2 && (
          <div>
            <div className="card-h" style={{ marginBottom: 18 }}>
              <IconPlate name="apps" tone="gold" size={36} />
              <h3 style={{ fontSize: 17 }}>القاعة والموعد ووسائل التواصل</h3>
            </div>
            <div className="fgrp">
              <label className="flbl">القاعة المطلوبة<span className="req">*</span></label>
              <div className="opt-grid cols2">
                {HALLS.map(h => (
                  <div key={h.id} className={`opt ${f.hall === h.id ? 'sel' : ''}`} onClick={() => set('hall', h.id)}>
                    <span className="mk"></span>
                    <div className="ot"><b>{h.name}</b><small>{h.en}</small></div>
                  </div>
                ))}
              </div>
              {err.hall && <div className="errmsg">{err.hall}</div>}
            </div>
            <div className="fgrp two">
              <div className="fgrp">
                <label className="flbl">اسم المحاضر<span className="req">*</span></label>
                <input className={`inp ${err.lecturer ? 'err' : ''}`} value={f.lecturer} onChange={e => set('lecturer', e.target.value)} placeholder="الاسم الكامل للمحاضر" />
                {err.lecturer && <div className="errmsg">{err.lecturer}</div>}
              </div>
              <div className="fgrp">
                <label className="flbl">التواريخ المقترحة<span className="req">*</span></label>
                <input className={`inp ${err.dates ? 'err' : ''}`} value={f.dates} onChange={e => set('dates', e.target.value)} placeholder="مثال: ٢١ يونيو ٢٠٢٦" />
                {err.dates && <div className="errmsg">{err.dates}</div>}
              </div>
            </div>
            <div className="fgrp two">
              <div className="fgrp">
                <label className="flbl">رقم الهاتف<span className="req">*</span></label>
                <input className={`inp ${err.phone ? 'err' : ''}`} value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+965 ____ ____" style={{ direction: 'ltr', textAlign: 'right' }} />
                {err.phone && <div className="errmsg">{err.phone}</div>}
              </div>
              <div className="fgrp">
                <label className="flbl">حساب الإنستقرام<span className="req">*</span></label>
                <input className={`inp ${err.insta ? 'err' : ''}`} value={f.insta} onChange={e => set('insta', e.target.value)} placeholder="@username" style={{ direction: 'ltr', textAlign: 'right' }} />
                {err.insta && <div className="errmsg">{err.insta}</div>}
              </div>
            </div>
            <div className="fgrp two">
              <FileDrop label="طلب رعاية فعالية (موقّع)" hint="يجب أن يكون موقّعاً من الجهة الطالبة · PDF" value={f.fileRequest} onPick={n => set('fileRequest', n)} />
              <FileDrop label="السيرة الذاتية للمحاضر" hint="PDF أو صورة" value={f.fileCv} onPick={n => set('fileCv', n)} />
            </div>
            {(err.fileRequest || err.fileCv) && <div className="errmsg" style={{ marginTop: -10, marginBottom: 14 }}>يلزم إرفاق الطلب الموقّع والسيرة الذاتية.</div>}
            <div className="fgrp">
              <label className="flbl">ملاحظات <small>اختياري</small></label>
              <textarea className="ta" value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="أي معلومات إضافية ترغب بإضافتها" />
            </div>
          </div>
        )}

        {/* ---------- STEP 3: REVIEW ---------- */}
        {step === 3 && (
          <div>
            <div className="card-h" style={{ marginBottom: 18 }}>
              <IconPlate name="tasks" tone="gold" size={36} />
              <h3 style={{ fontSize: 17 }}>مراجعة الطلب قبل الإرسال</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 26px' }}>
              <div className="field-row"><div className="k">اسم الفعالية</div><div className="v">{f.event || '—'}</div></div>
              <div className="field-row"><div className="k">الجهة الطالبة</div><div className="v">{f.org || '—'}</div></div>
              <div className="field-row"><div className="k">القاعة المطلوبة</div><div className="v">{f.hall ? hallName(f.hall) : '—'}</div></div>
              <div className="field-row"><div className="k">المحاضر</div><div className="v">{f.lecturer || '—'}</div></div>
              <div className="field-row"><div className="k">التواريخ المقترحة</div><div className="v">{f.dates || '—'}</div></div>
              <div className="field-row"><div className="k">الفئة المستهدفة</div><div className="v">{f.cats.map(catName).join('، ') || '—'}</div></div>
              <div className="field-row"><div className="k">رقم الهاتف</div><div className="v" style={{ direction: 'ltr', textAlign: 'right' }}>{f.phone || '—'}</div></div>
              <div className="field-row"><div className="k">الإنستقرام</div><div className="v" style={{ direction: 'ltr', textAlign: 'right' }}>{f.insta || '—'}</div></div>
            </div>
            <div className="field-row"><div className="k">أهداف الفعالية</div><div className="v">{f.goals || '—'}</div></div>
            <div className="field-row"><div className="k">محاور الفعالية</div><div className="v">{f.axes || '—'}</div></div>
            <div className="row-flex" style={{ gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <span className="chip gold"><Icon name="doc" tone="gold" size={15} />{f.fileRequest ? f.fileRequest.name : 'الطلب الموقّع'}</span>
              <span className="chip gold"><Icon name="doc" tone="gold" size={15} />{f.fileCv ? f.fileCv.name : 'السيرة الذاتية'}</span>
            </div>
            <div style={{ marginTop: 18, padding: '12px 16px', background: 'var(--st-approved-bg)', borderRadius: 12, fontSize: 12.5, color: 'var(--da-green-deep)', display: 'flex', gap: 9 }}>
              <Icon name="tasks" size={18} style={{ '--da-icon-fg-color': 'var(--da-green)', '--da-icon-bg-color': 'transparent' }} />
              تمّت الموافقة على الشروط والأحكام في الخطوة الأولى.
            </div>
          </div>
        )}

        {/* ---------- NAV ---------- */}
        <div className="spread" style={{ marginTop: 26, borderTop: '1px solid var(--da-line)', paddingTop: 20 }}>
          <button className="btn btn-ghost" onClick={step === 0 ? () => onNav('dashboard') : back}>
            {step === 0 ? 'إلغاء' : 'السابق'}
          </button>
          <div className="muted" style={{ fontSize: 12.5 }}>الخطوة {step + 1} من {STEPS.length}</div>
          {step < STEPS.length - 1
            ? <button className="btn btn-primary" onClick={next}>التالي<Icon name="arrow-left" /></button>
            : <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting}><Icon name="tasks" />{submitting ? 'جارٍ الإرسال…' : 'إرسال الطلب'}</button>}
        </div>
        {err.submit && <div className="errmsg" style={{ textAlign: 'center', marginTop: 10 }}>{err.submit}</div>}
      </div>
    </div>
  );
}
window.NewRequestScreen = NewRequestScreen;
