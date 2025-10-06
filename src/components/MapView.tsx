'use client';

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default icon issue with webpack
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});

interface MapViewProps {
  position: [number, number];
}

export default function MapView({ position }: MapViewProps) {
  if (!position || typeof position[0] !== 'number' || typeof position[1] !== 'number') {
    return <p>Ubicación no disponible.</p>;
  }

  return (
    <MapContainer 
      center={position} 
      zoom={15} 
      style={{ height: "100%", width: "100%" }} 
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position} />
    </MapContainer>
  );
}
