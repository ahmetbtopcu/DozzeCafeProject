"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import UploadForm from "@/components/UploadForm";
import ResultCard from "@/components/ResultCard";
import StatsPanel from "@/components/StatsPanel";
import { fetchMapPins, fetchStats, type MapPin, type Report, type Stats } from "@/lib/api";

const ViolationMap = dynamic(() => import("@/components/ViolationMap"), { ssr: false });

export default function Home() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([fetchMapPins(), fetchStats()]);
      setPins(p);
      setStats(s);
    } catch {
      /* backend offline — demo UI still works */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleResult(r: Report) {
    setReport(r);
    refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-zinc-900">Nöbetçi</h1>
        <p className="text-sm text-zinc-600">Otomatik Belediye Hesap Sorma Motoru</p>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm lg:h-96">
            <ViolationMap pins={pins} />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Yeni İhbar</h2>
              <UploadForm onResult={handleResult} />
            </div>
            <ResultCard report={report} />
          </div>
        </section>

        <aside>
          <StatsPanel stats={stats} />
        </aside>
      </main>
    </div>
  );
}
