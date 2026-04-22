type Coordinates = {
  lat: number;
  lng: number;
};

type GeocodeResult = Coordinates & {
  formattedAddress: string;
  placeId?: string | null;
};

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "AIzaSyD8ikvhsNf8xpkUNuA43--bnrJ6UGlN0eM";

async function runGeocode(url: string) {
  if (!googleMapsApiKey) {
    throw new Error("Google Maps API key is missing.");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to fetch map location details.");
  }

  const data = await response.json();
  if (data.status !== "OK" || !data.results?.length) {
    throw new Error("Location not found. Please use a more specific place name.");
  }

  return data.results[0];
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const result = await runGeocode(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`,
  );

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
    placeId: result.place_id ?? null,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const result = await runGeocode(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`,
  );

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