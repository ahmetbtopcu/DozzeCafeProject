"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import BackendStatus from "@/components/BackendStatus";
import UploadForm from "@/components/UploadForm";
import ResultCard from "@/components/ResultCard";
import StatsPanel from "@/components/StatsPanel";
import { fetchMapPins, fetchStats, type MapPin, type Report, type Stats } from "@/lib/api";

const ViolationMap = dynamic(() => import("@/components/ViolationMap"), { ssr: false });

export default function Home() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.0931, 28.8022]);
  const [mapZoom, setMapZoom] = useState(14);

  const handleLocationChange = useCallback((center: [number, number], zoom = 15) => {
    setMapCenter(center);
    setMapZoom(zoom);
  }, []);

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
    const timeout = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refresh]);

  function handleResult(r: Report) {
    setReport(r);
    refresh();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(187,247,208,0.55),transparent_32%),linear-gradient(180deg,#f8fffb_0%,#ffffff_42%,#f4fbf7_100%)] text-zinc-950">
      <header className="border-b border-emerald-100/80 bg-white/70 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Nöbetçi</h1>
            <p className="text-sm text-zinc-500">Otomatik Belediye Hesap Sorma Motoru</p>
          </div>
          <BackendStatus />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.45fr_0.8fr]">
        <section className="flex flex-col gap-10">
          <div className="max-w-4xl">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-700">
              Web tabanlı ihbar ve dilekçe sistemi
            </p>
            <h2 className="mt-4 text-5xl font-semibold leading-tight tracking-tight text-zinc-950">
              Kentsel ihlali fotoğraftan alıp resmi başvuru taslağına çevirir.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
              Fotoğraf, adres ve ihlal türünü girin. Sistem kanıtı anonimleştirir,
              ihlali sınıflandırır, doğru kurumu ve dilekçe taslağını üretir.
            </p>
          </div>

          <div className="h-80 overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/70 shadow-sm shadow-emerald-900/5 lg:h-[430px]">
            <ViolationMap pins={pins} center={mapCenter} zoom={mapZoom} />
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="border-t border-emerald-100 pt-8">
              <div className="mb-6">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                  Yeni ihbar
                </p>
                <h3 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                  İhlal türünü seç, adresi netleştir, başvuru bilgilerini tamamla.
                </h3>
              </div>
              <UploadForm onResult={handleResult} onLocationChange={handleLocationChange} />
            </section>
            <ResultCard report={report} />
          </div>
        </section>

        <aside className="border-l border-emerald-100/80 pl-0 lg:pl-8">
          <StatsPanel stats={stats} />
        </aside>
      </main>
    </div>
  );
}
