"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues in Next.js
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
}

export default function MapLocationPicker({ 
  initialPosition = [23.8103, 90.4125], // Default Dhaka
  onLocationSelect,
  readOnly = false 
}: MapLocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(initialPosition);

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        if (!readOnly) {
          setPosition([e.latlng.lat, e.latlng.lng]);
          if (onLocationSelect) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
          }
        }
      },
    });

    return position === null ? null : (
      <Marker position={position} icon={icon}></Marker>
    );
  }

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border">
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0 relative"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
}
