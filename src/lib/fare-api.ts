import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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
  const { data, error } = await supabase.functions.invoke<{
    rides: Array<Database["public"]["Tables"]["rides"]["Row"]>;
    favorites: Array<Database["public"]["Tables"]["favorite_routes"]["Row"]>;
  }>("ride-history", { body: { action: "list" } });

  if (error) throw error;
  return data;
}

export async function saveRide(payload: Database["public"]["Tables"]["rides"]["Insert"]) {
  const { data, error } = await supabase.functions.invoke("ride-history", {
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
