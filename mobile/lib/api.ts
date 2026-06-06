const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

export type Report = {
  id: string;
  violation_label: string;
  severity: { score: number; level: string };
  authority: { authority: string; channel: string; law_ref: string };
  petition: string;
  image_base64?: string;
  demo?: boolean;
};

export async function submitReport(
  uri: string,
  lat: number,
  lng: number
): Promise<Report> {
  const form = new FormData();
  form.append("image", {
    uri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as unknown as Blob);
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
