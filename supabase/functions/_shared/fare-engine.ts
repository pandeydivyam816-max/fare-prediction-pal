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
  const coordinateDistance =
    input.pickupLat != null &&
    input.pickupLng != null &&
    input.dropLat != null &&
    input.dropLng != null
      ? haversine(input.pickupLat, input.pickupLng, input.dropLat, input.dropLng)
      : null;

  const fallbackDistance = Math.max((input.pickupLabel.length + input.dropLabel.length) / 5, 4.5);
  const distanceKm = Number((input.distanceKm ?? coordinateDistance ?? fallbackDistance).toFixed(1));
  const speed = input.trafficLevel === "gridlock" ? 14 : input.trafficLevel === "heavy" ? 20 : input.trafficLevel === "moderate" ? 26 : 32;
  const durationMinutes = Number((input.durationMinutes ?? (distanceKm / speed) * 60).toFixed(0));
  const centerLat = average(input.pickupLat, input.dropLat) ?? 28.6139;
  const centerLng = average(input.pickupLng, input.dropLng) ?? 77.209;

  return {
    distanceKm,
    durationMinutes,
    polyline: [
      { lat: input.pickupLat ?? centerLat - 0.04, lng: input.pickupLng ?? centerLng - 0.03 },
      { lat: centerLat, lng: centerLng },
      { lat: input.dropLat ?? centerLat + 0.04, lng: input.dropLng ?? centerLng + 0.03 },
    ],
  };
}

export function buildQuotes(input: TripInput, route: ReturnType<typeof deriveRoute>, providers: ProviderRecord[]) {
  return providers
    .map((provider, index) => {
      const base = provider.base_fare + route.distanceKm * provider.price_per_km + route.durationMinutes * provider.price_per_minute;
      const traffic = trafficMultipliers[input.trafficLevel] ?? 1;
      const time = timeMultipliers[input.timeOfDayBucket] ?? 1;
      const weather = weatherMultipliers[input.weatherCondition] ?? 1;
      const providerBias = 1 + index * 0.022;
      const estimatedFare = Math.round(base * traffic * time * weather * input.surgeMultiplier * provider.surge_multiplier_default * providerBias);
      const etaMinutes = Math.max(Math.round(route.durationMinutes * 0.65) + provider.eta_bias_minutes, 3);
      return {
        providerId: provider.id,
        providerName: provider.name,
        providerSlug: provider.slug,
        rideType: index === 2 ? "Bike" : index === 1 ? "Mini" : "Premier",
        estimatedFare,
        etaMinutes,
        confidence: Math.max(76 - index * 3 + Math.round((1.2 - traffic) * 10), 62),
        explanation: `${provider.name} is reacting to ${input.trafficLevel} traffic and ${input.weatherCondition} weather on this route.`,
      };
    })
    .sort((a, b) => a.estimatedFare - b.estimatedFare);
}

export function predictFare(input: TripInput, route: ReturnType<typeof deriveRoute>, historyAverage?: number | null) {
  const demand = (trafficMultipliers[input.trafficLevel] ?? 1) * (timeMultipliers[input.timeOfDayBucket] ?? 1) * (weatherMultipliers[input.weatherCondition] ?? 1);
  const baseline = route.distanceKm * 13.8 + route.durationMinutes * 2.2 + 36;
  const predictedFare = Math.round((historyAverage ?? baseline) * 0.35 + baseline * demand * input.surgeMultiplier * 0.65);

  return {
    predictedFare,
    lowRange: Math.round(predictedFare * 0.9),
    highRange: Math.round(predictedFare * 1.12),
    drivers: [
      { label: "Traffic pressure", impact: `${input.trafficLevel} traffic is influencing total trip time and idle cost.` },
      { label: "Time of day", impact: `${input.timeOfDayBucket} demand is shifting base fare intensity.` },
      { label: "Weather", impact: `${input.weatherCondition} conditions increase dispatch pressure and surge probability.` },
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

function average(a?: number | null, b?: number | null) {
  if (a == null && b == null) return null;
  if (a == null) return b ?? null;
  if (b == null) return a;
  return (a + b) / 2;
}
