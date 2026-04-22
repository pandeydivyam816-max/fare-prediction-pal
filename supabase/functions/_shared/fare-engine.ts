export type RouteStopInput = {
  label: string;
  lat?: number | null;
  lng?: number | null;
};

export type TripInput = {
  pickupLabel: string;
  dropLabel: string;
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
  stops?: RouteStopInput[];
};

export type ProviderRecord = {
  id: string;
  name: string;
  slug: string;
  base_fare: number;
  price_per_km: number;
  price_per_minute: number;
  surge_multiplier_default: number;
  eta_bias_minutes: number;
};

const trafficMultipliers: Record<string, number> = {
  light: 0.94,
  moderate: 1,
  heavy: 1.12,
  gridlock: 1.22,
};

const timeMultipliers: Record<string, number> = {
  dawn: 0.9,
  day: 1,
  evening: 1.08,
  night: 1.14,
};

const weatherMultipliers: Record<string, number> = {
  clear: 1,
  cloudy: 1.03,
  rain: 1.14,
  storm: 1.22,
};

export function deriveRoute(input: TripInput) {
  const routeStops = [
    { label: input.pickupLabel, lat: input.pickupLat ?? null, lng: input.pickupLng ?? null },
    ...(input.stops ?? []).map((stop) => ({ label: stop.label, lat: stop.lat ?? null, lng: stop.lng ?? null })),
    { label: input.dropLabel, lat: input.dropLat ?? null, lng: input.dropLng ?? null },
  ];

  const segmentDistances = routeStops.slice(0, -1).map((stop, index) => {
    const next = routeStops[index + 1];
    if (stop.lat != null && stop.lng != null && next.lat != null && next.lng != null) {
      return haversine(stop.lat, stop.lng, next.lat, next.lng);
    }

    return Math.max((stop.label.length + next.label.length) / 6, 3.2);
  });

  const coordinateDistance = segmentDistances.length ? segmentDistances.reduce((sum, value) => sum + value, 0) : null;
  const fallbackDistance = Math.max(routeStops.reduce((sum, stop) => sum + stop.label.length, 0) / 8, 4.5);
  const distanceKm = Number((input.distanceKm ?? coordinateDistance ?? fallbackDistance).toFixed(1));
  const speed = input.trafficLevel === "gridlock" ? 14 : input.trafficLevel === "heavy" ? 20 : input.trafficLevel === "moderate" ? 26 : 32;
  const durationMinutes = Number((input.durationMinutes ?? (distanceKm / speed) * 60).toFixed(0));

  const knownPoints = routeStops.filter((stop) => stop.lat != null && stop.lng != null) as Array<{ label: string; lat: number; lng: number }>;
  const centerLat = knownPoints.length ? knownPoints.reduce((sum, point) => sum + point.lat, 0) / knownPoints.length : 28.6139;
  const centerLng = knownPoints.length ? knownPoints.reduce((sum, point) => sum + point.lng, 0) / knownPoints.length : 77.209;

  const polyline = routeStops.map((stop, index) => ({
    lat: stop.lat ?? centerLat + (index - routeStops.length / 2) * 0.02,
    lng: stop.lng ?? centerLng + (index - routeStops.length / 2) * 0.015,
  }));

  return {
    distanceKm,
    durationMinutes,
    polyline,
  };
}

export function buildQuotes(input: TripInput, route: ReturnType<typeof deriveRoute>, providers: ProviderRecord[]) {
  const stopPenalty = 1 + (input.stops?.length ?? 0) * 0.08;

  return providers
    .map((provider, index) => {
      const base = provider.base_fare + route.distanceKm * provider.price_per_km + route.durationMinutes * provider.price_per_minute;
      const traffic = trafficMultipliers[input.trafficLevel] ?? 1;
      const time = timeMultipliers[input.timeOfDayBucket] ?? 1;
      const weather = weatherMultipliers[input.weatherCondition] ?? 1;
      const providerBias = 1 + index * 0.022;
      const estimatedFare = Math.round(base * traffic * time * weather * input.surgeMultiplier * provider.surge_multiplier_default * providerBias * stopPenalty);
      const etaMinutes = Math.max(Math.round(route.durationMinutes * 0.65) + provider.eta_bias_minutes + (input.stops?.length ?? 0) * 4, 3);
      return {
        providerId: provider.id,
        providerName: provider.name,
        providerSlug: provider.slug,
        rideType: index === 2 ? "Bike" : index === 1 ? "Mini" : "Premier",
        estimatedFare,
        etaMinutes,
        confidence: Math.max(76 - index * 3 + Math.round((1.2 - traffic) * 10) - (input.stops?.length ?? 0), 62),
        explanation: `${provider.name} is reacting to ${input.trafficLevel} traffic and ${input.weatherCondition} weather across ${route.polyline.length - 1} legs.`,
      };
    })
    .sort((a, b) => a.estimatedFare - b.estimatedFare);
}

export function predictFare(input: TripInput, route: ReturnType<typeof deriveRoute>, historyAverage?: number | null) {
  const demand = (trafficMultipliers[input.trafficLevel] ?? 1) * (timeMultipliers[input.timeOfDayBucket] ?? 1) * (weatherMultipliers[input.weatherCondition] ?? 1);
  const stopPenalty = 1 + (input.stops?.length ?? 0) * 0.07;
  const baseline = route.distanceKm * 13.8 + route.durationMinutes * 2.2 + 36;
  const predictedFare = Math.round((historyAverage ?? baseline) * 0.35 + baseline * demand * input.surgeMultiplier * 0.65 * stopPenalty);

  return {
    predictedFare,
    lowRange: Math.round(predictedFare * 0.9),
    highRange: Math.round(predictedFare * 1.12),
    drivers: [
      { label: "Traffic pressure", impact: `${input.trafficLevel} traffic is influencing total trip time and idle cost.` },
      { label: "Time of day", impact: `${input.timeOfDayBucket} demand is shifting base fare intensity.` },
      { label: "Weather", impact: `${input.weatherCondition} conditions increase dispatch pressure and surge probability.` },
      ...(input.stops?.length ? [{ label: "Stop count", impact: `${input.stops.length} additional stop${input.stops.length > 1 ? "s" : ""} adds dwell time and dispatch complexity.` }] : []),
    ],
  };
}

export function buildTrend(predictedFare: number, history: Array<{ actual_fare: number | null; quoted_fare: number | null }>) {
  const samples = history.length ? history.slice(0, 6) : new Array(6).fill(null);
  return samples.map((item, index) => {
    const actual = Math.round(item?.actual_fare ?? item?.quoted_fare ?? predictedFare * (0.88 + index * 0.03));
    const predicted = Math.round(predictedFare * (0.92 + index * 0.025));
    return { label: `T-${samples.length - index}`, actual, predicted };
  });
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
