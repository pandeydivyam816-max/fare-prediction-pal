import { createClient } from "npm:@supabase/supabase-js@2.104.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.104.0/cors";
import { z } from "npm:zod@3.25.76";

const RideSchema = z.object({
  user_id: z.string().uuid(),
  provider_id: z.string().uuid().nullable().optional(),
  pickup_label: z.string().trim().min(2).max(150),
  pickup_place_id: z.string().max(255).nullable().optional(),
  pickup_lat: z.number().min(-90).max(90).nullable().optional(),
  pickup_lng: z.number().min(-180).max(180).nullable().optional(),
  drop_label: z.string().trim().min(2).max(150),
  drop_place_id: z.string().max(255).nullable().optional(),
  drop_lat: z.number().min(-90).max(90).nullable().optional(),
  drop_lng: z.number().min(-180).max(180).nullable().optional(),
  distance_km: z.number().min(0).max(300),
  duration_minutes: z.number().min(0).max(600),
  time_of_day_bucket: z.enum(["dawn", "day", "evening", "night"]),
  traffic_level: z.enum(["light", "moderate", "heavy", "gridlock"]),
  weather_condition: z.enum(["clear", "cloudy", "rain", "storm"]),
  surge_multiplier: z.number().min(1).max(5),
  quoted_fare: z.number().nullable().optional(),
  predicted_fare: z.number().nullable().optional(),
  actual_fare: z.number().nullable().optional(),
  trip_status: z.string().trim().min(3).max(50),
  ride_date: z.string().datetime().optional(),
});

const FavoriteSchema = z.object({
  user_id: z.string().uuid(),
  label: z.string().trim().min(2).max(80),
  pickup_label: z.string().trim().min(2).max(150),
  pickup_place_id: z.string().max(255).nullable().optional(),
  pickup_lat: z.number().min(-90).max(90).nullable().optional(),
  pickup_lng: z.number().min(-180).max(180).nullable().optional(),
  drop_label: z.string().trim().min(2).max(150),
  drop_place_id: z.string().max(255).nullable().optional(),
  drop_lat: z.number().min(-90).max(90).nullable().optional(),
  drop_lng: z.number().min(-180).max(180).nullable().optional(),
});

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("saveRide"), payload: RideSchema }),
  z.object({ action: z.literal("saveFavorite"), payload: FavoriteSchema }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");
  const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_PUBLISHABLE_KEY) throw new Error("SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is not configured");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

  const authHeader = req.headers.get("Authorization");
  const hasBearerToken = Boolean(authHeader && authHeader.startsWith("Bearer ") && authHeader.length > 12);

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) {
    return new Response(JSON.stringify({ error: body.error.flatten() }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = hasBearerToken
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        global: { headers: { Authorization: authHeader ?? "" } },
      })
    : null;
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: authData, error: authError } = userClient
    ? await userClient.auth.getUser()
    : { data: { user: null }, error: null };
  if (authError || !authData.user) {
    return new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (body.data.action === "list") {
    const [ridesResult, favoritesResult] = await Promise.all([
      serviceClient.from("rides").select("*").eq("user_id", authData.user.id).order("ride_date", { ascending: false }).limit(12),
      serviceClient.from("favorite_routes").select("*").eq("user_id", authData.user.id).order("updated_at", { ascending: false }).limit(12),
    ]);

    return new Response(JSON.stringify({ rides: ridesResult.data ?? [], favorites: favoritesResult.data ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (body.data.payload.user_id !== authData.user.id) {
    return new Response(JSON.stringify({ error: "User mismatch." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (body.data.action === "saveRide") {
    const { data, error } = await serviceClient.from("rides").insert(body.data.payload).select("*").single();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ride: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await serviceClient
    .from("favorite_routes")
    .upsert(body.data.payload, { onConflict: "user_id,label" })
    .select("*")
    .single();

  if (error) {
    const insertResult = await serviceClient.from("favorite_routes").insert(body.data.payload).select("*").single();
    if (insertResult.error) {
      return new Response(JSON.stringify({ error: insertResult.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ favorite: insertResult.data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ favorite: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
