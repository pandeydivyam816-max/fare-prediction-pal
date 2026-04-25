import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

async function invokeAuthed<T>(name: string, body: unknown) {
  // Ensure we have a valid, non-expired access token before calling the function.
  // If the stored session is stale (e.g. signed out elsewhere, refresh token revoked),
  // sign out locally and surface a clear error instead of sending a dead JWT.
  const { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;

  const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
  if (!session || expiresAt - Date.now() < 60_000) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session) {
      await supabase.auth.signOut().catch(() => undefined);
      throw new Error("Your session expired. Please sign in again.");
    }
    session = refreshed.session;
  }

  return supabase.functions.invoke<T>(name, {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}

export type RouteStop = {
  label: string;
  placeId?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type CompareRequest = {
  pickupLabel: string;
  dropLabel: string;
  pickupPlaceId?: string | null;
  dropPlaceId?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropLat?: number | null;
  dropLng?: number | null;
  distanceKm?: number;
  durationMinutes?: number;
  timeOfDayBucket: string;
  trafficLevel: string;
  weatherCondition: string;
  surgeMultiplier: number;
  stops?: RouteStop[];
};

export type ComparisonQuote = {
  providerId: string;
  providerName: string;
  providerSlug: string;
  rideType: string;
  estimatedFare: number;
  etaMinutes: number;
  confidence: number;
  explanation: string;
};

export type CompareResponse = {
  route: {
    distanceKm: number;
    durationMinutes: number;
    polyline: Array<{ lat: number; lng: number }>;
  };
  quotes: ComparisonQuote[];
  predictedFare: number;
  savingsInsight: string;
};

export type PredictResponse = {
  predictedFare: number;
  lowRange: number;
  highRange: number;
  trend: Array<{ label: string; actual: number; predicted: number }>;
  drivers: Array<{ label: string; impact: string }>;
};

export type RideRecord = Database["public"]["Tables"]["rides"]["Row"] & {
  booking_reference?: string | null;
  eta_minutes?: number | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  driver_vehicle?: string | null;
  driver_rating?: number | null;
  payment_method_type?: string | null;
  payment_method_last4?: string | null;
  payment_status?: string | null;
  booked_at?: string | null;
  completed_at?: string | null;
  canceled_at?: string | null;
  status_updated_at?: string | null;
  itinerary_id?: string | null;
  itinerary_leg_index?: number | null;
  itinerary_stop_count?: number;
};

export type FavoriteRoute = Database["public"]["Tables"]["favorite_routes"]["Row"];

export type ItineraryRecord = {
  id: string;
  user_id: string;
  label: string;
  payment_method_type?: string | null;
  payment_method_last4?: string | null;
  quoted_total_fare?: number | null;
  predicted_total_fare?: number | null;
  trip_status: string;
  booked_at?: string | null;
  completed_at?: string | null;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ItineraryStopRecord = {
  id: string;
  itinerary_id: string;
  user_id: string;
  stop_order: number;
  label: string;
  place_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  created_at: string;
  updated_at: string;
};

export type BookingReceipt = {
  id: string;
  user_id: string;
  ride_id: string;
  itinerary_id?: string | null;
  receipt_number: string;
  provider_name?: string | null;
  amount: number;
  currency: string;
  payment_method_type?: string | null;
  payment_method_last4?: string | null;
  receipt_status: string;
  receipt_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PaymentMethodInput = {
  methodType: "card" | "upi" | "wallet";
  providerLabel: string;
  holderName: string;
  last4: string;
};

export type RideDraft = Database["public"]["Tables"]["rides"]["Insert"] & {
  payment_method?: PaymentMethodInput;
  provider_name?: string;
};

export type ItineraryDraft = {
  user_id: string;
  itinerary_label: string;
  provider_id?: string | null;
  provider_name?: string | null;
  quoted_fare?: number | null;
  predicted_fare?: number | null;
  time_of_day_bucket: string;
  traffic_level: string;
  weather_condition: string;
  surge_multiplier: number;
  stops: RouteStop[];
  payment_method?: PaymentMethodInput;
};

export type HistoryResponse = {
  rides: RideRecord[];
  favorites: FavoriteRoute[];
  itineraries: ItineraryRecord[];
  itineraryStops: ItineraryStopRecord[];
  receipts: BookingReceipt[];
};

export async function compareFares(payload: CompareRequest) {
  const { data, error } = await supabase.functions.invoke<CompareResponse>("compare-fares", {
    body: payload,
  });

  if (error) throw error;
  return data;
}

export async function predictFare(payload: CompareRequest) {
  const { data, error } = await supabase.functions.invoke<PredictResponse>("predict-fare", {
    body: payload,
  });

  if (error) throw error;
  return data;
}

export async function fetchRideHistory() {
  const { data, error } = await supabase.functions.invoke<HistoryResponse>("ride-history", { body: { action: "list" } });

  if (error) throw error;
  return data;
}

export async function saveRide(payload: RideDraft) {
  const { data, error } = await supabase.functions.invoke<{ ride: RideRecord; receipt?: BookingReceipt }>("ride-history", {
    body: { action: "saveRide", payload },
  });

  if (error) throw error;
  return data;
}

export async function saveFavoriteRoute(payload: Database["public"]["Tables"]["favorite_routes"]["Insert"]) {
  const { data, error } = await supabase.functions.invoke("ride-history", {
    body: { action: "saveFavorite", payload },
  });

  if (error) throw error;
  return data;
}

export async function cancelRide(rideId: string) {
  const { data, error } = await supabase.functions.invoke<{ ride: RideRecord }>("ride-history", {
    body: { action: "cancelRide", payload: { ride_id: rideId } },
  });

  if (error) throw error;
  return data;
}

export async function saveItinerary(payload: ItineraryDraft) {
  const { data, error } = await supabase.functions.invoke<{
    itinerary: ItineraryRecord;
    rides: RideRecord[];
    itineraryStops: ItineraryStopRecord[];
  }>("ride-history", {
    body: { action: "saveItinerary", payload },
  });

  if (error) throw error;
  return data;
}

export async function bookItinerary(payload: ItineraryDraft & { payment_method: PaymentMethodInput }) {
  const { data, error } = await supabase.functions.invoke<{
    itinerary: ItineraryRecord;
    rides: RideRecord[];
    itineraryStops: ItineraryStopRecord[];
    receipts: BookingReceipt[];
  }>("ride-history", {
    body: { action: "bookItinerary", payload },
  });

  if (error) throw error;
  return data;
}
