import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, CarFront, CloudRain, ListOrdered, MapPin, Receipt, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { AuthPanel } from "@/components/ride-intel/AuthPanel";
import { BookingDialog } from "@/components/ride-intel/BookingDialog";
import { MapPanel } from "@/components/ride-intel/MapPanel";
import { ReceiptDialog } from "@/components/ride-intel/ReceiptDialog";
import { ResultsDashboard } from "@/components/ride-intel/ResultsDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRideIntelAuth } from "@/hooks/useRideIntelAuth";
import { geocodeAddress, getCurrentPosition, reverseGeocode } from "@/lib/google-maps";
import {
  bookItinerary,
  compareFares,
  fetchRideHistory,
  saveFavoriteRoute,
  saveItinerary,
  saveRide,
  predictFare,
  type BookingReceipt,
  type ComparisonQuote,
  type CompareRequest,
  type CompareResponse,
  type FavoriteRoute,
  type ItineraryRecord,
  type ItineraryStopRecord,
  type PaymentMethodInput,
  type PredictResponse,
  type RideRecord,
  type RouteStop,
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
  stops: [],
};

const emptyStop: RouteStop = { label: "", placeId: null, lat: null, lng: null };

const Index = () => {
  const auth = useRideIntelAuth();
  const [request, setRequest] = useState<CompareRequest>(defaultRequest);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [itineraries, setItineraries] = useState<ItineraryRecord[]>([]);
  const [itineraryStops, setItineraryStops] = useState<ItineraryStopRecord[]>([]);
  const [receipts, setReceipts] = useState<BookingReceipt[]>([]);
  const [bookedQuoteSlug, setBookedQuoteSlug] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<ComparisonQuote | null>(null);
  const [bookingMode, setBookingMode] = useState<"ride" | "itinerary">("ride");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [activeReceipts, setActiveReceipts] = useState<BookingReceipt[]>([]);

  const itineraryRouteStops = useMemo<RouteStop[]>(() => {
    const middleStops = (request.stops ?? []).filter((stop) => stop.label.trim().length > 0);
    return [
      { label: request.pickupLabel, placeId: request.pickupPlaceId ?? null, lat: request.pickupLat ?? null, lng: request.pickupLng ?? null },
      ...middleStops,
      { label: request.dropLabel, placeId: request.dropPlaceId ?? null, lat: request.dropLat ?? null, lng: request.dropLng ?? null },
    ];
  }, [request]);

  const stats = useMemo(
    () => [
      { label: "Providers tracked", value: comparison?.quotes.length ?? 3, icon: CarFront },
      { label: "Predicted fare", value: `₹${prediction?.predictedFare ?? comparison?.predictedFare ?? "--"}`, icon: BarChart3 },
      { label: "Traffic model", value: request.trafficLevel, icon: TimerReset },
      { label: "Stops in trip", value: itineraryRouteStops.length - 1, icon: ListOrdered },
    ],
    [comparison?.predictedFare, comparison?.quotes.length, itineraryRouteStops.length, prediction?.predictedFare, request.trafficLevel],
  );

  async function refreshHistory() {
    if (!auth.isAuthenticated) return;
    const data = await fetchRideHistory();
    setRides(data?.rides ?? []);
    setFavorites(data?.favorites ?? []);
    setItineraries(data?.itineraries ?? []);
    setItineraryStops(data?.itineraryStops ?? []);
    setReceipts(data?.receipts ?? []);
  }

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    refreshHistory().catch(() => undefined);
  }, [auth.isAuthenticated]);

  function updateLocationField(field: "pickup" | "drop", value: string) {
    setRequest((curr) => ({
      ...curr,
      [`${field}Label`]: value,
      [`${field}Lat`]: null,
      [`${field}Lng`]: null,
      [`${field}PlaceId`]: null,
    }));
  }

  function updateStop(index: number, value: string) {
    setRequest((curr) => ({
      ...curr,
      stops: (curr.stops ?? []).map((stop, stopIndex) => stopIndex === index ? { ...stop, label: value, lat: null, lng: null, placeId: null } : stop),
    }));
  }

  async function normalizeRequest(input: CompareRequest) {
    const normalized = { ...input, stops: [...(input.stops ?? [])] };

    if (normalized.pickupLabel.trim()) {
      const pickup = await geocodeAddress(normalized.pickupLabel.trim());
      normalized.pickupLabel = pickup.formattedAddress;
      normalized.pickupLat = pickup.lat;
      normalized.pickupLng = pickup.lng;
      normalized.pickupPlaceId = pickup.placeId;
    }

    for (let i = 0; i < normalized.stops.length; i += 1) {
      const stop = normalized.stops[i];
      if (!stop.label.trim()) continue;
      const geocoded = await geocodeAddress(stop.label.trim());
      normalized.stops[i] = {
        label: geocoded.formattedAddress,
        lat: geocoded.lat,
        lng: geocoded.lng,
        placeId: geocoded.placeId,
      };
    }

    if (normalized.dropLabel.trim()) {
      const drop = await geocodeAddress(normalized.dropLabel.trim());
      normalized.dropLabel = drop.formattedAddress;
      normalized.dropLat = drop.lat;
      normalized.dropLng = drop.lng;
      normalized.dropPlaceId = drop.placeId;
    }

    return normalized;
  }

  async function runAnalysis() {
    try {
      setLoading(true);
      const normalizedRequest = await normalizeRequest(request);
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
        provider_name: comparison.quotes[0]?.providerName,
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
      await refreshHistory();
      toast.success("Trip insight saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }

  function handleBookQuote(quote: ComparisonQuote) {
    if (!auth.isAuthenticated) {
      toast.error("Please sign in before booking a ride.");
      return;
    }

    setSelectedQuote(quote);
    setBookingMode("ride");
    setBookingDialogOpen(true);
  }

  function handleBookItinerary() {
    if (!auth.isAuthenticated) {
      toast.error("Please sign in before booking an itinerary.");
      return;
    }

    if (!comparison?.quotes[0]) return;
    setSelectedQuote(comparison.quotes[0]);
    setBookingMode("itinerary");
    setBookingDialogOpen(true);
  }

  async function finalizeBooking(paymentMethod: PaymentMethodInput) {
    if (!auth.user || !comparison || !selectedQuote) return;
    try {
      setSaving(true);
      let nextReceipts: BookingReceipt[] = [];

      if (bookingMode === "itinerary" && itineraryRouteStops.length > 2) {
        const result = await bookItinerary({
          user_id: auth.user.id,
          itinerary_label: `${request.pickupLabel.split(",")[0]} itinerary`,
          provider_id: selectedQuote.providerId,
          provider_name: selectedQuote.providerName,
          quoted_fare: selectedQuote.estimatedFare * Math.max(itineraryRouteStops.length - 1, 1),
          predicted_fare: (prediction?.predictedFare ?? comparison.predictedFare) * Math.max(itineraryRouteStops.length - 1, 1),
          time_of_day_bucket: request.timeOfDayBucket,
          traffic_level: request.trafficLevel,
          weather_condition: request.weatherCondition,
          surge_multiplier: request.surgeMultiplier,
          stops: itineraryRouteStops,
          payment_method: paymentMethod,
        });
        nextReceipts = (result.receipts ?? []) as BookingReceipt[];
      } else {
        const result = await saveRide({
          user_id: auth.user.id,
          provider_id: selectedQuote.providerId,
          provider_name: selectedQuote.providerName,
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
          quoted_fare: selectedQuote.estimatedFare,
          predicted_fare: prediction?.predictedFare ?? comparison.predictedFare,
          actual_fare: null,
          trip_status: "booked",
          ride_date: new Date().toISOString(),
          payment_method: paymentMethod,
        });
        nextReceipts = result.receipt ? [result.receipt as BookingReceipt] : [];
      }

      await refreshHistory();
      setBookedQuoteSlug(selectedQuote.providerSlug);
      setBookingDialogOpen(false);
      setActiveReceipts(nextReceipts);
      setReceiptDialogOpen(nextReceipts.length > 0);
      toast.success(bookingMode === "itinerary" ? "Itinerary booked successfully." : `${selectedQuote.providerName} booked for this route.`);
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
      await refreshHistory();
      toast.success("Favorite route saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save route.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveItinerary() {
    if (!auth.user || !comparison || itineraryRouteStops.length < 3) return;
    try {
      setSaving(true);
      await saveItinerary({
        user_id: auth.user.id,
        itinerary_label: `${request.pickupLabel.split(",")[0]} itinerary`,
        provider_id: comparison.quotes[0]?.providerId ?? null,
        provider_name: comparison.quotes[0]?.providerName ?? null,
        quoted_fare: comparison.quotes[0]?.estimatedFare ? comparison.quotes[0].estimatedFare * (itineraryRouteStops.length - 1) : null,
        predicted_fare: (prediction?.predictedFare ?? comparison.predictedFare) * (itineraryRouteStops.length - 1),
        time_of_day_bucket: request.timeOfDayBucket,
        traffic_level: request.trafficLevel,
        weather_condition: request.weatherCondition,
        surge_multiplier: request.surgeMultiplier,
        stops: itineraryRouteStops,
      });
      await refreshHistory();
      toast.success("Itinerary saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save itinerary.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="grid gap-6 lg:grid-cols-[1.35fr,0.85fr]">
            <div className="space-y-6 rounded-[calc(var(--radius)+8px)] border border-border/70 bg-panel/85 p-6 shadow-glow backdrop-blur-md">
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border border-border/70 bg-surface/80 px-3 py-1 text-xs text-muted-foreground">
                  Ride fare intelligence
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Compare fares, predict costs, and book routes smarter.</h1>
                  <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                    Plan a single ride or multi-stop itinerary, save it, pay once, and track everything from bookings.
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
                {(request.stops ?? []).map((stop, index) => (
                  <div key={`stop-${index}`} className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm text-muted-foreground">Stop {index + 1}</label>
                      <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setRequest((curr) => ({ ...curr, stops: (curr.stops ?? []).filter((_, stopIndex) => stopIndex !== index) }))}>
                        Remove
                      </button>
                    </div>
                    <Input value={stop.label} onChange={(e) => updateStop(index, e.target.value)} placeholder="Add an intermediate stop" />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <Button type="button" variant="glass" onClick={() => setRequest((curr) => ({ ...curr, stops: [...(curr.stops ?? []), emptyStop] }))}>
                    <ListOrdered className="h-4 w-4" />
                    Add stop
                  </Button>
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
                <Button asChild type="button" variant="glass">
                  <Link to="/bookings">
                    <Receipt className="h-4 w-4" />
                    Open bookings
                  </Link>
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
            <MapPanel pickupLabel={request.pickupLabel} dropLabel={request.dropLabel} polyline={comparison?.route.polyline ?? []} distanceKm={comparison?.route.distanceKm ?? 0} durationMinutes={comparison?.route.durationMinutes ?? 0} />

            <Card className="border-border/70 bg-panel/90 shadow-panel">
              <CardHeader>
                <CardTitle className="text-lg">Live route signal</CardTitle>
                <CardDescription>{comparison?.savingsInsight ?? "Run a comparison to see savings and ETA shifts."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/60 bg-surface/70 p-4 text-sm text-muted-foreground">
                  Historical ride patterns, provider pricing defaults, traffic state, weather pressure, and itinerary stops are blended into the estimate.
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
                <div className="rounded-lg border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  {itineraryRouteStops.length > 2 ? `${itineraryRouteStops.length - 2} intermediate stop(s) added. One-click itinerary booking is available.` : "Add extra stops to save or book the whole itinerary in one click."}
                </div>
              </CardContent>
            </Card>
          </section>

          <ResultsDashboard
            quotes={comparison?.quotes ?? []}
            prediction={prediction}
            rides={rides}
            favorites={favorites}
            itineraryStops={itineraryRouteStops}
            onSaveTrip={handleSaveTrip}
            onSaveFavorite={handleSaveFavorite}
            onBookQuote={handleBookQuote}
            onSaveItinerary={handleSaveItinerary}
            onBookItinerary={handleBookItinerary}
            saving={saving}
            canPersist={auth.isAuthenticated}
            bookedQuoteSlug={bookedQuoteSlug}
          />
        </div>
      </main>

      <BookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} quote={selectedQuote} saving={saving} stops={itineraryRouteStops} onConfirm={finalizeBooking} />
      <ReceiptDialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen} receipts={activeReceipts} />
    </>
  );
};

export default Index;
