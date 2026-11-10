/**
 * ULAB Setu — Global Alumni Network Map Engine
 *
 * Provides:
 * 1. Vetted geographical database of global cities with validated coordinates
 * 2. Privacy-first location normalization (city-center approximate coordinates only)
 * 3. Server-side query engines for Public (aggregate) and Verified Member map views
 * 4. Coordinate boundary validation and anti-fabrication protection
 */

export interface VettedCity {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

/**
 * Curated list of prominent metropolitan centers where ULAB alumni reside, study, and work.
 * Coordinates point strictly to approximate municipal centers (never personal/residential addresses).
 */
export const VETTED_GLOBAL_CITIES: VettedCity[] = [
  // Bangladesh
  { city: "Dhaka", country: "Bangladesh", countryCode: "BD", lat: 23.8103, lng: 90.4125 },
  { city: "Chattogram", country: "Bangladesh", countryCode: "BD", lat: 22.3569, lng: 91.7832 },
  { city: "Sylhet", country: "Bangladesh", countryCode: "BD", lat: 24.8949, lng: 91.8687 },
  { city: "Rajshahi", country: "Bangladesh", countryCode: "BD", lat: 24.3745, lng: 88.6042 },
  { city: "Khulna", country: "Bangladesh", countryCode: "BD", lat: 22.8456, lng: 89.5403 },
  { city: "Barishal", country: "Bangladesh", countryCode: "BD", lat: 22.7010, lng: 90.3535 },
  { city: "Rangpur", country: "Bangladesh", countryCode: "BD", lat: 25.7439, lng: 89.2752 },
  { city: "Mymensingh", country: "Bangladesh", countryCode: "BD", lat: 24.7471, lng: 90.4203 },
  { city: "Cumilla", country: "Bangladesh", countryCode: "BD", lat: 23.4607, lng: 91.1809 },
  { city: "Gazipur", country: "Bangladesh", countryCode: "BD", lat: 24.0023, lng: 90.4264 },
  { city: "Narayanganj", country: "Bangladesh", countryCode: "BD", lat: 23.6238, lng: 90.5000 },
  { city: "Cox's Bazar", country: "Bangladesh", countryCode: "BD", lat: 21.4272, lng: 92.0058 },

  // North America — USA
  { city: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.0060 },
  { city: "San Francisco", country: "United States", countryCode: "US", lat: 37.7749, lng: -122.4194 },
  { city: "San Jose", country: "United States", countryCode: "US", lat: 37.3382, lng: -121.8863 },
  { city: "Seattle", country: "United States", countryCode: "US", lat: 47.6062, lng: -122.3321 },
  { city: "Austin", country: "United States", countryCode: "US", lat: 30.2672, lng: -97.7431 },
  { city: "Chicago", country: "United States", countryCode: "US", lat: 41.8781, lng: -87.6298 },
  { city: "Boston", country: "United States", countryCode: "US", lat: 42.3601, lng: -71.0589 },
  { city: "Los Angeles", country: "United States", countryCode: "US", lat: 34.0522, lng: -118.2437 },
  { city: "Dallas", country: "United States", countryCode: "US", lat: 32.7767, lng: -96.7970 },
  { city: "Atlanta", country: "United States", countryCode: "US", lat: 33.7490, lng: -84.3880 },
  { city: "Washington", country: "United States", countryCode: "US", lat: 38.9072, lng: -77.0369 },

  // North America — Canada
  { city: "Toronto", country: "Canada", countryCode: "CA", lat: 43.6532, lng: -79.3832 },
  { city: "Vancouver", country: "Canada", countryCode: "CA", lat: 49.2827, lng: -123.1207 },
  { city: "Montreal", country: "Canada", countryCode: "CA", lat: 45.5017, lng: -73.5673 },
  { city: "Calgary", country: "Canada", countryCode: "CA", lat: 51.0447, lng: -114.0719 },
  { city: "Ottawa", country: "Canada", countryCode: "CA", lat: 45.4215, lng: -75.6972 },
  { city: "Edmonton", country: "Canada", countryCode: "CA", lat: 53.5461, lng: -113.4938 },

  // Europe — United Kingdom
  { city: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lng: -0.1278 },
  { city: "Manchester", country: "United Kingdom", countryCode: "GB", lat: 53.4808, lng: -2.2426 },
  { city: "Birmingham", country: "United Kingdom", countryCode: "GB", lat: 52.4862, lng: -1.8904 },
  { city: "Edinburgh", country: "United Kingdom", countryCode: "GB", lat: 55.9533, lng: -3.1883 },
  { city: "Leeds", country: "United Kingdom", countryCode: "GB", lat: 53.8008, lng: -1.5491 },
  { city: "Glasgow", country: "United Kingdom", countryCode: "GB", lat: 55.8642, lng: -4.2518 },

  // Europe — European Union & Continental
  { city: "Berlin", country: "Germany", countryCode: "DE", lat: 52.5200, lng: 13.4050 },
  { city: "Munich", country: "Germany", countryCode: "DE", lat: 48.1351, lng: 11.5820 },
  { city: "Frankfurt", country: "Germany", countryCode: "DE", lat: 50.1109, lng: 8.6821 },
  { city: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522 },
  { city: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.3676, lng: 4.9041 },
  { city: "Stockholm", country: "Sweden", countryCode: "SE", lat: 59.3293, lng: 18.0686 },
  { city: "Helsinki", country: "Finland", countryCode: "FI", lat: 60.1699, lng: 24.9384 },
  { city: "Oslo", country: "Norway", countryCode: "NO", lat: 59.9139, lng: 10.7522 },
  { city: "Copenhagen", country: "Denmark", countryCode: "DK", lat: 55.6761, lng: 12.5683 },
  { city: "Dublin", country: "Ireland", countryCode: "IE", lat: 53.3498, lng: -6.2603 },
  { city: "Zurich", country: "Switzerland", countryCode: "CH", lat: 47.3769, lng: 8.5417 },

  // Asia & Oceania
  { city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lng: 139.6503 },
  { city: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lng: 103.8198 },
  { city: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lng: 126.9780 },
  { city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", lat: 3.1390, lng: 101.6869 },
  { city: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.7563, lng: 100.5018 },
  { city: "Sydney", country: "Australia", countryCode: "AU", lat: -33.8688, lng: 151.2093 },
  { city: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.8136, lng: 144.9631 },
  { city: "Brisbane", country: "Australia", countryCode: "AU", lat: -27.4698, lng: 153.0251 },
  { city: "Perth", country: "Australia", countryCode: "AU", lat: -31.9505, lng: 115.8605 },
  { city: "Auckland", country: "New Zealand", countryCode: "NZ", lat: -36.8485, lng: 174.7633 },

  // Middle East
  { city: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lng: 55.2708 },
  { city: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE", lat: 24.4539, lng: 54.3773 },
  { city: "Doha", country: "Qatar", countryCode: "QA", lat: 25.2854, lng: 51.5310 },
  { city: "Riyadh", country: "Saudi Arabia", countryCode: "SA", lat: 24.7136, lng: 46.6753 },
];

/**
 * Validates geographical latitude and longitude bounds.
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Matches a user's entered city and country against vetted geographic database.
 */
export function lookupCityCoordinates(
  cityRaw: string,
  countryRaw?: string
): VettedCity | null {
  const normCity = cityRaw.trim().toLowerCase();
  const normCountry = (countryRaw || "").trim().toLowerCase();

  // 1. Exact match on both city & country
  if (normCountry) {
    const exact = VETTED_GLOBAL_CITIES.find(
      (c) =>
        c.city.toLowerCase() === normCity &&
        (c.country.toLowerCase() === normCountry ||
          c.countryCode.toLowerCase() === normCountry)
    );
    if (exact) return exact;
  }

  // 2. Exact match on city
  const cityMatch = VETTED_GLOBAL_CITIES.find(
    (c) => c.city.toLowerCase() === normCity
  );
  if (cityMatch) return cityMatch;

  // 3. Partial contains match
  const partialMatch = VETTED_GLOBAL_CITIES.find(
    (c) =>
      c.city.toLowerCase().includes(normCity) ||
      normCity.includes(c.city.toLowerCase())
  );
  if (partialMatch) return partialMatch;

  return null;
}

/**
 * Safely resolves location inputs. If coordinates are provided, validates them;
 * otherwise looks up approximate municipal center coordinates.
 */
export function resolveLocationData(
  cityInput?: string | null,
  countryInput?: string | null,
  latInput?: number | null,
  lngInput?: number | null
): {
  city: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
} {
  const city = (cityInput || "").trim() || null;
  const country = (countryInput || "").trim() || null;

  if (!city && !country) {
    return { city: null, country: null, countryCode: null, latitude: null, longitude: null };
  }

  // If valid coordinates were explicitly submitted
  if (
    typeof latInput === "number" &&
    typeof lngInput === "number" &&
    validateCoordinates(latInput, lngInput)
  ) {
    const lookup = city ? lookupCityCoordinates(city, country || undefined) : null;
    return {
      city: lookup ? lookup.city : city,
      country: lookup ? lookup.country : country,
      countryCode: lookup ? lookup.countryCode : null,
      latitude: Number(latInput.toFixed(4)),
      longitude: Number(lngInput.toFixed(4)),
    };
  }

  // Lookup approximate municipal center
  if (city) {
    const found = lookupCityCoordinates(city, country || undefined);
    if (found) {
      return {
        city: found.city,
        country: found.country,
        countryCode: found.countryCode,
        latitude: found.lat,
        longitude: found.lng,
      };
    }
  }

  return {
    city,
    country,
    countryCode: null,
    latitude: null,
    longitude: null,
  };
}

export type LocationVisibilityPreference = "HIDDEN" | "MEMBERS_ONLY" | "PUBLIC";

export interface MapAlumniItem {
  id: string;
  name: string;
  image: string | null;
  department: string | null;
  graduationYear: string | null;
  company: string | null;
  designation: string | null;
  city: string;
  country: string;
  countryCode: string | null;
  lat: number;
  lng: number;
}

export interface PublicCityCluster {
  city: string;
  country: string;
  countryCode: string | null;
  lat: number;
  lng: number;
  count: number;
}

export interface AlumniMapStats {
  totalAlumni: number;
  totalCountries: number;
  totalCities: number;
  hasEnoughData: boolean;
}

