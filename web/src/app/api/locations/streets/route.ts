import { NextRequest, NextResponse } from "next/server";
import type { StreetLineOption } from "@/lib/locations";

const DEFAULT_RADIUS_M = Number(process.env.STREET_LOOKUP_RADIUS_M) || 500;
const OVERPASS_URL = process.env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter";

type OverpassElement = {
  tags?: {
    name?: string;
  };
  center?: {
    lat?: number;
    lon?: number;
  };
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const radius = Number(request.nextUrl.searchParams.get("radius")) || DEFAULT_RADIUS_M;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Geçerli lat/lng gerekli." }, { status: 400 });
  }

  if (radius < 100 || radius > 2000) {
    return NextResponse.json({ error: "Yarıçap 100–2000 m arasında olmalı." }, { status: 400 });
  }

  try {
    const query = `[out:json][timeout:25];
(
  way["highway"]["name"](around:${Math.round(radius)},${lat},${lng});
);
out center;`;

    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "NobetciWeb/1.0 (hackathon; street lookup)",
      },
      body: query,
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Cadde/sokak açık veri kaynağına ulaşılamadı." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as OverpassResponse;
    const classified = classifyStreetLines(data.elements ?? [], lat, lng);

    return NextResponse.json({
      avenues: classified.avenues,
      streets: classified.streets,
      source: "openstreetmap",
      radiusM: radius,
    });
  } catch {
    return NextResponse.json({ error: "Cadde/sokak listesi alınamadı." }, { status: 502 });
  }
}

function classifyStreetLines(elements: OverpassElement[], originLat: number, originLng: number) {
  const grouped = new Map<string, { latSum: number; lngSum: number; count: number }>();

  for (const element of elements) {
    const name = element.tags?.name?.trim();
    const centerLat = element.center?.lat;
    const centerLng = element.center?.lon;

    if (!name || !Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
      continue;
    }

    const latitude = Number(centerLat);
    const longitude = Number(centerLng);
    const bucket = grouped.get(name) ?? { latSum: 0, lngSum: 0, count: 0 };
    bucket.latSum += latitude;
    bucket.lngSum += longitude;
    bucket.count += 1;
    grouped.set(name, bucket);
  }

  const avenues: StreetLineOption[] = [];
  const streets: StreetLineOption[] = [];

  for (const [name, bucket] of grouped.entries()) {
    const line: StreetLineOption = {
      name,
      lat: bucket.latSum / bucket.count,
      lng: bucket.lngSum / bucket.count,
    };

    if (isAvenueName(name)) {
      avenues.push(line);
      continue;
    }

    if (isStreetName(name)) {
      streets.push(line);
      continue;
    }

    streets.push(line);
  }

  const sortByDistance = (a: StreetLineOption, b: StreetLineOption) => {
    const distanceA = distanceMeters(originLat, originLng, a.lat, a.lng);
    const distanceB = distanceMeters(originLat, originLng, b.lat, b.lng);
    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }
    return a.name.localeCompare(b.name, "tr");
  };

  return {
    avenues: avenues.sort(sortByDistance),
    streets: streets.sort(sortByDistance),
  };
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

function isAvenueName(name: string) {
  return /(?:^|\s)(?:cad\.?|caddesi|bulvarı?|bul\.?|yolu|köprüsü)(?:\s|$)/iu.test(name);
}

function isStreetName(name: string) {
  return /(?:^|\s)(?:sk\.?|sokağı|sokak|çıkmazı|meydanı|geçidi)(?:\s|$)/iu.test(name);
}
