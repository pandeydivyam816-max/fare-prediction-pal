import { forwardRef, useEffect, useMemo, useState } from "react";
import { APIProvider, AdvancedMarker, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { ArrowRight, KeyRound, MapPinned, Navigation, Route } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type LatLng = { lat: number; lng: number };

type DirectionsStep = {
  instruction: string;
  distance?: string;
  duration?: string;
};

type Props = {
  pickupLabel: string;
  dropLabel: string;
  polyline: LatLng[];
  distanceKm: number;
  durationMinutes: number;
};

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "AIzaSyD8ikvhsNf8xpkUNuA43--bnrJ6UGlN0eM";

/**
 * Computes the shortest driving route via Google Directions API and renders
 * it as a polyline on the map. Surfaces step-by-step instructions to the parent.
 */
function DirectionsLayer({
  waypoints,
  onRouteSummary,
}: {
  waypoints: LatLng[];
  onRouteSummary: (summary: { steps: DirectionsStep[]; distanceKm: number; durationMinutes: number } | null) => void;
}) {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const [renderer, setRenderer] = useState<any>(null);

  // Initialize the renderer once.
  useEffect(() => {
    if (!routesLibrary || !map) return;
    const r = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#7c3aed",
        strokeOpacity: 0.9,
        strokeWeight: 5,
      },
    });
    setRenderer(r);
    return () => {
      r.setMap(null);
    };
  }, [routesLibrary, map]);

  // Recompute route when waypoints change.
  useEffect(() => {
    if (!routesLibrary || !renderer || waypoints.length < 2) {
      onRouteSummary(null);
      return;
    }

    const service = new routesLibrary.DirectionsService();
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const middle = waypoints.slice(1, -1).map((p) => ({ location: p, stopover: true }));

    service
      .route({
        origin,
        destination,
        waypoints: middle,
        optimizeWaypoints: true,
        travelMode: "DRIVING" as any,
        provideRouteAlternatives: false,
      })
      .then((result) => {
        renderer.setDirections(result);
        const route = result.routes[0];
        if (!route) {
          onRouteSummary(null);
          return;
        }
        const totalMeters = route.legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0);
        const totalSeconds = route.legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0);
        const steps: DirectionsStep[] = route.legs.flatMap((leg) =>
          leg.steps.map((step) => ({
            instruction: stripHtml(step.instructions ?? ""),
            distance: step.distance?.text,
            duration: step.duration?.text,
          })),
        );
        onRouteSummary({
          steps,
          distanceKm: totalMeters / 1000,
          durationMinutes: totalSeconds / 60,
        });
      })
      .catch(() => onRouteSummary(null));
  }, [routesLibrary, renderer, waypoints, onRouteSummary]);

  return null;
}

const MapViewportSync = forwardRef<HTMLDivElement, { polyline: LatLng[] }>(({ polyline }, _ref) => {
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
});
MapViewportSync.displayName = "MapViewportSync";

export function MapPanel({ pickupLabel, dropLabel, polyline, distanceKm, durationMinutes }: Props) {
  const center = useMemo(() => polyline[0] ?? { lat: 28.6139, lng: 77.209 }, [polyline]);
  const [directions, setDirections] = useState<{ steps: DirectionsStep[]; distanceKm: number; durationMinutes: number } | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  const effectiveDistance = directions?.distanceKm ?? distanceKm;
  const effectiveDuration = directions?.durationMinutes ?? durationMinutes;

  return (
    <Card className="overflow-hidden border-border/70 bg-panel/90 shadow-panel backdrop-blur-md">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPinned className="h-5 w-5 text-primary" />
          Route map & directions
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Shortest driving route with turn-by-turn directions across all stops.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-6">
        {googleMapsApiKey ? (
          <>
            <div className="overflow-hidden rounded-lg border border-border/70">
              <APIProvider apiKey={googleMapsApiKey} libraries={["routes"]}>
                <Map
                  defaultCenter={center}
                  defaultZoom={11}
                  gestureHandling="greedy"
                  disableDefaultUI
                  mapId="ride-intel-map"
                  style={{ width: "100%", height: "280px" }}
                >
                  <MapViewportSync polyline={polyline} />
                  <DirectionsLayer waypoints={polyline} onRouteSummary={setDirections} />
                  {polyline.map((point, index) => (
                    <AdvancedMarker key={`${point.lat}-${point.lng}-${index}`} position={point}>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-panel text-panel-foreground shadow-panel">
                        {index === 0 ? (
                          <Navigation className="h-3.5 w-3.5 text-primary" />
                        ) : index === polyline.length - 1 ? (
                          <MapPinned className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <span className="text-[10px] font-semibold">{index}</span>
                        )}
                      </div>
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Route className="h-4 w-4 text-primary" />
                <span>
                  {effectiveDistance.toFixed(1)} km • {Math.round(effectiveDuration)} min
                </span>
              </div>
              {directions?.steps.length ? (
                <Button type="button" variant="glass" size="sm" onClick={() => setShowSteps((v) => !v)}>
                  {showSteps ? "Hide directions" : `Show ${directions.steps.length} steps`}
                </Button>
              ) : null}
            </div>

            {showSteps && directions?.steps.length ? (
              <ol className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-border/60 bg-surface/60 p-3 text-sm">
                {directions.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground">{step.instruction}</div>
                      {(step.distance || step.duration) && (
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <ArrowRight className="h-3 w-3" />
                          {step.distance}
                          {step.duration ? ` • ${step.duration}` : ""}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </>
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
                <div className="text-muted-foreground">
                  {distanceKm.toFixed(1)} km • {durationMinutes.toFixed(0)} min
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function stripHtml(html: string) {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, "");
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
