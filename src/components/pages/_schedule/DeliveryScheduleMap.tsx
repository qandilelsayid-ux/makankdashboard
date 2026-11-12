import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngLiteral } from "leaflet";
import { Card } from "@/components/ui/card";
import { useTranslations } from "@/lib/i18n";
import { Clock, Navigation } from "lucide-react";

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

export type ScheduleEntry = {
  id: number;
  day: string;
  openingTime: string;
  closingTime: string;
  requiredLat: number | null;
  requiredLng: number | null;
  requiredRadius: number | null;
};

interface DeliveryScheduleMapProps {
  schedules: ScheduleEntry[];
  activeScheduleId?: number | null;
  onScheduleClick?: (id: number) => void;
  className?: string;
}

function MapController({ center, zoom }: { center: LatLngLiteral; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
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

export default function DeliveryScheduleMap({
  schedules,
  activeScheduleId,
  onScheduleClick,
  className
}: DeliveryScheduleMapProps) {
  const t = useTranslations();
  const isDark = useHtmlDarkClass();
  const [mapReady, setMapReady] = useState(false);

  const activeSchedule = useMemo(() => 
    schedules.find(s => s.id === activeScheduleId) || schedules.find(s => !!(s.requiredLat && s.requiredLng)),
  [activeScheduleId, schedules]);

  const defaultCenter = useMemo(() => {
    if (activeSchedule?.requiredLat && activeSchedule?.requiredLng) {
      return { lat: Number(activeSchedule.requiredLat), lng: Number(activeSchedule.requiredLng) };
    }
    return { lat: 30.0444, lng: 31.2357 }; // Cairo
  }, [activeSchedule]);

  const tileUrl = useMemo(() => {
    const light = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    const dark = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    return isDark ? dark : light;
  }, [isDark]);

  const scope = "delivery-schedule-map-scope";

  return (
    <Card className={`overflow-hidden border-none shadow-xl ${className}`}>
      <div className={`h-full w-full ${scope}`}>
        <MapContainer
          {...({
            center: defaultCenter,
            zoom: 13,
            scrollWheelZoom: true,
            style: { height: "100%", width: "100%" }
          } as any)}
          whenReady={() => setMapReady(true)}
        >
          <TileLayer 
            url={tileUrl}
            {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any)}
          />
          
          {mapReady && (
            <MapController 
              center={defaultCenter} 
              zoom={activeSchedule?.requiredRadius ? 17 : 13} 
            />
          )}

          {schedules.map((schedule) => {
            if (!schedule.requiredLat || !schedule.requiredLng) return null;

            const isActive = schedule.id === activeScheduleId;
            const pos: LatLngLiteral = { lat: Number(schedule.requiredLat), lng: Number(schedule.requiredLng) };

            return (
              <div key={schedule.id}>
                <Marker 
                  position={pos}
                  eventHandlers={{
                    click: () => onScheduleClick?.(schedule.id),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[150px]">
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-border/50">
                        <p className="font-bold text-primary capitalize">{t(schedule.day)}</p>
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{schedule.openingTime} - {schedule.closingTime}</span>
                        </div>
                        {schedule.requiredRadius && (
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{t("Radius")}: {schedule.requiredRadius}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {isActive && schedule.requiredRadius && (
                  <Circle
                    center={pos}
                    {...({ radius: Number(schedule.requiredRadius) } as any)}
                    pathOptions={{
                      fillColor: 'hsl(var(--primary))',
                      fillOpacity: 0.15,
                      color: 'hsl(var(--primary))',
                      weight: 2,
                      dashArray: '8, 12'
                    }}
                  />
                )}
              </div>
            );
          })}
        </MapContainer>

        <style jsx global>{`
          .${scope} .leaflet-container {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
            border-radius: var(--radius);
          }
          .dark .${scope} .leaflet-marker-icon {
            filter: hue-rotate(140deg) brightness(1.2);
          }
          .${scope} .leaflet-popup-content-wrapper {
            background: hsl(var(--popover));
            color: hsl(var(--popover-foreground));
            border: 1px solid hsl(var(--border));
            border-radius: var(--radius);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
          .${scope} .leaflet-popup-tip {
            background: hsl(var(--popover));
          }
          .${scope} .leaflet-popup-content {
            margin: 0;
          }
        `}</style>
      </div>
    </Card>
  );
}
