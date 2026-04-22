import { useEffect, useMemo } from "react";
import { APIProvider, AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { MapPinned, Route, KeyRound, Navigation } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  pickupLabel: string;
  dropLabel: string;
  polyline: Array<{ lat: number; lng: number }>;
  distanceKm: number;
  durationMinutes: number;
};

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "AIzaSyD8ikvhsNf8xpkUNuA43--bnrJ6UGlN0eM";

function MapViewportSync({ polyline }: { polyline: Array<{ lat: number; lng: number }> }) {
  const map = useMap();

  useEffect(() => {
    const googleMaps = (window as any).google?.maps;
    if (!map || polyline.length === 0 || !googleMaps) return;

    if (polyline.length === 1) {
      map.panTo(polyline[0]);
      map.setZoom(14);
      return;
    }

    const bounds = new googleMaps.LatLngBounds();
    polyline.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 56);
  }, [map, polyline]);

  return null;
}

export function MapPanel({ pickupLabel, dropLabel, polyline, distanceKm, durationMinutes }: Props) {
  const center = useMemo(() => polyline[0] ?? { lat: 28.6139, lng: 77.209 }, [polyline]);

  return (
    <Card className="overflow-hidden border-border/70 bg-panel/90 shadow-panel backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPinned className="h-5 w-5 text-primary" />
          Route map
        </CardTitle>
        <CardDescription>Map preview updates across your full itinerary, including intermediate stops.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {googleMapsApiKey ? (
          <div className="overflow-hidden rounded-lg border border-border/70">
            <APIProvider apiKey={googleMapsApiKey}>
              <Map
                defaultCenter={center}
                center={center}
                defaultZoom={11}
                gestureHandling="greedy"
                disableDefaultUI
                mapId="ride-intel-map"
                style={{ width: "100%", height: "320px" }}
              >
                <MapViewportSync polyline={polyline} />
                {polyline.map((point, index) => (
                  <AdvancedMarker key={`${point.lat}-${point.lng}-${index}`} position={point}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-panel text-panel-foreground shadow-panel">
                      {index === 0 ? <Navigation className="h-3.5 w-3.5 text-primary" /> : index === polyline.length - 1 ? <MapPinned className="h-3.5 w-3.5 text-accent" /> : <span className="text-[10px] font-semibold">{index}</span>}
                    </div>
                  </AdvancedMarker>
                ))}
              </Map>
            </APIProvider>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg border border-dashed border-border/70 bg-surface/75 p-5">
            <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,hsl(var(--surface))_25%,hsl(var(--primary)/0.10)_50%,hsl(var(--surface))_75%)] bg-[length:200%_100%] opacity-60" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <KeyRound className="h-4 w-4 text-warning" />
                Add a browser-safe <span className="font-medium text-foreground">VITE_GOOGLE_MAPS_API_KEY</span> to render the live map.
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border/70 bg-background/50 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Pickup</div>
                  <div className="mt-1 text-sm font-medium">{pickupLabel || "Enter a pickup"}</div>
                </div>
                <div className="rounded-md border border-border/70 bg-background/50 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Drop</div>
                  <div className="mt-1 text-sm font-medium">{dropLabel || "Enter a destination"}</div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/70 bg-background/50 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  <span>Route estimate</span>
                </div>
                <div className="text-muted-foreground">{distanceKm.toFixed(1)} km • {durationMinutes.toFixed(0)} min</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
