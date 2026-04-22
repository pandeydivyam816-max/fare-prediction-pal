type Coordinates = {
  lat: number;
  lng: number;
};

type GeocodeResult = Coordinates & {
  formattedAddress: string;
  placeId?: string | null;
};

async function fetchLocation<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to fetch location details right now.");
  }

  return response.json() as Promise<T>;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const results = await fetchLocation<Array<{
    lat: string;
    lon: string;
    display_name: string;
    place_id?: number;
  }>>(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`,
  );

  if (!results.length) {
    throw new Error("Location not found. Please use a more specific place name.");
  }

  const result = results[0];

  return {
    lat: Number(result.lat),
    lng: Number(result.lon),
    formattedAddress: result.display_name,
    placeId: result.place_id ? String(result.place_id) : null,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const result = await fetchLocation<{
    display_name?: string;
    place_id?: number;
    error?: string;
  }>(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);

  if (!result.display_name) {
    throw new Error("Unable to resolve your current location.");
  }

  return {
    lat,
    lng,
    formattedAddress: result.display_name,
    placeId: result.place_id ? String(result.place_id) : null,
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