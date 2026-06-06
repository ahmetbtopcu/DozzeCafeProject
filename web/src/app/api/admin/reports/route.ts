import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://nobetci-backend.onrender.com";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/admin/reports`, { cache: "no-store" });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Admin servisine ulaşılamadı." }, { status: 502 });
  }
}
