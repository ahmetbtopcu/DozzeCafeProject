export type NeighborhoodOption = {
  name: string;
  lat: number;
  lng: number;
};

export type DistrictOption = {
  name: string;
  neighborhoods: NeighborhoodOption[];
};

export type CityOption = {
  name: string;
  districts: DistrictOption[];
};

export type StreetLineOption = {
  name: string;
  lat: number;
  lng: number;
};

export type StreetOptions = {
  avenues: StreetLineOption[];
  streets: StreetLineOption[];
  source: string;
  radiusM: number;
};

export async function fetchLocationOptions(): Promise<CityOption[]> {
  const response = await fetch("/api/locations", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Resmi açık veri lokasyon kaynağına ulaşılamadı.");
  }

  return response.json();
}

export async function fetchStreetOptions(lat: number, lng: number): Promise<StreetOptions> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  const response = await fetch(`/api/locations/streets?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Cadde/sokak listesi alınamadı.");
  }

  return response.json();
}
