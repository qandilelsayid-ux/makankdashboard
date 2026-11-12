import { useEffect, useMemo, useRef, useState } from "react";
import {
  FeatureGroup,
  MapContainer,
  Marker,
  TileLayer,
  useMap
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";

import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";

import L, { LatLngLiteral } from "leaflet";
import { useTranslations } from "@/lib/i18n";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type ZonePoint = { lat: number; lng: number };

export type MapZoneInputProps = {
  name?: string;
  value?: ZonePoint[];
  onChange?: (points: ZonePoint[]) => void;
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

export default function MapZoneInput({
  name,
  value,
  onChange,
  placeholder,
  hideActions = false,
  className,
  defaultCenter = { lat: 30.0444, lng: 31.2357 },
  defaultZoom = 12
}: MapZoneInputProps) {
  const mapRef = useRef<L.Map | null>(null);
  const fgRef = useRef<L.FeatureGroup | null>(null);
  const [ready, setReady] = useState(false);

  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // ✅ This is the “location icon” you’re missing
  const [pickedLocation, setPickedLocation] = useState<LatLngLiteral | null>(
    null
  );

  const isDark = useHtmlDarkClass();
  const emit = (points: ZonePoint[]) => onChange?.(points);

  const sanitizedCenter = useMemo(() => {
    const lat = Number(defaultCenter?.lat);
    const lng = Number(defaultCenter?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return { lat: 30.0444, lng: 31.2357 };
  }, [defaultCenter]);

  // Define icons for light and dark modes
  // const markerIcon = L.icon({
  //   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  //   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  //   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  //   iconSize: [25, 41],
  //   iconAnchor: [12, 41],
  //   popupAnchor: [1, -34],
  //   shadowSize: [41, 41]
  // });

  const clearAll = () => {
    fgRef.current?.clearLayers();
  };

  const polygonToPoints = (layer: L.Polygon): ZonePoint[] => {
    const latlngs = layer.getLatLngs() as L.LatLng[] | L.LatLng[][] | L.LatLng[][][];
    const ring =
      Array.isArray(latlngs) && Array.isArray((latlngs as any)[0])
        ? (latlngs as L.LatLng[][])[0]
        : (latlngs as L.LatLng[]);

    return (ring || []).map(p => ({
      lat: Number(p.lat.toFixed(6)),
      lng: Number(p.lng.toFixed(6))
    }));
  };

  useEffect(() => {
    if (!ready) return;

    const map = mapRef.current;
    const fg = fgRef.current;
    if (!map || !fg) return;

    const timer = setTimeout(() => {
      try {
        clearAll();

        if (!value || value.length < 3) return;

        const latlngs: [number, number][] = value
          .map(p => [Number(p.lat), Number(p.lng)] as [number, number])
          .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

        if (latlngs.length < 3) return;

        const polygon = L.polygon(latlngs);
        fg.addLayer(polygon);

        const b = polygon.getBounds();
        if (b.isValid()) map.fitBounds(b, { padding: [20, 20] });
      } catch (e) {
        console.error("Error drawing polygon", e);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [value, ready]);

  const handleCreated = (e: any) => {
    clearAll();
    fgRef.current?.addLayer(e.layer);

    if (e.layerType === "polygon" && e.layer instanceof L.Polygon) {
      emit(polygonToPoints(e.layer));
    } else {
      emit([]);
    }
  };

  const handleEdited = (e: any) => {
    let points: ZonePoint[] = [];
    (e.layers as L.LayerGroup).eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Polygon) points = polygonToPoints(layer);
    });
    emit(points);
  };

  const handleDeleted = () => emit([]);

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

      // ✅ set marker position
      setPickedLocation(pos);

      // ✅ move map to it
      mapRef.current?.setView(pos, 14);
    } catch {
      setSearchError("Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  };

  // Optional: switch tiles in dark mode (remove if you want OSM always)
  const tileUrl = useMemo(() => {
    const light = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    const dark = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    return isDark ? dark : light;
  }, [isDark]);

  const scope = "map-zone-scope";

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
            placeholder={placeholder || "Search a place (e.g., Zamalek, Cairo)"}
            className="flex-1"
          />
          <Button onClick={() => void search()} disabled={searching} variant="outline">
            {searching ? t("Searching") : t("Search")}
          </Button>
        </div>
      )}

      {searchError ? <div className="mb-2.5 text-destructive text-sm">{searchError}</div> : null}

      <Card className="p-0 overflow-hidden">
        <div className={`h-[420px] w-full ${scope}`}>
          <MapContainer
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

            {/* ✅ The missing “location icon” */}
            {pickedLocation ? <Marker position={pickedLocation} /> : null}

            {!hideActions ? (
              <FeatureGroup ref={fgRef}>
                <EditControl
                  position="topright"
                  onCreated={handleCreated}
                  onEdited={handleEdited}
                  onDeleted={handleDeleted}
                  draw={{
                    polygon: true,
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                    polyline: false
                  }}
                  edit={{ edit: {}, remove: {} }}
                />
              </FeatureGroup>
            ) : (
              <FeatureGroup ref={fgRef} />
            )}
          </MapContainer>

          {/* Leaflet theme overrides kept inside component */}
          <style jsx global>{`
            .${scope} .leaflet-container {
              background-color: hsl(var(--background));
              color: hsl(var(--foreground));
            }

            .${scope} .leaflet-control,
            .${scope} .leaflet-bar {
              background-color: hsl(var(--card));
              border: 1px solid hsl(var(--border));
              box-shadow: 0 1px 8px hsl(var(--foreground) / 0.08);
            }

            .${scope} .leaflet-bar a,
            .${scope} .leaflet-draw-toolbar a {
              background-color: hsl(var(--card)) !important;
              color: hsl(var(--foreground));
              border-bottom: 1px solid hsl(var(--border));
            }

            .${scope} .leaflet-bar a:hover,
            .${scope} .leaflet-draw-toolbar a:hover {
              background-color: hsl(var(--muted)) !important;
            }

            .${scope} .leaflet-bar a:focus {
              outline: none;
              box-shadow: 0 0 0 2px hsl(var(--ring) / 0.35);
            }

            .${scope} .leaflet-draw-tooltip {
              background-color: hsl(var(--popover));
              color: hsl(var(--popover-foreground));
              border: 1px solid hsl(var(--border));
              box-shadow: 0 8px 30px hsl(var(--foreground) / 0.12);
            }

            .${scope} .leaflet-draw-actions a {
              background-color: hsl(var(--card));
              color: hsl(var(--foreground));
              border: 1px solid hsl(var(--border));
            }

            .${scope} .leaflet-popup-content-wrapper,
            .${scope} .leaflet-popup-tip {
              background-color: hsl(var(--popover));
              color: hsl(var(--popover-foreground));
              border: 1px solid hsl(var(--border));
            }

            .${scope} .leaflet-control-attribution {
              background-color: hsl(var(--card) / 0.85);
              color: hsl(var(--muted-foreground));
              border: 1px solid hsl(var(--border));
            }

            /* Dark mode adjustments for draw toolbar icons */
            .dark .${scope} .leaflet-draw-toolbar a {
              filter: invert(1);
            }

            /* Fix for missing leaflet-draw icons */
            .${scope} .leaflet-draw-toolbar a {
              background-image: url('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/images/spritesheet.png');
              background-repeat: no-repeat;
              background-size: 300px 30px;
            }

            .leaflet-retina .${scope} .leaflet-draw-toolbar a {
              background-image: url('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/images/spritesheet-2x.png');
            }

            /* Dark mode adjustments for marker icons */
            .dark .${scope} .leaflet-marker-icon {
              filter: invert(1) brightness(1.5);
            }
          `}</style>
        </div>
      </Card>
    </div>
  );
}
