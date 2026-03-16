"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

interface MapProps {
  onAoiDrawn: (wkt: string) => void;
}

function polygonToWkt(latlngs: { lat: number; lng: number }[]): string {
  const coords = [...latlngs, latlngs[0]]
    .map((p) => `${p.lng} ${p.lat}`)
    .join(", ");
  return `POLYGON((${coords}))`;
}

export default function Map({ onAoiDrawn }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to avoid SSR issues
    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet-draw");

      // Fix leaflet default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
      });

      // Dark CartoDB tiles
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      // Draw controls
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const drawControl = new (
        L.Control as unknown as {
          Draw: new (opts: unknown) => L.Control;
        }
      ).Draw({
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: { color: "#ef4444", message: "Self-intersections not allowed" },
            shapeOptions: { color: "#06b6d4", fillOpacity: 0.15 },
          },
          rectangle: {
            shapeOptions: { color: "#06b6d4", fillOpacity: 0.15 },
          },
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
        },
        edit: { featureGroup: drawnItems },
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (e: unknown) => {
        const event = e as { layer: L.Layer & { getLatLngs?: () => unknown } };
        drawnItems.clearLayers();
        drawnItems.addLayer(event.layer);
        const latlngs = event.layer.getLatLngs?.();
        if (latlngs && Array.isArray(latlngs) && latlngs.length > 0) {
          const ring = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
          const wkt = polygonToWkt(
            (ring as { lat: number; lng: number }[]).map((p) => ({
              lat: p.lat,
              lng: p.lng,
            }))
          );
          onAoiDrawn(wkt);
        }
      });

      mapRef.current = map;
    }

    init();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
