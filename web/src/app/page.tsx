"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Image from "next/image";

type LegalBasis = {
  title: string;
  article: string;
  summary: string;
};

type ReportResponse = {
  id: string;
  violation: {
    id: string;
    label: string;
    authority: string;
    legalBasis: LegalBasis[];
  };
  severity: number;
  confidence: number;
  evidenceSummary: string;
  recommendedChannel: string;
  petition: string;
  tracking: {
    status: string;
    nextAction: string;
    updatedAt: string;
  };
  privacyNote: string;
};

const issueOptions = [
  { id: "kaldirim_isgali", label: "Kaldırım işgali" },
  { id: "yol_cukuru", label: "Yol çukuru" },
  { id: "kirik_tabela", label: "Kırık tabela" },
  { id: "cop_birikimi", label: "Çöp birikimi" },
  { id: "engelli_rampasi_engeli", label: "Engelli rampası engeli" },
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function Home() {
  const [issueId, setIssueId] = useState(issueOptions[0].id);
  const [district, setDistrict] = useState("Güngören");
  const [neighborhood, setNeighborhood] = useState("Mareşal Çakmak");
  const [addressHint, setAddressHint] = useState("Kaldırım üzeri, okul girişi yakını");
  const [imageName, setImageName] = useState("ornek-ihlal.jpg");
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIssue = useMemo(
    () => issueOptions.find((issue) => issue.id === issueId) ?? issueOptions[0],
    [issueId],
  );

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImageName(file.name);
    setPreview(await createAnonymizedPreview(file));
    setReport(null);
  }

  async function analyzeReport() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/reports/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          district,
          neighborhood,
          addressHint,
          imageName,
        }),
      });

      if (!response.ok) {
        throw new Error("Backend demo API yanıt vermedi.");
      }

      setReport((await response.json()) as ReportResponse);
    } catch {
      setError("Backend kapalı görünüyor; aynı sözleşmeyle lokal demo çıktısı gösteriliyor.");
      setReport(buildFallbackReport(selectedIssue.label, issueId, district, neighborhood, addressHint));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-sky-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div className="text-xl font-semibold tracking-tight text-slate-950">CİMER+</div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#cozum" className="transition hover:text-sky-700">Çözüm</a>
            <a href="#akis" className="transition hover:text-sky-700">Akış</a>
            <a href="#demo" className="transition hover:text-sky-700">Demo</a>
          </nav>
          <a
            href="#demo"
            className="rounded-full border border-sky-200 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
          >
            Demoyu dene
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-sky-100">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_18%,rgba(125,211,252,0.36),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fcff_100%)]" />
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-semibold leading-[1.04] tracking-tight text-slate-950 md:text-7xl">
              Şikayeti kanıtlı ve hukuki dayanaklı hale getiren web platformu.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              CİMER+; kaldırım işgali, yol çukuru, kırık tabela ve benzeri
              kentsel problemleri görüntüden sınıflandırır, mevzuatla eşleştirir
              ve vatandaşın ilgili kuruma iletebileceği sade bir dilekçe taslağı üretir.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#demo"
                className="rounded-full bg-sky-100 px-7 py-4 text-center text-sm font-semibold text-sky-900 ring-1 ring-sky-200 transition hover:bg-sky-200/70"
              >
                Başvuru taslağı oluştur
              </a>
              <a
                href="#cozum"
                className="rounded-full border border-slate-200 bg-white px-7 py-4 text-center text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
              >
                Projeyi incele
              </a>
            </div>
          </div>

          <div className="self-end border-l border-sky-100 pl-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-700">
              Neden farklı?
            </p>
            <p className="mt-5 text-3xl font-semibold leading-tight text-slate-900">
              Harita çıkarmakla kalmaz; vatandaşa ne yazacağını, hangi kuruma
              başvuracağını ve hangi dayanağı kullanacağını gösterir.
            </p>
            <div className="mt-8 grid gap-5 border-t border-sky-100 pt-6 text-sm text-slate-600 sm:grid-cols-3 lg:grid-cols-1">
              <Stat label="Girdi" value="Fotoğraf" />
              <Stat label="Motor" value="CV + RAG" />
              <Stat label="Çıktı" value="Dilekçe" />
            </div>
          </div>
        </div>
      </section>

      <section id="cozum" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Çözüm</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Öfkeli vatandaşa hızlı, düzenli ve kanıtlı başvuru akışı.
            </h2>
          </div>
          <div className="grid gap-7 border-l border-sky-100 pl-8 text-slate-600 md:grid-cols-3">
            <ProcessStep title="Kanıt" text="Fotoğraf cihazda düşük çözünürlüklü ve bulanık önizlemeye çevrilir." />
            <ProcessStep title="Dayanak" text="İhlal türü, küçük ve kontrollü mevzuat korpusuyla eşleştirilir." />
            <ProcessStep title="Aksiyon" text="Kurum yönlendirmesi ve kopyalanabilir resmi başvuru taslağı üretilir." />
          </div>
        </div>
      </section>

      <section id="akis" className="border-y border-sky-100 bg-sky-50/55">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-8 text-sm font-semibold text-slate-700 md:grid-cols-5">
            {["Yükle", "Anonimleştir", "Sınıflandır", "Mevzuat eşle", "Dilekçe üret"].map((item, index) => (
              <div key={item} className="flex items-center gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sky-700 ring-1 ring-sky-200">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Canlı demo</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Bir ihlal seç, konumu yaz, taslak başvuruyu üret.
          </h2>
          <p className="mt-4 text-slate-600">
            Demo gerçek CİMER/153 gönderimi yapmaz; metni kullanıcı kontrolüne
            hazır hale getirir.
          </p>
        </div>

        <div className="grid gap-10 rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_24px_80px_rgba(14,165,233,0.12)] lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">İhlal türü</span>
              <select
                value={issueId}
                onChange={(event) => setIssueId(event.target.value)}
                className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-slate-950 outline-none ring-sky-300 transition focus:ring-2"
              >
                {issueOptions.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    {issue.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="İlçe" value={district} onChange={setDistrict} />
              <TextInput label="Mahalle" value={neighborhood} onChange={setNeighborhood} />
            </div>

            <TextInput label="Adres ipucu" value={addressHint} onChange={setAddressHint} />

            <label className="block rounded-3xl border border-dashed border-sky-200 bg-sky-50/70 p-5">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Fotoğraf yükle</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-slate-600" />
              <span className="mt-3 block text-xs leading-5 text-slate-500">
                Ham görsel saklanmaz; tarayıcıda düşük çözünürlüklü blur önizleme oluşturulur.
              </span>
            </label>

            {preview ? (
              <Image
                src={preview}
                alt="Anonimleştirilmiş demo önizleme"
                width={720}
                height={416}
                unoptimized
                className="h-48 w-full rounded-3xl object-cover opacity-80 blur-[1px]"
              />
            ) : null}

            <button
              type="button"
              onClick={analyzeReport}
              disabled={isLoading}
              className="w-full rounded-full bg-sky-100 px-6 py-4 text-sm font-semibold text-sky-900 ring-1 ring-sky-200 transition hover:bg-sky-200/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Başvuru taslağı hazırlanıyor..." : "Analiz et ve dilekçe üret"}
            </button>
            {error ? <p className="text-sm text-amber-700">{error}</p> : null}
          </div>

          <div className="border-t border-sky-100 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            {report ? (
              <div className="space-y-7">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Metric label="İhlal" value={report.violation.label} />
                  <Metric label="Şiddet" value={`${report.severity}/100`} />
                  <Metric label="Güven" value={`${Math.round(report.confidence * 100)}%`} />
                </div>

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
                    Kurum ve dayanak
                  </p>
                  <p className="mt-3 font-semibold text-slate-950">{report.recommendedChannel}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {report.violation.legalBasis[0]?.title} {report.violation.legalBasis[0]?.article}:{" "}
                    {report.violation.legalBasis[0]?.summary}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
                    Dilekçe taslağı
                  </p>
                  <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-100">
                    {report.petition}
                  </pre>
                </div>

                <p className="text-sm leading-6 text-slate-500">{report.privacyNote}</p>
              </div>
            ) : (
              <div className="flex min-h-[520px] flex-col justify-center">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Çıktı</p>
                <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  Analizden sonra burada mevzuat dayanağı ve dilekçe taslağı görünür.
                </h3>
                <p className="mt-4 leading-7 text-slate-600">
                  Amaç tek ekranda sade bir karar desteği sunmak: ne oldu, hangi
                  kuruma gidecek, hangi maddeye dayanacak ve vatandaş ne yazacak.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-slate-950 outline-none ring-sky-300 transition focus:ring-2"
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ProcessStep({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6">{text}</p>
    </div>
  );
}

async function createAnonymizedPreview(file: File): Promise<string> {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const maxWidth = 360;
  const scale = Math.min(1, maxWidth / image.width);
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    return URL.createObjectURL(file);
  }

  context.filter = "blur(5px)";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.55);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement("img");
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

function buildFallbackReport(
  label: string,
  issueId: string,
  district: string,
  neighborhood: string,
  addressHint: string,
): ReportResponse {
  const reportId = `demo-${issueId}`;
  const location = [neighborhood, district, addressHint].filter(Boolean).join(" ");
  return {
    id: reportId,
    violation: {
      id: issueId,
      label,
      authority: "İlçe belediyesi / ALO 153",
      legalBasis: [
        {
          title: "5393 sayılı Belediye Kanunu",
          article: "Madde 14-15",
          summary:
            "Belediye, kentsel altyapı, çevre sağlığı, kent düzeni ve esenliği için gerekli hizmetleri yürütür.",
        },
      ],
    },
    severity: 78,
    confidence: 0.86,
    evidenceSummary: `${location || "Belirtilen konum"} için ${label} tespiti yapıldı.`,
    recommendedChannel: "İlçe belediyesi / ALO 153",
    petition: `Konu: ${label} hakkında inceleme ve işlem talebi\n\nSayın Yetkili,\n\n${location || "Bildirilen konum"} adresinde kamu düzenini ve yaya güvenliğini etkileyen "${label}" niteliğinde bir ihlal tespit edilmiştir. 5393 sayılı Belediye Kanunu kapsamında gerekli incelemenin yapılarak ihlalin giderilmesini talep ederim.\n\nEk: Anonimleştirilmiş görsel kanıt ve CİMER+ demo rapor numarası (${reportId}).\n\nBu metin otomatik oluşturulmuş başvuru taslağıdır; gönderim öncesinde vatandaş tarafından kontrol edilmelidir.`,
    tracking: {
      status: "Taslak hazır",
      nextAction: "Başvuru metnini kontrol edip doğru kuruma iletin.",
      updatedAt: new Date().toISOString(),
    },
    privacyNote: "Ham görüntü saklanmaz; demo akışı cihaz tarafında anonimleştirilmiş önizleme varsayar.",
  };
}
