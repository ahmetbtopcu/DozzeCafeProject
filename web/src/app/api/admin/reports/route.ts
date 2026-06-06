import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://nobetci-backend.onrender.com";

function getExpectedAdminKey() {
  return process.env.ADMIN_API_KEY?.trim() ?? "";
}

function verifyAdminKey(request: NextRequest) {
  const expected = getExpectedAdminKey();
  if (!expected) {
    return "missing_config" as const;
  }
  const provided = request.headers.get("x-admin-key");
  return provided === expected ? ("ok" as const) : ("unauthorized" as const);
}

export async function GET(request: NextRequest) {
  const auth = verifyAdminKey(request);
  if (auth === "missing_config") {
    return NextResponse.json(
      { error: "ADMIN_API_KEY tanımlı değil. web/.env.local dosyasını kontrol edin." },
      { status: 503 },
    );
  }
  if (auth === "unauthorized") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/reports`, {
      headers: { "X-Admin-Key": process.env.ADMIN_API_KEY ?? "" },
      cache: "no-store",
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Admin servisine ulaşılamadı." }, { status: 502 });
  }
}
