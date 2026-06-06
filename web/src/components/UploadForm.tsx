"use client";

import { useRef, useState } from "react";
import { submitReport, type Report } from "@/lib/api";

type Props = {
  onResult: (report: Report) => void;
};

export default function UploadForm({ onResult }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Lütfen bir fotoğraf seçin");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const report = await submitReport(file, 41.0931, 28.8022);
      onResult(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-zinc-700">İhlal fotoğrafı</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Analiz ediliyor…" : "İhbar Gönder"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
