'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default icon issue with webpack
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});

interface MapSelectorProps {
  onLocationChange: (lat: number, lng: number) => void;
  position: [number, number];
}

// Component to handle map clicks
const MapEvents = ({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to programmatically change the map's view
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export default function MapSelector({ onLocationChange, position }: MapSelectorProps) {
  const validPosition: [number, number] = position && position.length === 2 ? position : [-33.45694, -70.64827];

  const handlePositionChange = (lat: number, lng: number) => {
    onLocationChange(lat, lng);
  };

  return (
    <MapContainer center={validPosition} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker
        position={validPosition}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = e.target.getLatLng();
            handlePositionChange(lat, lng);
          },
        }}
      />
      <MapEvents onLocationChange={handlePositionChange} />
      <ChangeView center={validPosition} />
    </MapContainer>
  );
}
