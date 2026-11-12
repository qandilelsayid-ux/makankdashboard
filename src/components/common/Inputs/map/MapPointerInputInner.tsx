"use strict";
import { useEffect, useMemo, useRef, useState } from "react";
import { FeatureGroup, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";

import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import L, { LatLngLiteral } from "leaflet";
import { useTranslations } from "@/lib/i18n";

// ✅ Fix Leaflet marker icon issue in Next.js
if (typeof window !== "undefined") {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
  });
}

export type MapPointer = { lat: number; lng: number };

export type MapPointerInputProps = {
  name?: string;
  value?: MapPointer | null;
  onChange?: (point: MapPointer | null) => void;
  placeholder?: string;
  className?: string;
  defaultCenter?: LatLngLiteral;
  hideActions?: boolean;
  defaultZoom?: number;
};

type NominatimResult = { lat: string; lon: string };

function MapController({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

function useHtmlDarkClass() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setIsDark(el.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return isDark;
}

export default function MapPointerInput({
  name,
  value,
  onChange,
  placeholder,
  hideActions = false,
  className,
  defaultCenter = { lat: 30.0444, lng: 31.2357 },
  defaultZoom = 12
}: MapPointerInputProps) {
  const mapRef = useRef<L.Map | null>(null);
  const fgRef = useRef<L.FeatureGroup | null>(null);
  const [ready, setReady] = useState(false);

  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [pickedLocation, setPickedLocation] = useState<LatLngLiteral | null>(null);

  const isDark = useHtmlDarkClass();
  const emit = (point: MapPointer | null) => onChange?.(point);

  const sanitizedCenter = useMemo(() => {
    const lat = Number(defaultCenter?.lat);
    const lng = Number(defaultCenter?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return { lat: 30.0444, lng: 31.2357 };
  }, [defaultCenter]);

  const clearAll = () => {
    fgRef.current?.clearLayers();
  };

  const markerToPoint = (marker: L.Marker): MapPointer => {
    const latlng = marker.getLatLng();
    return {
      lat: Number(latlng.lat.toFixed(6)),
      lng: Number(latlng.lng.toFixed(6))
    };
  };

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const fg = fgRef.current;
    if (!map || !fg) return;
    const t = setTimeout(() => {
      try {
        clearAll();

        if (!value) return;

        const lat = Number(value.lat);
        const lng = Number(value.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const marker = L.marker([lat, lng]);
        fg.addLayer(marker);
        map.setView({ lat, lng }, Math.max(defaultZoom, map.getZoom()));
      } catch (e) {
        console.error("Error drawing marker", e);
      }
    }, 100);

    return () => clearTimeout(t);
  }, [value, ready, defaultZoom]);

  const handleCreated = (e: any) => {
    clearAll();
    fgRef.current?.addLayer(e.layer);
    setPickedLocation(null);

    if (e.layerType === "marker" && e.layer instanceof L.Marker) {
      emit(markerToPoint(e.layer));
    } else {
      emit(null);
    }
  };

  const handleEdited = (e: any) => {
    let point: MapPointer | null = null;
    (e.layers as L.LayerGroup).eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Marker) point = markerToPoint(layer);
    });
    emit(point);
  };

  const handleDeleted = () => {
    emit(null);
  };

  const search = async () => {
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    setSearchError("");

    try {
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({ q, format: "json", limit: "1" }).toString();

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Search request failed");

      const data = (await res.json()) as NominatimResult[];
      if (!data?.length) {
        setSearchError("No results found.");
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const pos = { lat, lng };

      setPickedLocation(pos);
      mapRef.current?.setView(pos, 14);
    } catch {
      setSearchError("Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  };

  const tileUrl = useMemo(() => {
    const light = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    const dark = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    return isDark ? dark : light;
  }, [isDark]);

  const scope = "map-pointer-scope";

  return (
    <div className={className}>
      {!hideActions && (
        <div className="flex gap-2 mb-2.5">
          <Input
            name={name}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") void search();
            }}
            placeholder={placeholder || t("SearchPlacePlaceholder")}
            className="flex-1"
          />
          <Button onClick={() => void search()} disabled={searching} variant="outline">
            {searching ? t("Searching") : t("Search")}
          </Button>
        </div>
      )}

      {searchError && <div className="mb-2.5 text-destructive text-sm">{searchError}</div>}

      <Card className="p-0 overflow-hidden">
        <div className={`h-[420px] w-full ${scope}`}>
          <MapContainer
            key={tileUrl}
            {...({
              center: sanitizedCenter,
              zoom: defaultZoom,
              style: { height: "100%", width: "100%" }
            } as any)}
          >
            <MapController
              onMapReady={map => {
                mapRef.current = map;
                setReady(true);
              }}
            />
            <TileLayer url={tileUrl} />

            {pickedLocation && <Marker position={pickedLocation} />}

            {!hideActions ? (
              <FeatureGroup ref={fgRef}>
                <EditControl
                  position="topright"
                  onCreated={handleCreated}
                  onEdited={handleEdited}
                  onDeleted={handleDeleted}
                  draw={{
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: true,
                    polyline: false
                  }}
                  edit={{ edit: {}, remove: {} }}
                />
              </FeatureGroup>
            ) : (
              <FeatureGroup ref={fgRef} />
            )}
          </MapContainer>
        </div>
      </Card>
    </div>
  );
}
