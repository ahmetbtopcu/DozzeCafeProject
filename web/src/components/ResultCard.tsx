"use client";

import Image from "next/image";
import type { Report } from "@/lib/api";

type Props = {
  report: Report | null;
};

export default function ResultCard({ report }: Props) {
  if (!report) {
    return (
      <section className="border-t border-emerald-100 pt-8 text-sm text-zinc-500 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">Çıktı</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
          Dilekçe burada görünecek.
        </h3>
        <p className="mt-3 leading-6">
          Fotoğrafı yükleyip ihbarı gönderdiğinizde kurum, şiddet skoru ve resmi başvuru metni oluşur.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5 border-t border-emerald-100 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">Analiz sonucu</p>
          <h3 className="mt-2 text-2xl font-semibold text-zinc-950">{report.violation_label}</h3>
          <p className="text-sm text-zinc-500">
            Şiddet: <span className="font-medium">{report.severity.level}</span> ({report.severity.score}/100)
          </p>
        </div>
        {report.demo && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Demo</span>
        )}
      </div>

      {report.image_base64 && (
        <Image
          src={`data:image/jpeg;base64,${report.image_base64}`}
          alt="Anonimleştirilmiş kanıt"
          width={720}
          height={360}
          unoptimized
          className="max-h-56 w-full rounded-3xl object-cover"
        />
      )}

      <div className="border-y border-emerald-100 py-4 text-sm">
        <p className="font-medium text-zinc-800">Sorumlu kurum</p>
        <p>{report.authority?.authority}</p>
        <p className="mt-1 text-zinc-600">{report.authority?.channel} — {report.authority?.law_ref}</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-800">Dilekçe</p>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-3xl bg-zinc-950 p-5 text-xs leading-6 text-zinc-100">
          {report.petition}
        </pre>
      </div>

      <p className="text-xs text-zinc-400">Blur: {report.blur_count} alan | KVKK uyumlu</p>
    </section>
  );
}
