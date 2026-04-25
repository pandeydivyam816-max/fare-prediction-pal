import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useRideIntelAuth } from "@/hooks/useRideIntelAuth";
import { geocodeAddress, getCurrentPosition, reverseGeocode } from "@/lib/google-maps";
import {
  bookItinerary,
  cancelRide,
  compareFares,
  fetchRideHistory,
  predictFare,
  saveFavoriteRoute,
  saveItinerary,
  saveRide,
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

export const emptyStop: RouteStop = { label: "", placeId: null, lat: null, lng: null };

type Ctx = {
  auth: ReturnType<typeof useRideIntelAuth>;
  request: CompareRequest;
  setRequest: React.Dispatch<React.SetStateAction<CompareRequest>>;
  comparison: CompareResponse | null;
  prediction: PredictResponse | null;
  rides: RideRecord[];
  favorites: FavoriteRoute[];
  itineraries: ItineraryRecord[];
  itineraryStops: ItineraryStopRecord[];
  receipts: BookingReceipt[];
  itineraryRouteStops: RouteStop[];
  loading: boolean;
  saving: boolean;
  locating: boolean;
  cancelingRideId: string | null;
  bookedQuoteSlug: string | null;
  selectedQuote: ComparisonQuote | null;
  bookingMode: "ride" | "itinerary";
  bookingDialogOpen: boolean;
  receiptDialogOpen: boolean;
  activeReceipts: BookingReceipt[];
  setBookingDialogOpen: (open: boolean) => void;
  setReceiptDialogOpen: (open: boolean) => void;
  runAnalysis: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  handleUseCurrentLocation: () => Promise<void>;
  handleSaveTrip: () => Promise<void>;
  handleSaveFavorite: () => Promise<void>;
  handleSaveItinerary: () => Promise<void>;
  handleBookQuote: (quote: ComparisonQuote) => void;
  handleBookItinerary: () => void;
  handleCancelRide: (rideId: string) => Promise<void>;
  finalizeBooking: (paymentMethod: PaymentMethodInput) => Promise<void>;
  resetSampleRoute: () => void;
};

const RideIntelContext = createContext<Ctx | null>(null);

export function RideIntelProvider({ children }: { children: ReactNode }) {
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
  const [cancelingRideId, setCancelingRideId] = useState<string | null>(null);

  const itineraryRouteStops = useMemo<RouteStop[]>(() => {
    const middleStops = (request.stops ?? []).filter((stop) => stop.label.trim().length > 0);
    return [
      { label: request.pickupLabel, placeId: request.pickupPlaceId ?? null, lat: request.pickupLat ?? null, lng: request.pickupLng ?? null },
      ...middleStops,
      { label: request.dropLabel, placeId: request.dropPlaceId ?? null, lat: request.dropLat ?? null, lng: request.dropLng ?? null },
    ];
  }, [request]);

  const refreshHistory = useCallback(async () => {
    if (!auth.isAuthenticated) return;
    const data = await fetchRideHistory();
    setRides(data?.rides ?? []);
    setFavorites(data?.favorites ?? []);
    setItineraries(data?.itineraries ?? []);
    setItineraryStops(data?.itineraryStops ?? []);
    setReceipts(data?.receipts ?? []);
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setRides([]); setFavorites([]); setItineraries([]); setItineraryStops([]); setReceipts([]); setBookedQuoteSlug(null);
      return;
    }
    refreshHistory().catch(() => undefined);
  }, [auth.isAuthenticated, refreshHistory]);

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
      normalized.stops[i] = { label: geocoded.formattedAddress, lat: geocoded.lat, lng: geocoded.lng, placeId: geocoded.placeId };
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

  const runAnalysis = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      const normalizedRequest = await normalizeRequest(request);
      setRequest(normalizedRequest);
      const [compareData, predictData] = await Promise.all([compareFares(normalizedRequest), predictFare(normalizedRequest)]);

      if (!compareData?.quotes?.length) {
        throw new Error("No provider quotes returned for this route.");
      }

      setComparison(compareData);
      setPrediction(predictData);
      toast.success(`Loaded ${compareData.quotes.length} provider quotes.`);
    } catch (error) {
      setComparison(null);
      setPrediction(null);
      toast.error(error instanceof Error ? error.message : "Unable to analyze route.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, request]);

  // Run initial analysis once auth resolves
  const [didInitialAnalysis, setDidInitialAnalysis] = useState(false);
  useEffect(() => {
    if (didInitialAnalysis || auth.loading || !auth.isAuthenticated) return;
    setDidInitialAnalysis(true);
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.isAuthenticated, didInitialAnalysis]);

  async function handleUseCurrentLocation() {
    try {
      setLocating(true);
      const coords = await getCurrentPosition();
      const place = await reverseGeocode(coords.lat, coords.lng);
      setRequest((curr) => ({ ...curr, pickupLabel: place.formattedAddress, pickupLat: coords.lat, pickupLng: coords.lng, pickupPlaceId: place.placeId }));
      toast.success("Pickup updated to your current location.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to fetch current location.");
    } finally {
      setLocating(false);
    }
  }

  async function handleSaveTrip() {
    if (!auth.user) { toast.error("Please sign in before saving a trip."); return; }
    if (!comparison) { toast.error("Run a fare comparison before saving this trip."); return; }
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
    } finally { setSaving(false); }
  }

  function handleBookQuote(quote: ComparisonQuote) {
    if (!auth.isAuthenticated) { toast.error("Please sign in before booking a ride."); return; }
    setSelectedQuote(quote);
    setBookingMode("ride");
    setBookingDialogOpen(true);
  }

  function handleBookItinerary() {
    if (!auth.isAuthenticated) { toast.error("Please sign in before booking an itinerary."); return; }
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
    } finally { setSaving(false); }
  }

  async function handleSaveFavorite() {
    if (!auth.user) { toast.error("Please sign in before saving a favorite route."); return; }
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
    } finally { setSaving(false); }
  }

  async function handleSaveItinerary() {
    if (!auth.user) { toast.error("Please sign in before saving an itinerary."); return; }
    if (!comparison) { toast.error("Run a fare comparison before saving an itinerary."); return; }
    if (itineraryRouteStops.length < 3) { toast.error("Add at least one intermediate stop to save an itinerary."); return; }
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
    } finally { setSaving(false); }
  }

  async function handleCancelRide(rideId: string) {
    if (!auth.user) { toast.error("Please sign in before canceling a ride."); return; }
    try {
      setCancelingRideId(rideId);
      await cancelRide(rideId);
      await refreshHistory();
      toast.success("Ride canceled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel ride.");
    } finally { setCancelingRideId(null); }
  }

  function resetSampleRoute() { setRequest(defaultRequest); }

  const value: Ctx = {
    auth, request, setRequest,
    comparison, prediction, rides, favorites, itineraries, itineraryStops, receipts,
    itineraryRouteStops,
    loading, saving, locating, cancelingRideId, bookedQuoteSlug,
    selectedQuote, bookingMode, bookingDialogOpen, receiptDialogOpen, activeReceipts,
    setBookingDialogOpen, setReceiptDialogOpen,
    runAnalysis, refreshHistory, handleUseCurrentLocation,
    handleSaveTrip, handleSaveFavorite, handleSaveItinerary,
    handleBookQuote, handleBookItinerary, handleCancelRide, finalizeBooking,
    resetSampleRoute,
  };

  return <RideIntelContext.Provider value={value}>{children}</RideIntelContext.Provider>;
}

export function useRideIntel() {
  const ctx = useContext(RideIntelContext);
  if (!ctx) throw new Error("useRideIntel must be used within RideIntelProvider");
  return ctx;
}
