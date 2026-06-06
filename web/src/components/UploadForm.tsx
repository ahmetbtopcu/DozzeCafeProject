"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { submitReport, type Report } from "@/lib/api";
import {
  fetchLocationOptions,
  fetchStreetOptions,
  type CityOption,
  type NeighborhoodOption,
  type StreetLineOption,
} from "@/lib/locations";

const MANUAL_ADDRESS_OPTION = "Diğer (manuel gir)";
const PLACEHOLDER_AVENUE = "Cadde seçin";
const PLACEHOLDER_STREET = "Sokak seçin";
const NEIGHBORHOOD_MAP_ZOOM = 15;
const STREET_MAP_ZOOM = 17;

type Props = {
  onResult: (report: Report) => void;
  onLocationChange: (center: [number, number], zoom?: number) => void;
};

const VIOLATION_TYPES = [
  { id: "sidewalk_occupation", label: "Kaldırım ihlali" },
  { id: "crosswalk_violation", label: "Yaya geçidi ihlali" },
  { id: "road_damage", label: "Yol çukuru" },
  { id: "broken_sign", label: "Kırık tabela" },
  { id: "garbage_pile", label: "Çöp / moloz" },
  { id: "ramp_blocked", label: "Engelli rampası engeli" },
  { id: "other", label: "Diğer" },
];

