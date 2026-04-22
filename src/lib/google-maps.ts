type Coordinates = {
  lat: number;
  lng: number;
};

type GeocodeResult = Coordinates & {
  formattedAddress: string;
  placeId?: string | null;
};

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "AIzaSyD8ikvhsNf8xpkUNuA43--bnrJ6UGlN0eM";

function getGoogleMaps() {
  return (window as any).google?.maps;
}

async function waitForGoogleMaps() {
  if (!googleMapsApiKey) {
    throw new Error("Google Maps API key is missing.");
  }

  const existing = getGoogleMaps();
  if (existing?.Geocoder) return existing;

  for (let index = 0; index < 30; index += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    const maps = getGoogleMaps();
    if (maps?.Geocoder) return maps;
  }

  throw new Error("Google Maps is still loading. Please try again in a moment.");
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const googleMaps = await waitForGoogleMaps();
  const geocoder = new googleMaps.Geocoder();
  const { results } = await geocoder.geocode({ address });

  if (!results?.length) {
    throw new Error("Location not found. Please use a more specific place name.");
  }

  const result = results[0];

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
    placeId: result.place_id ?? null,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const googleMaps = await waitForGoogleMaps();
  const geocoder = new googleMaps.Geocoder();
  const { results } = await geocoder.geocode({ location: { lat, lng } });

  if (!results?.length) {
    throw new Error("Unable to resolve your current location.");
  }

  const result = results[0];

  return {
    lat,
    lng,
    formattedAddress: result.formatted_address,
    placeId: result.place_id ?? null,
  };
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => reject(new Error("Location access was denied. Please allow location access and try again.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}