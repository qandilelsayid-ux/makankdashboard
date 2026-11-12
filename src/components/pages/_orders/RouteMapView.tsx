import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – CSS side-effect import handled by Next.js bundler
import "leaflet/dist/leaflet.css";

function makeIcon(color: "green" | "red") {
    const colors = {
        green: { bg: "#16a34a", border: "#14532d" },
        red: { bg: "#dc2626", border: "#7f1d1d" },
    };
    const { bg, border } = colors[color];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24S24 21 24 12C24 5.4 18.6 0 12 0z" fill="${bg}" stroke="${border}" stroke-width="1.5"/><circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/></svg>`;
    return L.divIcon({ html: svg, className: "", iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36] });
}

export type LatLng = { lat: number; lng: number };

interface MarkersProps {
    pickup?: LatLng | null;
    delivery?: LatLng | null;
    pickupLabel: string;
    deliveryLabel: string;
}

function Markers({ pickup, delivery, pickupLabel, deliveryLabel }: MarkersProps) {
    const map = useMap();

    useEffect(() => {
        const markers: L.Marker[] = [];

        if (pickup && typeof pickup.lat === "number" && typeof pickup.lng === "number") {
            const pickupMarker = L.marker([pickup.lat, pickup.lng], { icon: makeIcon("green") })
                .bindPopup(pickupLabel)
                .addTo(map);
            markers.push(pickupMarker);
        }

        if (delivery && typeof delivery.lat === "number" && typeof delivery.lng === "number") {
            const deliveryMarker = L.marker([delivery.lat, delivery.lng], { icon: makeIcon("red") })
                .bindPopup(deliveryLabel)
                .addTo(map);
            markers.push(deliveryMarker);
        }

        return () => {
            markers.forEach((marker) => {
                map.removeLayer(marker);
            });
        };
    }, [map, pickup, delivery, pickupLabel, deliveryLabel]);

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

interface RouteMapViewProps {
    pickup?: LatLng | null;
    delivery?: LatLng | null;
    pickupLabel?: string;
    deliveryLabel?: string;
    height?: string;
}

export default function RouteMapView({
    pickup,
    delivery,
    pickupLabel = "Pickup",
    deliveryLabel = "Delivery",
    height = "260px",
}: RouteMapViewProps) {
    const isDark = useHtmlDarkClass();

    const tileUrl = useMemo(
        () =>
            isDark
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        [isDark]
    );

    const hasValidPickup = typeof pickup?.lat === "number" && typeof pickup?.lng === "number";
    const hasValidDelivery = typeof delivery?.lat === "number" && typeof delivery?.lng === "number";

    const center: [number, number] = useMemo(() => {
        if (hasValidPickup && hasValidDelivery) {
            return [
                (pickup.lat + delivery.lat) / 2,
                (pickup.lng + delivery.lng) / 2,
            ];
        }
        if (hasValidPickup) {
            return [pickup.lat, pickup.lng];
        }
        if (hasValidDelivery) {
            return [delivery.lat, delivery.lng];
        }
        return [0, 0];
    }, [pickup, delivery, hasValidPickup, hasValidDelivery]);

    if (!hasValidPickup && !hasValidDelivery) {
        return (
            <div
                style={{ height, width: "100%" }}
                className="rounded-md overflow-hidden border flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 text-sm font-medium"
            >
                No route coordinates available
            </div>
        );
    }

    return (
        <div style={{ height, width: "100%" }} className="rounded-md overflow-hidden border">
            <MapContainer
                {...({
                    center,
                    zoom: 13,
                    style: { height: "100%", width: "100%" },
                    scrollWheelZoom: false,
                } as any)}
            >
                <TileLayer url={tileUrl} />
                <Markers
                    pickup={pickup}
                    delivery={delivery}
                    pickupLabel={pickupLabel}
                    deliveryLabel={deliveryLabel}
                />
            </MapContainer>
        </div>
    );
}

