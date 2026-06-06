"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPin } from "@/lib/api";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#16a34a",
  none: "#6b7280",
};

type Props = {
  pins: MapPin[];
  center?: [number, number];
};

export default function ViolationMap({ pins, center = [41.0931, 28.8022] }: Props) {
  return (
    <MapContainer
      center={center}
      zoom={14}
      className="h-full w-full rounded-xl z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((pin) => (
        <CircleMarker
          key={pin.id}
          center={[pin.lat, pin.lng]}
          radius={8 + pin.severity_score / 15}
          pathOptions={{
            color: SEVERITY_COLORS[pin.severity_level] || "#6b7280",
            fillColor: SEVERITY_COLORS[pin.severity_level] || "#6b7280",
            fillOpacity: 0.75,
          }}
        >
          <Popup>
            <strong>{pin.violation_label}</strong>
            <br />
            Şiddet: {pin.severity_level} ({pin.severity_score})
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
