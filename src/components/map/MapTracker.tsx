"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const riderIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "hue-rotate-180", // make it reddish
});

const storeIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const customerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "hue-rotate-90", // make it greenish
});

interface MapTrackerProps {
  riderPos: [number, number];
  storePos?: [number, number];
  customerPos?: [number, number];
}

function BoundsFitter({ positions }: { positions: L.LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 14);
    }
  }, [map, positions]);
  return null;
}

export default function MapTracker({ riderPos, storePos, customerPos }: MapTrackerProps) {
  const positions: [number, number][] = [riderPos];
  if (storePos) positions.push(storePos);
  if (customerPos) positions.push(customerPos);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={riderPos} 
        zoom={14} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <BoundsFitter positions={positions} />
        
        <Marker position={riderPos} icon={riderIcon}>
          <Popup>You</Popup>
        </Marker>
        
        {storePos && (
          <Marker position={storePos} icon={storeIcon}>
            <Popup>Store</Popup>
          </Marker>
        )}
        
        {customerPos && (
          <Marker position={customerPos} icon={customerIcon}>
            <Popup>Customer</Popup>
          </Marker>
        )}

        {storePos && (
          <Polyline positions={[riderPos, storePos]} color="#6366f1" dashArray="5, 10" weight={3} />
        )}
        {storePos && customerPos && (
          <Polyline positions={[storePos, customerPos]} color="#10b981" weight={4} />
        )}
      </MapContainer>
    </div>
  );
}
