"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapLocationPickerProps {
  initialPosition?: [number, number];
  onLocationSelect?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  /** When set, the map flies to this position (e.g. from geocoding). */
  flyToPosition?: [number, number] | null;
}

/** Sub-component: smoothly flies map to a new position whenever it changes */
function FlyTo({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 16, { duration: 1.4 });
  }, [position[0], position[1]]);
  return null;
}

export default function MapLocationPicker({
  initialPosition = [23.8103, 90.4125],
  onLocationSelect,
  readOnly = false,
  flyToPosition,
}: MapLocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(initialPosition);

  // Sync when initialPosition changes (e.g. after data load)
  useEffect(() => {
    if (initialPosition) setPosition(initialPosition);
  }, [initialPosition[0], initialPosition[1]]);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        if (!readOnly) {
          const p: [number, number] = [e.latlng.lat, e.latlng.lng];
          setPosition(p);
          onLocationSelect?.(e.latlng.lat, e.latlng.lng);
        }
      },
    });
    return position ? <Marker position={position} icon={icon} /> : null;
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        className="h-full w-full z-0 relative"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker />
        {/* Fly to geocoded position when it changes */}
        {flyToPosition && <FlyTo position={flyToPosition} />}
      </MapContainer>
    </div>
  );
}
