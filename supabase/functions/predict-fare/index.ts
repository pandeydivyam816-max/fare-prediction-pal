import { createClient } from "npm:@supabase/supabase-js@2.104.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.104.0/cors";
import { z } from "npm:zod@3.25.76";
import { buildTrend, deriveRoute, predictFare } from "../_shared/fare-engine.ts";

const BodySchema = z.object({
  pickupLabel: z.string().trim().min(2).max(150),
  dropLabel: z.string().trim().min(2).max(150),
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
  const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!SUPABASE_PUBLISHABLE_KEY) throw new Error("SUPABASE_PUBLISHABLE_KEY is not configured");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const route = deriveRoute(parsed.data);
  const userClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: userData } = await userClient.auth.getUser();
  let history: Array<{ actual_fare: number | null; quoted_fare: number | null }> = [];

  if (userData.user?.id) {
    const { data } = await serviceClient
      .from("rides")
      .select("actual_fare, quoted_fare")
      .eq("user_id", userData.user.id)
      .order("ride_date", { ascending: false })
      .limit(6);
    history = data ?? [];
  }

  const average = history.length
    ? history.map((ride) => ride.actual_fare ?? ride.quoted_fare ?? 0).reduce((sum, value) => sum + value, 0) / history.length
    : null;

  const prediction = predictFare(parsed.data, route, average);
  return new Response(JSON.stringify({ ...prediction, trend: buildTrend(prediction.predictedFare, history) }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
