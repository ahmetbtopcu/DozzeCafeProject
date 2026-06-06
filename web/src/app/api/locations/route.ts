import { NextResponse } from "next/server";
import type { CityOption, DistrictOption, NeighborhoodOption } from "@/lib/locations";

const IBB_MUHTARLIK_GEOJSON_URL =
  process.env.LOCATION_OPEN_DATA_URL ??
  "https://data.ibb.gov.tr/dataset/c310cde9-92b1-4c51-9575-d71b1dc7ac43/resource/71f75529-7fae-4a85-b05f-664c62eda422/download/muhtarlik_lokasyon.geojson";

type IbbMuhtarlikFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    "İlçe Adı"?: string;
    "Mahalle Adı"?: string;
    Latitude?: number;
    Longtitude?: number;
  };
};

type IbbMuhtarlikGeoJSON = {
  features?: IbbMuhtarlikFeature[];
};

type NeighborhoodAccumulator = {
  latSum: number;
  lngSum: number;
  count: number;
};

export async function GET() {
  try {
    const response = await fetch(IBB_MUHTARLIK_GEOJSON_URL, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "İBB Açık Veri lokasyon kaynağına ulaşılamadı." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as IbbMuhtarlikGeoJSON;
    const city = buildIstanbulOptions(data.features ?? []);

    return NextResponse.json([city]);
  } catch {
    return NextResponse.json(
      { error: "Resmi açık veri lokasyon kaynağı okunamadı." },
      { status: 502 },
    );
  }
}

function buildIstanbulOptions(features: IbbMuhtarlikFeature[]): CityOption {
  const districts = new Map<string, Map<string, NeighborhoodAccumulator>>();

  for (const feature of features) {
    const districtName = toTitleCase(feature.properties?.["İlçe Adı"] ?? "");
    const neighborhoodName = toTitleCase(feature.properties?.["Mahalle Adı"] ?? "");
    const [lngFromGeometry, latFromGeometry] = feature.geometry?.coordinates ?? [];
    const lat = feature.properties?.Latitude ?? latFromGeometry;
    const lng = feature.properties?.Longtitude ?? lngFromGeometry;

    if (!districtName || !neighborhoodName || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (!districts.has(districtName)) {
      districts.set(districtName, new Map());
    }

    const neighborhoodMap = districts.get(districtName)!;
    if (!neighborhoodMap.has(neighborhoodName)) {
      neighborhoodMap.set(neighborhoodName, { latSum: 0, lngSum: 0, count: 0 });
    }

    const accumulator = neighborhoodMap.get(neighborhoodName)!;
    accumulator.latSum += latitude;
    accumulator.lngSum += longitude;
    accumulator.count += 1;
  }

  return {
    name: "İstanbul",
    districts: [...districts.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "tr"))
      .map<DistrictOption>(([name, neighborhoods]) => ({
        name,
        neighborhoods: [...neighborhoods.entries()]
          .sort(([a], [b]) => a.localeCompare(b, "tr"))
          .map<NeighborhoodOption>(([neighborhoodName, data]) => ({
            name: `${neighborhoodName} Mahallesi`,
            lat: data.latSum / data.count,
            lng: data.lngSum / data.count,
          })),
      })),
  };
}

function toTitleCase(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("tr"))
    .trim();
}
