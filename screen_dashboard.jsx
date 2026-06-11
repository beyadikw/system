/* screen_dashboard.jsx — لوحة المتابعة */
function DashboardScreen({ onNav, requests }) {
  const { HALLS, CATS, TIMESERIES, STATUS_META } = window.SEED;
  const REQ = requests || window.SEED.REQ;

  // ---- aggregates ----
  const byStatus = {};
  REQ.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
  const total = REQ.length;
  const completed = REQ.filter(r => r.status === 'approved' && r.report);
  const beneficiaries = completed.reduce((s, r) => s + (r.beneficiaries || 0), 0);

  const statusData = ['review', 'approved', 'rejected']
    .map(k => ({ label: STATUS_META[k].label, value: byStatus[k] || 0, color: STATUS_META[k].color }))
    .filter(d => d.value > 0);

  const hallColors = ['var(--bk-gold)', 'var(--da-teal)', 'var(--da-green)', 'var(--st-review)'];
  const hallData = HALLS.map((h, i) => ({
    name: h.name, sub: h.en,
    value: REQ.filter(r => r.hall === h.id).length,
    color: hallColors[i],
  }));

  const catColors = ['var(--bk-gold)', 'var(--da-green)', 'var(--da-teal)', 'var(--st-done)'];
  const catData = CATS.map((c, i) => ({
    name: c.name,
    value: REQ.filter(r => r.cats.includes(c.id)).length,
    color: catColors[i],
  }));

  // hall utilization (done events): avg attendees / capacity
  const util = (() => {
    const items = completed.map(r => {
      const cap = (HALLS.find(h => h.id === r.hall) || {}).cap || 1;
      return r.report.attendees / cap;
    });
    return Math.round((items.reduce((a, b) => a + b, 0) / (items.length || 1)) * 100);
  })();

  // latest / upcoming
  const latest = [...REQ].sort((a, b) => b.submitted.localeCompare(a.submitted)).slice(0, 5);
  const upcoming = REQ.filter(r => r.status === 'approved' && !r.report);

  return (
    <div className="screen">
      <div className="kpi-row" style={{ marginBottom: 18 }}>
        <Kpi icon="forms" label="إجمالي الطلبات هذا الموسم" value={total} delta="١٨٪" deltaDir="up" foot="عن الموسم السابق" />
        <Kpi icon="tasks" tone="warm" label="بانتظار المراجعة" value={byStatus.review || 0} foot="تحتاج إلى قرار" />
        <Kpi icon="beneficiaries" tone="info" label="مستفيدون من الفعاليات المنفّذة" value={beneficiaries.toLocaleString('en')} delta="١٢٪" deltaDir="up" foot={`عبر ${completed.length} فعالية`} />
        <Kpi icon="monitoring" tone="gold" label="متوسط إشغال القاعات" value={util} unit="٪" foot="للفعاليات المنفّذة" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.5fr', marginBottom: 18 }}>
        <div className="card">
          <div className="card-h">
            <IconPlate name="reports" tone="gold" size={34} />
            <h3>الطلبات حسب الحالة <small>توزيع المسار</small></h3>
          </div>
          <DonutWithLegend data={statusData} centerValue={total} centerLabel="إجمالي" />
        </div>

        <div className="card">
          <div className="card-h">
            <IconPlate name="monitoring" tone="gold" size={34} />
            <h3>الطلبات عبر الزمن <small>موسم ٢٠٢٥–٢٠٢٦</small></h3>
            <span className="more" onClick={() => onNav('requests')}>عرض الكل ←</span>
          </div>
          <AreaLine data={TIMESERIES} />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 18 }}>
        <div className="card">
          <div className="card-h">
            <IconPlate name="apps" tone="gold" size={34} />
            <h3>الطلبات حسب القاعة <small>الإقبال على المرافق</small></h3>
          </div>
          <Bars data={hallData} />
        </div>
        <div className="card">
          <div className="card-h">
            <IconPlate name="beneficiaries" tone="gold" size={34} />
            <h3>الفئة المستهدفة <small>قد تتداخل الفئات</small></h3>
          </div>
          <Bars data={catData} />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <div className="card-h">
            <IconPlate name="forms" tone="gold" size={34} />
            <h3>أحدث الطلبات <small>آخر ما ورد</small></h3>
            <span className="more" onClick={() => onNav('requests')}>إدارة الطلبات ←</span>
          </div>
          <div>
            {latest.map(r => (
              <div key={r.id} className="spread" style={{ padding: '11px 0', borderBottom: '1px dashed var(--da-line)', cursor: 'pointer' }} onClick={() => onNav('requests', r.id)}>
                <div className="row-flex">
                  <span className="mono" style={{ color: 'var(--da-faint)', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{r.id}</span>
                  <div>
                    <b style={{ fontSize: 13.5 }}>{r.event}</b>
                    <div className="muted" style={{ fontSize: 11.5 }}>{r.org} · {hallName(r.hall)}</div>
                  </div>
                </div>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card cream">
          <div className="card-h">
            <IconPlate name="calendar" tone="gold" size={34} />
            <h3>فعاليات قادمة <small>معتمدة</small></h3>
          </div>
          {upcoming.length === 0 && <div className="muted" style={{ fontSize: 13 }}>لا توجد فعاليات معتمدة قادمة.</div>}
          {upcoming.map(r => (
            <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--bk-gold-line)' }}>
              <div className="spread" style={{ alignItems: 'flex-start' }}>
                <div>
                  <b style={{ fontSize: 13.5 }}>{r.event}</b>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{hallName(r.hall)}</div>
                </div>
                <span className="chip gold" style={{ fontSize: 11 }}>{r.dates}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.DashboardScreen = DashboardScreen;
