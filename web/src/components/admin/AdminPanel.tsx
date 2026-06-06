"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  REPORT_STATUS_LABELS,
  fetchAdminReport,
  fetchAdminReports,
  formatAddress,
  formatReporter,
  seedMockReport,
  updateAdminReportStatus,
  violationLabel,
  type AdminReport,
  type AdminReportSummary,
  type ReportStatus,
} from "@/lib/admin";

const STATUS_OPTIONS: ReportStatus[] = ["pending", "in_review", "forwarded", "closed"];

const STATUS_STYLES: Record<ReportStatus, string> = {
  pending: "bg-amber-400/20 text-amber-200",
  in_review: "bg-sky-400/20 text-sky-200",
  forwarded: "bg-emerald-400/20 text-emerald-200",
  closed: "bg-zinc-400/20 text-zinc-300",
};

function normalizeStatus(status?: string): ReportStatus {
  if (status && status in REPORT_STATUS_LABELS) {
    return status as ReportStatus;
  }
  return "pending";
}

export default function AdminPanel() {
  const [reports, setReports] = useState<AdminReportSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [nextStatus, setNextStatus] = useState<ReportStatus>("in_review");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminReports();
      setReports(data.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Liste yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadReports();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    if (statusFilter === "all") {
      return reports;
    }
    return reports.filter((report) => normalizeStatus(report.status) === statusFilter);
  }, [reports, statusFilter]);

  async function openReport(id: string) {
    setSelectedId(id);
    setDetailLoading(true);
    setError(null);
    try {
      const report = await fetchAdminReport(id);
      setSelectedReport(report);
      setNextStatus(normalizeStatus(report.status));
      setAdminNote(report.admin_note ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detay alınamadı.");
      setSelectedId(null);
      setSelectedReport(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSeedMock() {
    setSeeding(true);
    setError(null);
    try {
      const report = await seedMockReport();
      await loadReports();
      setSelectedId(report.id);
      setSelectedReport(report);
      setNextStatus(normalizeStatus(report.status));
      setAdminNote(report.admin_note ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mock ihbar eklenemedi.");
    } finally {
      setSeeding(false);
    }
  }

  async function handleStatusSave() {
    if (!selectedReport) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAdminReportStatus(selectedReport.id, nextStatus, adminNote);
      setSelectedReport(updated);
      setReports((current) =>
        current.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                status: normalizeStatus(updated.status),
              }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Durum kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="border-b border-white/10 bg-black/20 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">Prototip admin</p>
            <h1 className="text-2xl font-semibold text-white">Gelen ihbarlar</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSeedMock()}
              disabled={seeding}
              className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-100 transition duration-200 hover:bg-amber-400/20 disabled:opacity-60"
            >
              {seeding ? "Mock ekleniyor…" : "Mock ihbar ekle"}
            </button>
            <button
              type="button"
              onClick={() => void loadReports()}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition duration-200 hover:bg-white/10"
            >
              Yenile
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">İhbar kuyruğu</h2>
              <p className="text-sm text-zinc-400">{filteredReports.length} kayıt</p>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ReportStatus | "all")}
              className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            >
              <option value="all">Tüm durumlar</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {REPORT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          {loading && <p className="text-sm text-emerald-300">İhbarlar yükleniyor…</p>}
          {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

          <div className="space-y-3">
            {filteredReports.map((report) => {
              const status = normalizeStatus(report.status);
              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => void openReport(report.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition duration-200 hover:border-emerald-400/40 hover:bg-emerald-500/5 ${
                    selectedId === report.id
                      ? "border-emerald-400/50 bg-emerald-500/10"
                      : "border-white/10 bg-zinc-900/40"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{report.violation_label}</p>
                      <p className="mt-1 text-sm text-zinc-400">{formatAddress(report.address)}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {new Date(report.created_at).toLocaleString("tr-TR")} · {formatReporter(report.reporter)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
                      {REPORT_STATUS_LABELS[status]}
                    </span>
                  </div>
                </button>
              );
            })}
            {!loading && filteredReports.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-400">
                Henüz ihbar yok. Vatandaş formundan gönderilen kayıtlar burada görünecek.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
          {!selectedId && (
            <div className="flex h-full min-h-80 items-center justify-center text-sm text-zinc-400">
              Detay için listeden bir ihbar seçin.
            </div>
          )}

          {selectedId && detailLoading && <p className="text-sm text-emerald-300">İhbar detayı yükleniyor…</p>}

          {selectedReport && !detailLoading && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedReport.violation_label}</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Şiddet: {selectedReport.severity.level} ({selectedReport.severity.score}/100)
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[normalizeStatus(selectedReport.status)]}`}
                >
                  {REPORT_STATUS_LABELS[normalizeStatus(selectedReport.status)]}
                </span>
              </div>

              <FieldGroup title="Formdan gelen ihlal bilgisi">
                <Field label="Kullanıcının seçtiği ihlal" value={violationLabel(selectedReport.user_violation_type)} />
                <Field label="AI tespit etiketi" value={selectedReport.violation_label} />
                <Field label="AI ihlal kodu" value={selectedReport.violation_type} />
                <Field label="Ayrıntılı bilgi" value={selectedReport.details || "—"} multiline />
              </FieldGroup>

              <FieldGroup title="Adres bilgileri">
                <Field label="İl" value={selectedReport.address?.city || "—"} />
                <Field label="İlçe" value={selectedReport.address?.district || "—"} />
                <Field label="Mahalle" value={selectedReport.address?.neighborhood || "—"} />
                <Field label="Cadde" value={selectedReport.address?.avenue || "—"} />
                <Field label="Sokak" value={selectedReport.address?.street || "—"} />
                <Field label="Kapı no" value={selectedReport.address?.building_no || "—"} />
                <Field label="Tam adres" value={formatAddress(selectedReport.address)} multiline />
                <Field label="Koordinat" value={`${selectedReport.lat}, ${selectedReport.lng}`} />
              </FieldGroup>

              <FieldGroup title="İhbarı yapan kişi">
                <Field label="İsim" value={selectedReport.reporter?.first_name || "—"} />
                <Field label="Soyisim" value={selectedReport.reporter?.last_name || "—"} />
                <Field label="Ad soyad" value={selectedReport.reporter?.name || "—"} />
                <Field label="E-posta" value={selectedReport.reporter?.email || "—"} />
                <Field label="Telefon" value={selectedReport.reporter?.phone || "—"} />
              </FieldGroup>

              {selectedReport.image_base64 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-white">Yüklenen fotoğraf (mock kanıt)</p>
                  <Image
                    src={`data:image/jpeg;base64,${selectedReport.image_base64}`}
                    alt="İhbar fotoğrafı"
                    width={960}
                    height={540}
                    unoptimized
                    className="max-h-80 w-full rounded-3xl object-cover"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Mock örnek: Lionel Messi 2010 (Wikimedia). Gerçek ihbarlarda yüz/plaka model öncesi bulanıklaştırılır.
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-emerald-500/10 p-4 text-sm">
                <p className="font-medium text-white">Sorumlu kurum</p>
                <p className="text-zinc-200">{selectedReport.authority?.authority}</p>
                <p className="mt-1 text-zinc-400">
                  {selectedReport.authority?.channel} — {selectedReport.authority?.law_ref}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-white">Dilekçe taslağı</p>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl bg-black/50 p-4 text-xs leading-6 text-zinc-200">
                  {selectedReport.petition}
                </pre>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-200">Durum güncelle</span>
                  <select
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value as ReportStatus)}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-400"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {REPORT_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-200">Admin notu</span>
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-400"
                    placeholder="İnceleme notu, iletim bilgisi vb."
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleStatusSave()}
                  className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition duration-200 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor…" : "Durumu kaydet"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <p className="mb-3 text-sm font-semibold text-emerald-200">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={multiline ? "sm:col-span-2" : ""}>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-sm text-zinc-200 ${multiline ? "leading-6" : ""}`}>{value}</p>
    </div>
  );
}
