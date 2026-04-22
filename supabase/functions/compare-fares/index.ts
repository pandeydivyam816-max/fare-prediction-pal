import { createClient } from "npm:@supabase/supabase-js@2.104.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.104.0/cors";
import { z } from "npm:zod@3.25.76";
import { buildQuotes, deriveRoute, predictFare } from "../_shared/fare-engine.ts";

const BodySchema = z.object({
  pickupLabel: z.string().trim().min(2).max(150),
  dropLabel: z.string().trim().min(2).max(150),
  pickupPlaceId: z.string().trim().max(255).nullish(),
  dropPlaceId: z.string().trim().max(255).nullish(),
  pickupLat: z.number().min(-90).max(90).nullish(),
  pickupLng: z.number().min(-180).max(180).nullish(),
  dropLat: z.number().min(-90).max(90).nullish(),
  dropLng: z.number().min(-180).max(180).nullish(),
  distanceKm: z.number().positive().max(300).optional(),
  durationMinutes: z.number().positive().max(600).optional(),
  timeOfDayBucket: z.enum(["dawn", "day", "evening", "night"]),
  trafficLevel: z.enum(["light", "moderate", "heavy", "gridlock"]),
  weatherCondition: z.enum(["clear", "cloudy", "rain", "storm"]),
  surgeMultiplier: z.number().min(1).max(5),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");
  const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_PUBLISHABLE_KEY) throw new Error("SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is not configured");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const [{ data: providers, error: providersError }, authResult] = await Promise.all([
    serviceClient.from("providers").select("id,name,slug,base_fare,price_per_km,price_per_minute,surge_multiplier_default,eta_bias_minutes").eq("is_active", true),
    userClient.auth.getUser(),
  ]);

  if (providersError) {
    return new Response(JSON.stringify({ error: providersError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const route = deriveRoute(parsed.data);
  const quotes = buildQuotes(parsed.data, route, providers ?? []);

  const userId = authResult.data.user?.id;
  let historyAverage: number | null = null;
  if (userId) {
    const { data: recentRides } = await serviceClient
      .from("rides")
      .select("actual_fare, quoted_fare")
      .eq("user_id", userId)
      .order("ride_date", { ascending: false })
      .limit(12);

    if (recentRides?.length) {
      const values = recentRides.map((ride) => ride.actual_fare ?? ride.quoted_fare).filter((value): value is number => value != null);
      if (values.length) historyAverage = values.reduce((sum, value) => sum + value, 0) / values.length;
    }
  }

  const prediction = predictFare(parsed.data, route, historyAverage);

  if (userId && quotes.length) {
    await serviceClient.from("fare_quotes").insert(
      quotes.map((quote) => ({
        user_id: userId,
        provider_id: quote.providerId,
        ride_type: quote.rideType,
        pickup_label: parsed.data.pickupLabel,
        pickup_place_id: parsed.data.pickupPlaceId ?? null,
        drop_label: parsed.data.dropLabel,
        drop_place_id: parsed.data.dropPlaceId ?? null,
        distance_km: route.distanceKm,
        duration_minutes: route.durationMinutes,
        time_of_day_bucket: parsed.data.timeOfDayBucket,
        traffic_level: parsed.data.trafficLevel,
        weather_condition: parsed.data.weatherCondition,
        surge_multiplier: parsed.data.surgeMultiplier,
        estimated_fare: quote.estimatedFare,
        eta_minutes: quote.etaMinutes,
        quote_expires_at: new Date(Date.now() + 1000 * 60 * 8).toISOString(),
      })),
    );
  }

  return new Response(
    JSON.stringify({
      route,
      quotes,
      predictedFare: prediction.predictedFare,
      savingsInsight: quotes.length > 1 ? `Switching from ${quotes[quotes.length - 1].providerName} to ${quotes[0].providerName} can save about ₹${quotes[quotes.length - 1].estimatedFare - quotes[0].estimatedFare}.` : "Run a comparison to unlock savings.",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
