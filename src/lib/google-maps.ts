/**
 * Safe, singleton Google Maps JavaScript API dynamic loader.
 * Prevents multiple script injections, handles errors gracefully, and exposes TypeScript types.
 */

declare global {
  interface Window {
    google?: typeof google;
    __googleMapsLoaderPromise?: Promise<typeof google.maps>;
  }
}

export function loadGoogleMapsScript(apiKey?: string): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps cannot be loaded on the server."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__googleMapsLoaderPromise) {
    return window.__googleMapsLoaderPromise;
  }

  const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured."));
  }

  window.__googleMapsLoaderPromise = new Promise((resolve, reject) => {
    // Check if script already exists in document
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.google?.maps) resolve(window.google.maps);
        else reject(new Error("Google Maps failed to initialize after script load."));
      });
      existing.addEventListener("error", () => {
        reject(new Error("Failed to load Google Maps JavaScript API script."));
      });
      return;
    }

    const script = document.createElement("script");
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
    const mapIdParam = mapId ? `&map_ids=${encodeURIComponent(mapId)}` : "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}&libraries=places,geometry${mapIdParam}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps global object unavailable."));
      }
    };

    script.onerror = () => {
      window.__googleMapsLoaderPromise = undefined;
      reject(new Error("Network error loading Google Maps JavaScript API."));
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsLoaderPromise;
}

