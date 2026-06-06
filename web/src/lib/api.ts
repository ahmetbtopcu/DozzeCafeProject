/** Canlı backend — lokal fallback yok. Vercel'de NEXT_PUBLIC_API_URL ayarlayın. */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://nobetci-backend.onrender.com";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  severity_score: number;
  severity_level: string;
  violation_type: string;
  violation_label: string;
};

export type Report = {
  id: string;
  created_at: string;
  lat: number;
  lng: number;
  image_base64?: string;
  blur_count: number;
  violation_type: string;
  violation_label: string;
  severity: { score: number; level: string };
  authority: { authority: string; channel: string; law_ref: string };
  petition: string;
  demo?: boolean;
};

export type Stats = {
  total_reports: number;
  by_violation_type: Record<string, number>;
  by_severity_level: Record<string, number>;
  avg_severity: number;
};

export type HealthStatus = {
  status: string;
  service: string;
  ai_healthy: boolean;
  time: string;
};

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Backend erişilemiyor");
  return res.json();
}

export async function fetchMapPins(): Promise<MapPin[]> {
  const res = await fetch(`${API_URL}/api/reports/map`, { cache: "no-store" });
  if (!res.ok) throw new Error("Harita verisi alınamadı");
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_URL}/api/reports/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("İstatistik alınamadı");
  return res.json();
}

export async function submitReport(
  file: File,
  lat: number,
  lng: number
): Promise<Report> {
  const form = new FormData();
  form.append("image", file);
  form.append("lat", String(lat));
  form.append("lng", String(lng));

  const res = await fetch(`${API_URL}/api/reports`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "İhbar gönderilemedi");
  }
  return res.json();
}
