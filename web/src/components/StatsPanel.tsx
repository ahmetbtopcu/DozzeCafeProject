"use client";

import type { Stats } from "@/lib/api";

const VIOLATION_LABELS: Record<string, string> = {
  sidewalk_occupation: "Kaldırım işgali",
  road_damage: "Yol hasarı",
  broken_sign: "Kırık tabela",
  garbage_pile: "Çöp / moloz",
};

type Props = {
  stats: Stats | null;
};

export default function StatsPanel({ stats }: Props) {
  if (!stats) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
        İstatistik yükleniyor…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Açık İstatistik</h2>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-2xl font-bold text-emerald-700">{stats.total_reports}</p>
          <p className="text-xs text-emerald-600">Toplam ihbar</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-2xl font-bold text-blue-700">{stats.avg_severity.toFixed(0)}</p>
          <p className="text-xs text-blue-600">Ort. şiddet</p>
        </div>
      </div>

      <h3 className="mb-2 text-sm font-medium text-zinc-700">İhlal türü</h3>
      <ul className="mb-4 space-y-1 text-sm">
        {Object.entries(stats.by_violation_type).map(([k, v]) => (
          <li key={k} className="flex justify-between">
            <span>{VIOLATION_LABELS[k] || k}</span>
            <span className="font-medium">{v}</span>
          </li>
        ))}
        {Object.keys(stats.by_violation_type).length === 0 && (
          <li className="text-zinc-400">Henüz veri yok</li>
        )}
      </ul>

      <h3 className="mb-2 text-sm font-medium text-zinc-700">Şiddet dağılımı</h3>
      <ul className="space-y-1 text-sm">
        {Object.entries(stats.by_severity_level).map(([k, v]) => (
          <li key={k} className="flex justify-between capitalize">
            <span>{k}</span>
            <span className="font-medium">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
