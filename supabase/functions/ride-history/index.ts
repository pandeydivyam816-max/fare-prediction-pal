import { createClient } from "npm:@supabase/supabase-js@2.104.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.104.0/cors";
import { z } from "npm:zod@3.25.76";

const PaymentMethodSchema = z.object({
  methodType: z.enum(["card", "upi", "wallet"]),
  providerLabel: z.string().trim().min(2).max(80),
  holderName: z.string().trim().min(2).max(80),
  last4: z.string().trim().regex(/^\d{4}$/),
});

const StopSchema = z.object({
  label: z.string().trim().min(2).max(150),
  placeId: z.string().max(255).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
});

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
  trip_status: z.enum(["planned", "booked", "completed", "canceled"]),
  ride_date: z.string().datetime().optional(),
  payment_method: PaymentMethodSchema.optional(),
  provider_name: z.string().trim().min(2).max(80).optional(),
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

const CancelRideSchema = z.object({
  ride_id: z.string().uuid(),
});

const ItinerarySchema = z.object({
  user_id: z.string().uuid(),
  itinerary_label: z.string().trim().min(2).max(120),
  provider_id: z.string().uuid().nullable().optional(),
  provider_name: z.string().trim().min(2).max(80).nullable().optional(),
  quoted_fare: z.number().nullable().optional(),
  predicted_fare: z.number().nullable().optional(),
  time_of_day_bucket: z.enum(["dawn", "day", "evening", "night"]),
  traffic_level: z.enum(["light", "moderate", "heavy", "gridlock"]),
  weather_condition: z.enum(["clear", "cloudy", "rain", "storm"]),
  surge_multiplier: z.number().min(1).max(5),
  stops: z.array(StopSchema).min(2).max(7),
  payment_method: PaymentMethodSchema.optional(),
});

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("saveRide"), payload: RideSchema }),
  z.object({ action: z.literal("saveFavorite"), payload: FavoriteSchema }),
  z.object({ action: z.literal("cancelRide"), payload: CancelRideSchema }),
  z.object({ action: z.literal("saveItinerary"), payload: ItinerarySchema }),
  z.object({ action: z.literal("bookItinerary"), payload: ItinerarySchema.extend({ payment_method: PaymentMethodSchema }) }),
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
    const [ridesResult, favoritesResult, itinerariesResult, itineraryStopsResult, receiptsResult] = await Promise.all([
      serviceClient.from("rides").select("*").eq("user_id", authData.user.id).order("ride_date", { ascending: false }).limit(24),
      serviceClient.from("favorite_routes").select("*").eq("user_id", authData.user.id).order("updated_at", { ascending: false }).limit(12),
      serviceClient.from("itineraries").select("*").eq("user_id", authData.user.id).order("updated_at", { ascending: false }).limit(12),
      serviceClient.from("itinerary_stops").select("*").eq("user_id", authData.user.id).order("stop_order", { ascending: true }).limit(64),
      serviceClient.from("booking_receipts").select("*").eq("user_id", authData.user.id).order("created_at", { ascending: false }).limit(24),
    ]);

    return new Response(JSON.stringify({
      rides: ridesResult.data ?? [],
      favorites: favoritesResult.data ?? [],
      itineraries: itinerariesResult.data ?? [],
      itineraryStops: itineraryStopsResult.data ?? [],
      receipts: receiptsResult.data ?? [],
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if ("payload" in body.data && "user_id" in body.data.payload && body.data.payload.user_id !== authData.user.id) {
    return new Response(JSON.stringify({ error: "User mismatch." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (body.data.action === "saveRide") {
    const nowIso = new Date().toISOString();
    const paymentMethod = body.data.payload.payment_method;
    const isBooked = body.data.payload.trip_status === "booked";
    const isCompleted = body.data.payload.trip_status === "completed";

    const driverProfile = buildDriverProfile(body.data.payload.provider_name);
    const rideInsert = {
      ...body.data.payload,
      payment_method_type: paymentMethod?.methodType ?? null,
      payment_method_last4: paymentMethod?.last4 ?? null,
      payment_status: paymentMethod ? "authorized" : "pending",
      booking_reference: isBooked ? createBookingReference() : null,
      eta_minutes: isBooked ? Math.max(Math.round(body.data.payload.duration_minutes * 0.65), 4) : null,
      driver_name: isBooked ? driverProfile.driver_name : null,
      driver_phone: isBooked ? driverProfile.driver_phone : null,
      driver_vehicle: isBooked ? driverProfile.driver_vehicle : null,
      driver_rating: isBooked ? driverProfile.driver_rating : null,
      booked_at: isBooked ? nowIso : null,
      completed_at: isCompleted ? nowIso : null,
      canceled_at: null,
      status_updated_at: nowIso,
    };

    const { payment_method: _payment, provider_name: _providerName, ...safeRideInsert } = rideInsert;
    const { data, error } = await serviceClient.from("rides").insert(safeRideInsert).select("*").single();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let receipt: Record<string, unknown> | null = null;
    if (isBooked && paymentMethod) {
      const receiptNumber = createReceiptNumber();
      const receiptInsert = {
        user_id: authData.user.id,
        ride_id: data.id,
        itinerary_id: null,
        receipt_number: receiptNumber,
        provider_name: body.data.payload.provider_name ?? null,
        amount: data.quoted_fare ?? data.predicted_fare ?? 0,
        currency: "INR",
        payment_method_type: paymentMethod.methodType,
        payment_method_last4: paymentMethod.last4,
        receipt_status: "confirmed",
        receipt_data: {
          rider: paymentMethod.holderName,
          provider: paymentMethod.providerLabel,
          confirmedAt: nowIso,
          bookingReference: data.booking_reference,
        },
      };
      const receiptResult = await serviceClient.from("booking_receipts").insert(receiptInsert).select("*").single();
      receipt = receiptResult.data ?? null;
    }

    return new Response(JSON.stringify({ ride: data, receipt }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (body.data.action === "cancelRide") {
    const nowIso = new Date().toISOString();
    const { data, error } = await serviceClient
      .from("rides")
      .update({
        trip_status: "canceled",
        canceled_at: nowIso,
        status_updated_at: nowIso,
        eta_minutes: null,
      })
      .eq("id", body.data.payload.ride_id)
      .eq("user_id", authData.user.id)
      .select("*")
      .single();

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

  if (body.data.action === "saveItinerary" || body.data.action === "bookItinerary") {
    const nowIso = new Date().toISOString();
    const isBooked = body.data.action === "bookItinerary";
    const paymentMethod = body.data.payload.payment_method;
    const itineraryStatus = isBooked ? "booked" : "planned";

    const itineraryResult = await serviceClient
      .from("itineraries")
      .insert({
        user_id: authData.user.id,
        label: body.data.payload.itinerary_label,
        payment_method_type: paymentMethod?.methodType ?? null,
        payment_method_last4: paymentMethod?.last4 ?? null,
        quoted_total_fare: body.data.payload.quoted_fare ?? null,
        predicted_total_fare: body.data.payload.predicted_fare ?? null,
        trip_status: itineraryStatus,
        booked_at: isBooked ? nowIso : null,
        completed_at: null,
        canceled_at: null,
      })
      .select("*")
      .single();

    if (itineraryResult.error || !itineraryResult.data) {
      return new Response(JSON.stringify({ error: itineraryResult.error?.message ?? "Unable to save itinerary." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itinerary = itineraryResult.data;
    const stopRows = body.data.payload.stops.map((stop, index) => ({
      itinerary_id: itinerary.id,
      user_id: authData.user.id,
      stop_order: index,
      label: stop.label,
      place_id: stop.placeId ?? null,
      lat: stop.lat ?? null,
      lng: stop.lng ?? null,
    }));

    const stopsResult = await serviceClient.from("itinerary_stops").insert(stopRows).select("*");
    if (stopsResult.error) {
      return new Response(JSON.stringify({ error: stopsResult.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const legCount = Math.max(body.data.payload.stops.length - 1, 1);
    const legFare = body.data.payload.quoted_fare != null ? Math.round(body.data.payload.quoted_fare / legCount) : null;
    const legPrediction = body.data.payload.predicted_fare != null ? Math.round(body.data.payload.predicted_fare / legCount) : null;

    const rideRows = body.data.payload.stops.slice(0, -1).map((stop, index) => {
      const next = body.data.payload.stops[index + 1];
      const driverProfile = buildDriverProfile(body.data.payload.provider_name ?? undefined, index + 1);
      return {
        user_id: authData.user.id,
        provider_id: body.data.payload.provider_id ?? null,
        pickup_label: stop.label,
        pickup_place_id: stop.placeId ?? null,
        pickup_lat: stop.lat ?? null,
        pickup_lng: stop.lng ?? null,
        drop_label: next.label,
        drop_place_id: next.placeId ?? null,
        drop_lat: next.lat ?? null,
        drop_lng: next.lng ?? null,
        distance_km: Math.max(2.5, Number((body.data.payload.stops.length * 2.4 + index * 0.8).toFixed(1))),
        duration_minutes: Math.max(10, 12 + index * 6),
        time_of_day_bucket: body.data.payload.time_of_day_bucket,
        traffic_level: body.data.payload.traffic_level,
        weather_condition: body.data.payload.weather_condition,
        surge_multiplier: body.data.payload.surge_multiplier,
        quoted_fare: legFare,
        predicted_fare: legPrediction,
        actual_fare: null,
        trip_status: itineraryStatus,
        ride_date: nowIso,
        booking_reference: isBooked ? createBookingReference() : null,
        eta_minutes: isBooked ? 8 + index * 4 : null,
        driver_name: isBooked ? driverProfile.driver_name : null,
        driver_phone: isBooked ? driverProfile.driver_phone : null,
        driver_vehicle: isBooked ? driverProfile.driver_vehicle : null,
        driver_rating: isBooked ? driverProfile.driver_rating : null,
        payment_method_type: paymentMethod?.methodType ?? null,
        payment_method_last4: paymentMethod?.last4 ?? null,
        payment_status: paymentMethod ? "authorized" : "pending",
        booked_at: isBooked ? nowIso : null,
        completed_at: null,
        canceled_at: null,
        status_updated_at: nowIso,
        itinerary_id: itinerary.id,
        itinerary_leg_index: index + 1,
        itinerary_stop_count: body.data.payload.stops.length,
      };
    });

    const ridesResult = await serviceClient.from("rides").insert(rideRows).select("*");
    if (ridesResult.error) {
      return new Response(JSON.stringify({ error: ridesResult.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let receipts: Array<Record<string, unknown>> = [];
    if (isBooked && paymentMethod && ridesResult.data?.length) {
      const receiptRows = ridesResult.data.map((ride, index) => ({
        user_id: authData.user.id,
        ride_id: ride.id,
        itinerary_id: itinerary.id,
        receipt_number: createReceiptNumber(index + 1),
        provider_name: body.data.payload.provider_name ?? null,
        amount: ride.quoted_fare ?? ride.predicted_fare ?? 0,
        currency: "INR",
        payment_method_type: paymentMethod.methodType,
        payment_method_last4: paymentMethod.last4,
        receipt_status: "confirmed",
        receipt_data: {
          rider: paymentMethod.holderName,
          provider: paymentMethod.providerLabel,
          confirmedAt: nowIso,
          itineraryLabel: itinerary.label,
          bookingReference: ride.booking_reference,
        },
      }));

      const receiptsResult = await serviceClient.from("booking_receipts").insert(receiptRows).select("*");
      receipts = receiptsResult.data ?? [];
    }

    return new Response(JSON.stringify({
      itinerary,
      rides: ridesResult.data ?? [],
      itineraryStops: stopsResult.data ?? [],
      receipts,
    }), {
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

function createBookingReference() {
  return `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function createReceiptNumber(seed?: number) {
  return `RCPT-${Date.now()}${seed ? `-${seed}` : ""}`;
}

function buildDriverProfile(providerName?: string, leg = 1) {
  const drivers = [
    { driver_name: "Arjun Mehta", driver_phone: "+91 98****2154", driver_vehicle: `${providerName ?? "City Ride"} • White Dzire`, driver_rating: 4.8 },
    { driver_name: "Priya Nair", driver_phone: "+91 99****8871", driver_vehicle: `${providerName ?? "City Ride"} • Blue WagonR`, driver_rating: 4.7 },
    { driver_name: "Karan Singh", driver_phone: "+91 97****4419", driver_vehicle: `${providerName ?? "City Ride"} • Silver Baleno`, driver_rating: 4.9 },
  ];
  return drivers[(leg - 1) % drivers.length];
}
