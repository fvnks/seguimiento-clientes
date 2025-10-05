'use client';

import dynamic from "next/dynamic";
import { useMemo } from "react";

interface MapLoaderProps {
  onLocationChange: (lat: number, lng: number) => void;
  initialPosition?: [number, number];
}

// This component dynamically imports the MapSelector to disable server-side rendering,
// which is necessary for Leaflet to work correctly with Next.js.
export default function MapLoader({ onLocationChange, initialPosition }: MapLoaderProps) {
    const MapSelector = useMemo(() => dynamic(() => import('@/components/MapSelector'), {
        loading: () => <p>Cargando mapa...</p>,
        ssr: false
    }), []);

    return <MapSelector onLocationChange={onLocationChange} initialPosition={initialPosition} />;
}
