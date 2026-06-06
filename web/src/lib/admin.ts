export type ReportStatus = "pending" | "in_review" | "forwarded" | "closed";

export type AdminAddress = {
  city?: string;
  district?: string;
  neighborhood?: string;
  avenue?: string;
  street?: string;
  building_no?: string;
};

export type AdminReporter = {
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
};

export type AdminReportSummary = {
  id: string;
  created_at: string;
  status: ReportStatus;
  lat: number;
  lng: number;
  violation_type: string;
  violation_label: string;
  user_violation_type?: string;
  details?: string;
  address?: AdminAddress;
  reporter?: AdminReporter;
  severity: { score: number; level: string };
  demo?: boolean;
};

export type AdminReport = AdminReportSummary & {
  image_base64?: string;
  blur_count: number;
  admin_note?: string;
  petition: string;
  authority: {
    authority: string;
    channel: string;
    law_ref: string;
    reason?: string;
  };
  legal_references?: Array<{
    source: string;
    heading: string;
    text: string;
    score: number;
  }>;
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Beklemede",
  in_review: "İnceleniyor",
  forwarded: "İletildi",
  closed: "Kapatıldı",
};

export const USER_VIOLATION_LABELS: Record<string, string> = {
  sidewalk_occupation: "Kaldırım ihlali",
  crosswalk_violation: "Yaya geçidi ihlali",
  road_damage: "Yol çukuru",
  broken_sign: "Kırık tabela",
  garbage_pile: "Çöp / moloz",
  ramp_blocked: "Engelli rampası engeli",
  other: "Diğer",
};

export function violationLabel(code?: string) {
  if (!code) {
    return "—";
  }
  return USER_VIOLATION_LABELS[code] ?? code;
}

export async function fetchAdminReports(): Promise<AdminReportSummary[]> {
  const res = await fetch("/api/admin/reports", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("İhbar listesi alınamadı.");
  }
  return res.json();
}

export async function fetchAdminReport(id: string): Promise<AdminReport> {
  const res = await fetch(`/api/admin/reports/${id}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("İhbar detayı alınamadı.");
  }
  return res.json();
}

export async function seedMockReport(): Promise<AdminReport> {
  const res = await fetch("/api/admin/seed-mock", { method: "POST" });
  if (!res.ok) {
    throw new Error("Mock ihbar oluşturulamadı.");
  }
  return res.json();
}

export async function updateAdminReportStatus(
  id: string,
  status: ReportStatus,
  adminNote?: string,
): Promise<AdminReport> {
  const res = await fetch(`/api/admin/reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, admin_note: adminNote }),
  });
  if (!res.ok) {
    throw new Error("Durum güncellenemedi.");
  }
  return res.json();
}

export function formatAddress(address?: AdminAddress) {
  if (!address) {
    return "—";
  }
  return [
    address.neighborhood,
    address.avenue,
    address.street,
    address.building_no ? `No: ${address.building_no}` : "",
    address.district,
    address.city,
  ]
    .filter(Boolean)
    .join(", ");
}

export function formatReporter(reporter?: AdminReporter) {
  if (!reporter) {
    return "—";
  }
  const name = reporter.name || [reporter.first_name, reporter.last_name].filter(Boolean).join(" ");
  return [name, reporter.email, reporter.phone].filter(Boolean).join(" · ");
}
