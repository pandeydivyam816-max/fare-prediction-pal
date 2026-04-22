import { useEffect, useMemo, useState } from "react";
import { BarChart3, CarFront, CloudRain, MapPin, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { AuthPanel } from "@/components/ride-intel/AuthPanel";
import { MapPanel } from "@/components/ride-intel/MapPanel";
import { ResultsDashboard } from "@/components/ride-intel/ResultsDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRideIntelAuth } from "@/hooks/useRideIntelAuth";
import { geocodeAddress, getCurrentPosition, reverseGeocode } from "@/lib/google-maps";
import {
  compareFares,
  fetchRideHistory,
  predictFare,
  saveFavoriteRoute,
  saveRide,
  type ComparisonQuote,
  type CompareRequest,
  type CompareResponse,
  type PredictResponse,
} from "@/lib/fare-api";

const defaultRequest: CompareRequest = {
  pickupLabel: "Connaught Place, New Delhi",
  dropLabel: "Cyber Hub, Gurugram",
  pickupLat: 28.6315,
  pickupLng: 77.2167,
  dropLat: 28.4959,
  dropLng: 77.0884,
  timeOfDayBucket: "evening",
  trafficLevel: "heavy",
  weatherCondition: "clear",
  surgeMultiplier: 1.3,
};

const Index = () => {
  const auth = useRideIntelAuth();
  const [request, setRequest] = useState<CompareRequest>(defaultRequest);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [bookedQuoteSlug, setBookedQuoteSlug] = useState<string | null>(null);

  function updateLocationField(field: "pickup" | "drop", value: string) {
    setRequest((curr) => ({
      ...curr,
      [`${field}Label`]: value,
      [`${field}Lat`]: null,
      [`${field}Lng`]: null,
      [`${field}PlaceId`]: null,
    }));
  }

  const stats = useMemo(
    () => [
      { label: "Providers tracked", value: comparison?.quotes.length ?? 3, icon: CarFront },
      { label: "Predicted fare", value: `₹${prediction?.predictedFare ?? comparison?.predictedFare ?? "--"}`, icon: BarChart3 },
      { label: "Traffic model", value: request.trafficLevel, icon: TimerReset },
      { label: "Weather", value: request.weatherCondition, icon: CloudRain },
    ],
    [comparison?.predictedFare, comparison?.quotes.length, prediction?.predictedFare, request.trafficLevel, request.weatherCondition],
  );

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    fetchRideHistory()
      .then((data) => {
        setRides(data?.rides ?? []);
        setFavorites(data?.favorites ?? []);
      })
      .catch(() => undefined);
  }, [auth.isAuthenticated]);

  async function runAnalysis() {
    try {
      setLoading(true);
      const normalizedRequest = { ...request };

      if (normalizedRequest.pickupLabel.trim()) {
        const pickup = await geocodeAddress(normalizedRequest.pickupLabel.trim());
        normalizedRequest.pickupLabel = pickup.formattedAddress;
        normalizedRequest.pickupLat = pickup.lat;
        normalizedRequest.pickupLng = pickup.lng;
        normalizedRequest.pickupPlaceId = pickup.placeId;
      }

      if (normalizedRequest.dropLabel.trim()) {
        const drop = await geocodeAddress(normalizedRequest.dropLabel.trim());
        normalizedRequest.dropLabel = drop.formattedAddress;
        normalizedRequest.dropLat = drop.lat;
        normalizedRequest.dropLng = drop.lng;
        normalizedRequest.dropPlaceId = drop.placeId;
      }

      setRequest(normalizedRequest);

      const [compareData, predictData] = await Promise.all([compareFares(normalizedRequest), predictFare(normalizedRequest)]);
      setComparison(compareData);
      setPrediction(predictData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to analyze route.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runAnalysis();
  }, []);

  async function handleUseCurrentLocation() {
    try {
      setLocating(true);
      const coords = await getCurrentPosition();
      const place = await reverseGeocode(coords.lat, coords.lng);
      setRequest((curr) => ({
        ...curr,
        pickupLabel: place.formattedAddress,
        pickupLat: coords.lat,
        pickupLng: coords.lng,
        pickupPlaceId: place.placeId,
      }));
      toast.success("Pickup updated to your current location.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to fetch current location.");
    } finally {
      setLocating(false);
    }
  }

  async function handleSaveTrip() {
    if (!auth.user || !comparison) return;
    try {
      setSaving(true);
      await saveRide({
        user_id: auth.user.id,
        provider_id: comparison.quotes[0]?.providerId ?? null,
        pickup_label: request.pickupLabel,
        pickup_place_id: request.pickupPlaceId ?? null,
        pickup_lat: request.pickupLat ?? null,
        pickup_lng: request.pickupLng ?? null,
        drop_label: request.dropLabel,
        drop_place_id: request.dropPlaceId ?? null,
        drop_lat: request.dropLat ?? null,
        drop_lng: request.dropLng ?? null,
        distance_km: comparison.route.distanceKm,
        duration_minutes: comparison.route.durationMinutes,
        time_of_day_bucket: request.timeOfDayBucket,
        traffic_level: request.trafficLevel,
        weather_condition: request.weatherCondition,
        surge_multiplier: request.surgeMultiplier,
        quoted_fare: comparison.quotes[0]?.estimatedFare ?? null,
        predicted_fare: prediction?.predictedFare ?? comparison.predictedFare,
        actual_fare: null,
        trip_status: "planned",
        ride_date: new Date().toISOString(),
      });
      const latest = await fetchRideHistory();
      setRides(latest?.rides ?? []);
      toast.success("Trip insight saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }

  async function handleBookQuote(quote: ComparisonQuote) {
    if (!auth.user || !comparison) return;
    try {
      setSaving(true);
      await saveRide({
        user_id: auth.user.id,
        provider_id: quote.providerId,
        pickup_label: request.pickupLabel,
        pickup_place_id: request.pickupPlaceId ?? null,
        pickup_lat: request.pickupLat ?? null,
        pickup_lng: request.pickupLng ?? null,
        drop_label: request.dropLabel,
        drop_place_id: request.dropPlaceId ?? null,
        drop_lat: request.dropLat ?? null,
        drop_lng: request.dropLng ?? null,
        distance_km: comparison.route.distanceKm,
        duration_minutes: comparison.route.durationMinutes,
        time_of_day_bucket: request.timeOfDayBucket,
        traffic_level: request.trafficLevel,
        weather_condition: request.weatherCondition,
        surge_multiplier: request.surgeMultiplier,
        quoted_fare: quote.estimatedFare,
        predicted_fare: prediction?.predictedFare ?? comparison.predictedFare,
        actual_fare: null,
        trip_status: "booked",
        ride_date: new Date().toISOString(),
      });
      const latest = await fetchRideHistory();
      setRides(latest?.rides ?? []);
      setBookedQuoteSlug(quote.providerSlug);
      toast.success(`${quote.providerName} booked for this route.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to book ride.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFavorite() {
    if (!auth.user) return;
    try {
      setSaving(true);
      await saveFavoriteRoute({
        user_id: auth.user.id,
        label: `${request.pickupLabel.split(",")[0]} → ${request.dropLabel.split(",")[0]}`,
        pickup_label: request.pickupLabel,
        pickup_place_id: request.pickupPlaceId ?? null,
        pickup_lat: request.pickupLat ?? null,
        pickup_lng: request.pickupLng ?? null,
        drop_label: request.dropLabel,
        drop_place_id: request.dropPlaceId ?? null,
        drop_lat: request.dropLat ?? null,
        drop_lng: request.dropLng ?? null,
      });
      const latest = await fetchRideHistory();
      setFavorites(latest?.favorites ?? []);
      toast.success("Favorite route saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save route.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1.35fr,0.85fr]">
          <div className="space-y-6 rounded-[calc(var(--radius)+8px)] border border-border/70 bg-panel/85 p-6 shadow-glow backdrop-blur-md">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-border/70 bg-surface/80 px-3 py-1 text-xs text-muted-foreground">
                Ride fare intelligence
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Compare fares, predict costs, and time your ride smarter.</h1>
                <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                  A map-first trip planner for real-time provider comparison, personalized prediction bands, and route memory.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Pickup</label>
                <Input value={request.pickupLabel} onChange={(e) => updateLocationField("pickup", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Drop</label>
                <Input value={request.dropLabel} onChange={(e) => updateLocationField("drop", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Time of day</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={request.timeOfDayBucket} onChange={(e) => setRequest((curr) => ({ ...curr, timeOfDayBucket: e.target.value }))}>
                  <option value="dawn">Dawn</option>
                  <option value="day">Day</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Traffic</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={request.trafficLevel} onChange={(e) => setRequest((curr) => ({ ...curr, trafficLevel: e.target.value }))}>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                  <option value="gridlock">Gridlock</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Weather</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={request.weatherCondition} onChange={(e) => setRequest((curr) => ({ ...curr, weatherCondition: e.target.value }))}>
                  <option value="clear">Clear</option>
                  <option value="cloudy">Cloudy</option>
                  <option value="rain">Rain</option>
                  <option value="storm">Storm</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Surge multiplier</label>
                <Input type="number" min="1" max="5" step="0.1" value={request.surgeMultiplier} onChange={(e) => setRequest((curr) => ({ ...curr, surgeMultiplier: Number(e.target.value) || 1 }))} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="hero" onClick={runAnalysis} disabled={loading}>
                <MapPin className="h-4 w-4" />
                {loading ? "Analyzing route..." : "Compare fares"}
              </Button>
              <Button type="button" variant="glass" onClick={handleUseCurrentLocation} disabled={locating || loading}>
                <MapPin className="h-4 w-4" />
                {locating ? "Finding location..." : "Use current location"}
              </Button>
              <Button type="button" variant="glass" onClick={() => setRequest(defaultRequest)}>
                Reset sample route
              </Button>
            </div>
          </div>

          <AuthPanel isAuthenticated={auth.isAuthenticated} loading={auth.loading} profile={auth.profile} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label} className="border-border/70 bg-panel/90 shadow-panel">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                  <div className="text-xl font-semibold capitalize">{item.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <MapPanel
            pickupLabel={request.pickupLabel}
            dropLabel={request.dropLabel}
            polyline={comparison?.route.polyline ?? []}
            distanceKm={comparison?.route.distanceKm ?? 0}
            durationMinutes={comparison?.route.durationMinutes ?? 0}
          />

          <Card className="border-border/70 bg-panel/90 shadow-panel">
            <CardHeader>
              <CardTitle className="text-lg">Live route signal</CardTitle>
              <CardDescription>{comparison?.savingsInsight ?? "Run a comparison to see savings and ETA shifts."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-surface/70 p-4 text-sm text-muted-foreground">
                Historical ride patterns, provider pricing defaults, traffic state, and weather pressure are blended into the estimate.
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                  <div className="text-sm text-muted-foreground">Best current fare</div>
                  <div className="mt-1 text-2xl font-semibold">₹{comparison?.quotes[0]?.estimatedFare?.toFixed(0) ?? "--"}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                  <div className="text-sm text-muted-foreground">Predicted fare band</div>
                  <div className="mt-1 text-2xl font-semibold">₹{prediction?.lowRange ?? "--"}–₹{prediction?.highRange ?? "--"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <ResultsDashboard
          quotes={comparison?.quotes ?? []}
          prediction={prediction}
          rides={rides}
          favorites={favorites}
          onSaveTrip={handleSaveTrip}
          onSaveFavorite={handleSaveFavorite}
          onBookQuote={handleBookQuote}
          saving={saving}
          canPersist={auth.isAuthenticated}
          bookedQuoteSlug={bookedQuoteSlug}
        />
      </div>
    </main>
  );
};

export default Index;