export default function UploadForm({ onResult, onLocationChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [locationOptions, setLocationOptions] = useState<CityOption[]>([]);
  const [violationType, setViolationType] = useState(VIOLATION_TYPES[0].id);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [avenue, setAvenue] = useState("");
  const [street, setStreet] = useState("");
  const [buildingNo, setBuildingNo] = useState("");
  const [details, setDetails] = useState("");
  const [reporterFirstName, setReporterFirstName] = useState("");
  const [reporterLastName, setReporterLastName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [avenueOptions, setAvenueOptions] = useState<StreetLineOption[]>([]);
  const [streetOptions, setStreetOptions] = useState<StreetLineOption[]>([]);
  const [streetsLoading, setStreetsLoading] = useState(false);
  const [streetsError, setStreetsError] = useState<string | null>(null);
  const [manualAvenue, setManualAvenue] = useState(false);
  const [manualStreet, setManualStreet] = useState(false);

  const selectedCity = useMemo(
    () => locationOptions.find((item) => item.name === city) ?? locationOptions[0],
    [city, locationOptions],
  );
  const selectedDistrict = useMemo(
    () => selectedCity?.districts.find((item) => item.name === district) ?? selectedCity?.districts[0],
    [district, selectedCity],
  );
  const selectedNeighborhood = useMemo<NeighborhoodOption | undefined>(
    () =>
      selectedDistrict?.neighborhoods.find((item) => item.name === neighborhood) ??
      selectedDistrict?.neighborhoods[0],
    [neighborhood, selectedDistrict],
  );
  const useAvenueSelect = avenueOptions.length > 0 && !manualAvenue;
  const useStreetSelect = streetOptions.length > 0 && !manualStreet;

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      try {
        const options = await fetchLocationOptions();
        const firstCity = options[0];
        const firstDistrict = firstCity?.districts[0];
        const firstNeighborhood = firstDistrict?.neighborhoods[0];

        if (!cancelled) {
          setLocationOptions(options);
          setCity(firstCity?.name ?? "");
          setDistrict(firstDistrict?.name ?? "");
          if (firstNeighborhood) {
            setNeighborhood(firstNeighborhood.name);
            onLocationChange([firstNeighborhood.lat, firstNeighborhood.lng], NEIGHBORHOOD_MAP_ZOOM);
          } else {
            setNeighborhood("");
          }
          setLocationsError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLocationsError(err instanceof Error ? err.message : "Lokasyon verisi alınamadı.");
        }
      } finally {
        if (!cancelled) {
          setLocationsLoading(false);
        }
      }
    }

    void loadLocations();

    return () => {
      cancelled = true;
    };
  }, [onLocationChange]);

  useEffect(() => {
    const neighborhoodOption = selectedNeighborhood;
    if (!neighborhoodOption) {
      return;
    }

    const { lat, lng } = neighborhoodOption;
    let cancelled = false;

    async function loadStreets() {
      setStreetsLoading(true);
      setStreetsError(null);
      setAvenue("");
      setStreet("");
      setBuildingNo("");
      setManualAvenue(false);
      setManualStreet(false);
      setAvenueOptions([]);
      setStreetOptions([]);

      try {
        const streets = await fetchStreetOptions(lat, lng);
        if (!cancelled) {
          setAvenueOptions(streets.avenues);
          setStreetOptions(streets.streets);
        }
      } catch (err) {
        if (!cancelled) {
          setStreetsError(err instanceof Error ? err.message : "Cadde/sokak listesi alınamadı.");
        }
      } finally {
        if (!cancelled) {
          setStreetsLoading(false);
        }
      }
    }

    void loadStreets();

    return () => {
      cancelled = true;
    };
  }, [selectedNeighborhood]);

  function handleCityChange(nextCity: string) {
    const cityOption = locationOptions.find((item) => item.name === nextCity) ?? locationOptions[0];
    if (!cityOption) return;
    const districtOption = cityOption.districts[0];
    if (!districtOption) return;
    const neighborhoodOption = districtOption.neighborhoods[0];
    if (!neighborhoodOption) return;

    setCity(cityOption.name);
    setDistrict(districtOption.name);
    applyNeighborhoodSelection(neighborhoodOption);
  }

  function handleDistrictChange(nextDistrict: string) {
    const districtOption =
      selectedCity?.districts.find((item) => item.name === nextDistrict) ?? selectedCity?.districts[0];
    if (!districtOption) return;
    const neighborhoodOption = districtOption.neighborhoods[0];
    setDistrict(districtOption.name);
    applyNeighborhoodSelection(neighborhoodOption);
  }

  function handleNeighborhoodChange(nextNeighborhood: string) {
    const neighborhoodOption =
      selectedDistrict?.neighborhoods.find((item) => item.name === nextNeighborhood) ??
      selectedDistrict?.neighborhoods[0];
    if (!neighborhoodOption) return;
    applyNeighborhoodSelection(neighborhoodOption);
  }

  function applyNeighborhoodSelection(neighborhoodOption: NeighborhoodOption) {
    setNeighborhood(neighborhoodOption.name);
    onLocationChange([neighborhoodOption.lat, neighborhoodOption.lng], NEIGHBORHOOD_MAP_ZOOM);
  }

  function focusMapOnStreet(line: StreetLineOption | undefined) {
    if (!line) {
      return;
    }
    onLocationChange([line.lat, line.lng], STREET_MAP_ZOOM);
  }

  function handleAvenueChange(nextAvenue: string) {
    if (nextAvenue === MANUAL_ADDRESS_OPTION) {
      setManualAvenue(true);
      setAvenue("");
      if (selectedNeighborhood) {
        onLocationChange([selectedNeighborhood.lat, selectedNeighborhood.lng], NEIGHBORHOOD_MAP_ZOOM);
      }
      return;
    }

    setManualAvenue(false);
    setAvenue(nextAvenue);
    focusMapOnStreet(avenueOptions.find((item) => item.name === nextAvenue));
  }

  function handleStreetChange(nextStreet: string) {
    if (nextStreet === MANUAL_ADDRESS_OPTION) {
      setManualStreet(true);
      setStreet("");
      if (selectedNeighborhood) {
        onLocationChange([selectedNeighborhood.lat, selectedNeighborhood.lng], NEIGHBORHOOD_MAP_ZOOM);
      }
      return;
    }

    setManualStreet(false);
    setStreet(nextStreet);
    focusMapOnStreet(streetOptions.find((item) => item.name === nextStreet));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!selectedNeighborhood) {
      setError("Lütfen resmi açık veri kaynağından lokasyon seçin");
      return;
    }
    if (!file) {
      setError("Lütfen bir fotoğraf seçin");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const report = await submitReport(file, selectedNeighborhood.lat, selectedNeighborhood.lng, {
        violationType,
        city,
        district,
        neighborhood,
        avenue,
        street,
        buildingNo,
        details,
        reporterFirstName,
        reporterLastName,
        reporterName: [reporterFirstName, reporterLastName].filter(Boolean).join(" "),
        reporterEmail,
        reporterPhone,
      });
      onResult(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700">İhlal türü</label>
        <select
          value={violationType}
          onChange={(event) => setViolationType(event.target.value)}
          className="w-full rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition duration-200 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        >
          {VIOLATION_TYPES.map((violation) => (
            <option key={violation.id} value={violation.id}>
              {violation.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-zinc-700">Adres bilgileri</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="İl"
            value={city}
            onChange={handleCityChange}
            options={locationOptions.map((item) => item.name)}
            required
          />
          <SelectField
            label="İlçe"
            value={district}
            onChange={handleDistrictChange}
            options={selectedCity?.districts.map((item) => item.name) ?? []}
            required
          />
          <SelectField
            label="Mahalle"
            value={neighborhood}
            onChange={handleNeighborhoodChange}
            options={selectedDistrict?.neighborhoods.map((item) => item.name) ?? []}
            required
          />
          {useAvenueSelect ? (
            <SelectField
              label="Cadde"
              value={avenue}
              onChange={handleAvenueChange}
              placeholder={PLACEHOLDER_AVENUE}
              options={[...avenueOptions.map((item) => item.name), MANUAL_ADDRESS_OPTION]}
              required
              disabled={streetsLoading}
            />
          ) : (
            <TextField
              label="Cadde"
              value={avenue}
              onChange={setAvenue}
              placeholder="Cadde adı"
              disabled={streetsLoading}
            />
          )}
          {useStreetSelect ? (
            <SelectField
              label="Sokak"
              value={street}
              onChange={handleStreetChange}
              placeholder={PLACEHOLDER_STREET}
              options={[...streetOptions.map((item) => item.name), MANUAL_ADDRESS_OPTION]}
              required
              disabled={streetsLoading}
            />
          ) : (
            <TextField
              label="Sokak"
              value={street}
              onChange={setStreet}
              placeholder="Sokak adı"
              disabled={streetsLoading}
            />
          )}
          <TextField label="Kapı No (opsiyonel)" value={buildingNo} onChange={setBuildingNo} />
        </div>
      </fieldset>
      <p className="text-xs leading-5 text-zinc-500">
        İl/ilçe/mahalle listesi İBB Açık Veri “Muhtarlık Adres Bilgileri”
        GeoJSON kaynağından gelir. Mahalle seçilince cadde/sokak listesi
        OpenStreetMap açık verisi üzerinden (~500 m çevre) dinamik yüklenir.
      </p>
      {locationsLoading && <p className="text-sm text-emerald-700">Resmi lokasyon verisi yükleniyor…</p>}
      {streetsLoading && <p className="text-sm text-emerald-700">Cadde/sokak listesi yükleniyor…</p>}
      {locationsError && <p className="text-sm text-red-600">{locationsError}</p>}
      {streetsError && <p className="text-sm text-amber-700">{streetsError} Manuel girebilirsiniz.</p>}

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700">Ayrıntılı bilgi</label>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          rows={4}
          placeholder="İhlalin ne zaman görüldüğü, yaya güvenliğine etkisi, varsa tekrar eden durum gibi ayrıntıları yazın."
          className="w-full resize-none rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition duration-200 placeholder:text-zinc-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      <fieldset className="space-y-4 border-t border-emerald-100 pt-5">
        <legend className="text-sm font-medium text-zinc-700">İhbarı yapan kişi bilgileri</legend>
        <p className="text-xs leading-5 text-zinc-500">
          Bu bilgiler yalnızca başvuru iletişimi ve takip amacıyla alınır; görüntü analizi,
          yüz/plaka tespiti veya profilleme için kullanılmaz.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="İsim" value={reporterFirstName} onChange={setReporterFirstName} required />
          <TextField label="Soyisim" value={reporterLastName} onChange={setReporterLastName} required />
          <TextField label="E-posta" value={reporterEmail} onChange={setReporterEmail} type="email" required />
          <TextField label="Telefon" value={reporterPhone} onChange={setReporterPhone} type="tel" required />
        </div>
      </fieldset>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700">İhlal fotoğrafı</label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="w-full rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-5 text-sm text-zinc-600 transition duration-200 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading || locationsLoading || Boolean(locationsError)}
        className="rounded-full bg-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/15 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Analiz ediliyor…" : "İhbar Gönder"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-700">{label}</span>
      <select
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition duration-200 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-700">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition duration-200 placeholder:text-zinc-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}
