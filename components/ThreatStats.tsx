import stats from "@/data/stats.json";

export default function ThreatStats() {
  const items = [
    { label: "Tracked Rulings", value: stats.total_cases_tracked.toLocaleString(), note: "Charlotin Tracker (HEC Paris)" },
    { label: "Q1 2026 Sanctions", value: `$${(stats.q1_2026_sanctions_usd / 1000).toFixed(0)}K+`, note: "Documented fines" },
    { label: "Growth Rate", value: `${stats.daily_growth_rate}/day`, note: "New judicial flags" },
    { label: "Single-Day Record", value: `${stats.single_day_record} Courts`, note: stats.single_day_record_date },
  ];

  return (
    <section className="px-6 pb-12 bg-[#050B14]/50">
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.04]">
        {items.map((item, i) => (
          <div key={i} className="bg-[#0A1628]/60 backdrop-blur-sm border border-white/[0.06] first:rounded-l-2xl last:rounded-r-2xl p-6">
            <div className="text-[11px] font-semibold text-white/35 tracking-wide uppercase mb-3">{item.label}</div>
            <div className="text-3xl md:text-4xl font-black text-white tracking-[-0.03em] mb-1">{item.value}</div>
            <div className="text-[11px] text-white/40 font-medium">{item.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
