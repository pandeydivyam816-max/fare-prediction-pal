import { Link } from "react-router-dom";
import { BarChart3, CarFront, ListOrdered, MapPin, Receipt, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPanel } from "@/components/ride-intel/MapPanel";
import { QuoteCard } from "@/components/ride-intel/QuoteCard";
import { useRideIntel, emptyStop } from "@/context/RideIntelContext";
import { useMemo } from "react";

export default function Compare() {
  const {
    request, setRequest, comparison, prediction, loading, locating, saving,
    itineraryRouteStops, bookedQuoteSlug,
    runAnalysis, handleUseCurrentLocation, resetSampleRoute,
    handleBookQuote, handleSaveTrip, handleSaveFavorite, handleSaveItinerary, handleBookItinerary,
    auth,
  } = useRideIntel();

  const stats = useMemo(() => [
    { label: "Providers tracked", value: comparison?.quotes.length ?? 3, icon: CarFront },
    { label: "Predicted fare", value: `₹${prediction?.predictedFare ?? comparison?.predictedFare ?? "--"}`, icon: BarChart3 },
    { label: "Traffic model", value: request.trafficLevel, icon: TimerReset },
    { label: "Stops in trip", value: itineraryRouteStops.length - 1, icon: ListOrdered },
  ], [comparison, prediction, request.trafficLevel, itineraryRouteStops.length]);

  const hasStops = itineraryRouteStops.length > 2;

  return (
    <>
      <section className="space-y-6 rounded-[calc(var(--radius)+8px)] border border-border/70 bg-panel/85 p-6 shadow-glow backdrop-blur-md">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full border border-border/70 bg-surface/80 px-3 py-1 text-xs text-muted-foreground">
            Compare fares
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Plan a route and compare provider quotes.</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Add stops, adjust traffic and weather, then get live fare comparisons across providers.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Pickup</label>
            <Input value={request.pickupLabel} onChange={(e) => setRequest((c) => ({ ...c, pickupLabel: e.target.value, pickupLat: null, pickupLng: null, pickupPlaceId: null }))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Drop</label>
            <Input value={request.dropLabel} onChange={(e) => setRequest((c) => ({ ...c, dropLabel: e.target.value, dropLat: null, dropLng: null, dropPlaceId: null }))} />
          </div>
          {(request.stops ?? []).map((stop, index) => (
            <div key={`stop-${index}`} className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted-foreground">Stop {index + 1}</label>
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setRequest((c) => ({ ...c, stops: (c.stops ?? []).filter((_, i) => i !== index) }))}>
                  Remove
                </button>
              </div>
              <Input value={stop.label} onChange={(e) => setRequest((c) => ({ ...c, stops: (c.stops ?? []).map((s, i) => i === index ? { ...s, label: e.target.value, lat: null, lng: null, placeId: null } : s) }))} placeholder="Add an intermediate stop" />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button type="button" variant="glass" onClick={() => setRequest((c) => ({ ...c, stops: [...(c.stops ?? []), emptyStop] }))}>
              <ListOrdered className="h-4 w-4" />
              Add stop
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Time of day</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={request.timeOfDayBucket} onChange={(e) => setRequest((c) => ({ ...c, timeOfDayBucket: e.target.value }))}>
              <option value="dawn">Dawn</option><option value="day">Day</option><option value="evening">Evening</option><option value="night">Night</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Traffic</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={request.trafficLevel} onChange={(e) => setRequest((c) => ({ ...c, trafficLevel: e.target.value }))}>
              <option value="light">Light</option><option value="moderate">Moderate</option><option value="heavy">Heavy</option><option value="gridlock">Gridlock</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Weather</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={request.weatherCondition} onChange={(e) => setRequest((c) => ({ ...c, weatherCondition: e.target.value }))}>
              <option value="clear">Clear</option><option value="cloudy">Cloudy</option><option value="rain">Rain</option><option value="storm">Storm</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Surge multiplier</label>
            <Input type="number" min="1" max="5" step="0.1" value={request.surgeMultiplier} onChange={(e) => setRequest((c) => ({ ...c, surgeMultiplier: Number(e.target.value) || 1 }))} />
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
          <Button type="button" variant="glass" onClick={resetSampleRoute}>Reset sample route</Button>
          <Button asChild type="button" variant="glass">
            <Link to="/bookings"><Receipt className="h-4 w-4" />Open bookings</Link>
          </Button>
        </div>
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
              Historical patterns, provider pricing, traffic, weather, and stops are blended into the estimate.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="text-sm text-muted-foreground">Best current fare</div>
                <div className="mt-1 text-2xl font-semibold">₹{comparison?.quotes[0]?.estimatedFare?.toFixed(0) ?? "--"}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="text-sm text-muted-foreground">Predicted band</div>
                <div className="mt-1 text-2xl font-semibold">₹{prediction?.lowRange ?? "--"}–₹{prediction?.highRange ?? "--"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Provider quotes</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="glass" size="sm" onClick={handleSaveTrip} disabled={saving || !comparison}>Save trip</Button>
            <Button type="button" variant="glass" size="sm" onClick={handleSaveFavorite} disabled={saving}>Save favorite</Button>
            {hasStops ? (
              <>
                <Button type="button" variant="glass" size="sm" onClick={handleSaveItinerary} disabled={saving}>Save itinerary</Button>
                <Button type="button" variant="hero" size="sm" onClick={handleBookItinerary} disabled={saving}>Book itinerary</Button>
              </>
            ) : null}
          </div>
        </div>
        {(comparison?.quotes ?? []).length === 0 ? (
          <Card className="border-dashed border-border/70 bg-surface/60 p-6 text-sm text-muted-foreground">
            Click "Compare fares" to load quotes for this route.
          </Card>
        ) : (
          <div className="grid gap-4">
            {comparison!.quotes.map((quote, index) => (
              <QuoteCard
                key={`${quote.providerSlug}-${quote.rideType}`}
                quote={quote}
                index={index}
                isBooked={bookedQuoteSlug === quote.providerSlug}
                canBook={auth.isAuthenticated}
                booking={saving}
                onBook={handleBookQuote}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
