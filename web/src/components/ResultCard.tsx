"use client";

import type { Report } from "@/lib/api";

type Props = {
  report: Report | null;
};

export default function ResultCard({ report }: Props) {
  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
        Fotoğraf yükleyin — dilekçe burada görünecek
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{report.violation_label}</h3>
          <p className="text-sm text-zinc-500">
            Şiddet: <span className="font-medium">{report.severity.level}</span> ({report.severity.score}/100)
          </p>
        </div>
        {report.demo && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Demo</span>
        )}
      </div>

      {report.image_base64 && (
        <img
          src={`data:image/jpeg;base64,${report.image_base64}`}
          alt="Anonimleştirilmiş kanıt"
          className="max-h-48 w-full rounded-lg object-cover"
        />
      )}

      <div className="rounded-lg bg-zinc-50 p-3 text-sm">
        <p className="font-medium text-zinc-800">Sorumlu kurum</p>
        <p>{report.authority?.authority}</p>
        <p className="mt-1 text-zinc-600">{report.authority?.channel} — {report.authority?.law_ref}</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-800">Dilekçe</p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-900 p-4 text-xs text-zinc-100">
          {report.petition}
        </pre>
      </div>

      <p className="text-xs text-zinc-400">Blur: {report.blur_count} alan | KVKK uyumlu</p>
    </div>
  );
}
