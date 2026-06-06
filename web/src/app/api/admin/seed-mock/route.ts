import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://nobetci-backend.onrender.com";

export async function POST() {
  try {
    const response = await fetch(`${API_URL}/api/admin/seed-mock`, { method: "POST", cache: "no-store" });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Mock ihbar servisine ulaşılamadı." }, { status: 502 });
  }
}
