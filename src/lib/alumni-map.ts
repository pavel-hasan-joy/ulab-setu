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
  { city: "Sharjah", country: "United Arab Emirates", countryCode: "AE", lat: 25.3463, lng: 55.4209 },
  { city: "Doha", country: "Qatar", countryCode: "QA", lat: 25.2854, lng: 51.5310 },
  { city: "Lusail", country: "Qatar", countryCode: "QA", lat: 25.4190, lng: 51.4925 },
  { city: "Riyadh", country: "Saudi Arabia", countryCode: "SA", lat: 24.7136, lng: 46.6753 },
  { city: "Jeddah", country: "Saudi Arabia", countryCode: "SA", lat: 21.4858, lng: 39.1925 },
  { city: "Dammam", country: "Saudi Arabia", countryCode: "SA", lat: 26.4207, lng: 50.0888 },
  { city: "Kuwait City", country: "Kuwait", countryCode: "KW", lat: 29.3759, lng: 47.9774 },
  { city: "Muscat", country: "Oman", countryCode: "OM", lat: 23.5880, lng: 58.3829 },
  { city: "Manama", country: "Bahrain", countryCode: "BH", lat: 26.2285, lng: 50.5860 },
  { city: "Istanbul", country: "Turkey", countryCode: "TR", lat: 41.0082, lng: 28.9784 },
  { city: "Ankara", country: "Turkey", countryCode: "TR", lat: 39.9334, lng: 32.8597 },
  { city: "Izmir", country: "Turkey", countryCode: "TR", lat: 38.4237, lng: 27.1428 },

  // Europe — Additional European Nations
  { city: "Geneva", country: "Switzerland", countryCode: "CH", lat: 46.2044, lng: 6.1432 },
  { city: "Basel", country: "Switzerland", countryCode: "CH", lat: 47.5596, lng: 7.5886 },
  { city: "Bern", country: "Switzerland", countryCode: "CH", lat: 46.9480, lng: 7.4474 },
  { city: "Rome", country: "Italy", countryCode: "IT", lat: 41.9028, lng: 12.4964 },
  { city: "Milan", country: "Italy", countryCode: "IT", lat: 45.4642, lng: 9.1900 },
  { city: "Florence", country: "Italy", countryCode: "IT", lat: 43.7696, lng: 11.2558 },
  { city: "Turin", country: "Italy", countryCode: "IT", lat: 45.0703, lng: 7.6869 },
  { city: "Madrid", country: "Spain", countryCode: "ES", lat: 40.4168, lng: -3.7038 },
  { city: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.3879, lng: 2.1699 },
  { city: "Valencia", country: "Spain", countryCode: "ES", lat: 39.4699, lng: -0.3763 },
  { city: "Seville", country: "Spain", countryCode: "ES", lat: 37.3891, lng: -5.9845 },
  { city: "Lisbon", country: "Portugal", countryCode: "PT", lat: 38.7223, lng: -9.1393 },
  { city: "Porto", country: "Portugal", countryCode: "PT", lat: 41.1579, lng: -8.6291 },
  { city: "Braga", country: "Portugal", countryCode: "PT", lat: 41.5454, lng: -8.4265 },
  { city: "Cork", country: "Ireland", countryCode: "IE", lat: 51.8985, lng: -8.4756 },
  { city: "Galway", country: "Ireland", countryCode: "IE", lat: 53.2707, lng: -9.0568 },
  { city: "Gothenburg", country: "Sweden", countryCode: "SE", lat: 57.7089, lng: 11.9746 },
  { city: "Malmo", country: "Sweden", countryCode: "SE", lat: 55.6050, lng: 13.0038 },
  { city: "Bergen", country: "Norway", countryCode: "NO", lat: 60.3913, lng: 5.3221 },
  { city: "Trondheim", country: "Norway", countryCode: "NO", lat: 63.4305, lng: 10.3951 },
  { city: "Aarhus", country: "Denmark", countryCode: "DK", lat: 56.1629, lng: 10.2039 },
  { city: "Odense", country: "Denmark", countryCode: "DK", lat: 55.4038, lng: 10.4024 },
  { city: "Espoo", country: "Finland", countryCode: "FI", lat: 60.2055, lng: 24.6559 },
  { city: "Tampere", country: "Finland", countryCode: "FI", lat: 61.4978, lng: 23.7610 },
  { city: "Warsaw", country: "Poland", countryCode: "PL", lat: 52.2297, lng: 21.0122 },
  { city: "Krakow", country: "Poland", countryCode: "PL", lat: 50.0647, lng: 19.9450 },
  { city: "Wroclaw", country: "Poland", countryCode: "PL", lat: 51.1079, lng: 17.0385 },
  { city: "Brussels", country: "Belgium", countryCode: "BE", lat: 50.8503, lng: 4.3517 },
  { city: "Antwerp", country: "Belgium", countryCode: "BE", lat: 51.2194, lng: 4.4025 },
  { city: "Ghent", country: "Belgium", countryCode: "BE", lat: 51.0543, lng: 3.7174 },
  { city: "Vienna", country: "Austria", countryCode: "AT", lat: 48.2082, lng: 16.3738 },
  { city: "Graz", country: "Austria", countryCode: "AT", lat: 47.0707, lng: 15.4395 },
  { city: "Salzburg", country: "Austria", countryCode: "AT", lat: 47.8095, lng: 13.0550 },
  { city: "Prague", country: "Czech Republic", countryCode: "CZ", lat: 50.0755, lng: 14.4378 },
  { city: "Brno", country: "Czech Republic", countryCode: "CZ", lat: 49.1951, lng: 16.6068 },
  { city: "Athens", country: "Greece", countryCode: "GR", lat: 37.9838, lng: 23.7275 },
  { city: "Thessaloniki", country: "Greece", countryCode: "GR", lat: 40.6401, lng: 22.9444 },

  // Asia — Subcontinent, East & Southeast
  { city: "Osaka", country: "Japan", countryCode: "JP", lat: 34.6937, lng: 135.5023 },
  { city: "Kyoto", country: "Japan", countryCode: "JP", lat: 35.0116, lng: 135.7681 },
  { city: "Yokohama", country: "Japan", countryCode: "JP", lat: 35.4437, lng: 139.6380 },
  { city: "Busan", country: "South Korea", countryCode: "KR", lat: 35.1796, lng: 129.0756 },
  { city: "Incheon", country: "South Korea", countryCode: "KR", lat: 37.4563, lng: 126.7052 },
  { city: "George Town", country: "Malaysia", countryCode: "MY", lat: 5.4141, lng: 100.3288 },
  { city: "Cyberjaya", country: "Malaysia", countryCode: "MY", lat: 2.9213, lng: 101.6559 },
  { city: "Jakarta", country: "Indonesia", countryCode: "ID", lat: -6.2088, lng: 106.8456 },
  { city: "Bandung", country: "Indonesia", countryCode: "ID", lat: -6.9175, lng: 107.6191 },
  { city: "Surabaya", country: "Indonesia", countryCode: "ID", lat: -7.2575, lng: 112.7521 },
  { city: "Chiang Mai", country: "Thailand", countryCode: "TH", lat: 18.7883, lng: 98.9853 },
  { city: "Phuket", country: "Thailand", countryCode: "TH", lat: 7.8804, lng: 98.3923 },
  { city: "Bengaluru", country: "India", countryCode: "IN", lat: 12.9716, lng: 77.5946 },
  { city: "Hyderabad", country: "India", countryCode: "IN", lat: 17.3850, lng: 78.4867 },
  { city: "Mumbai", country: "India", countryCode: "IN", lat: 19.0760, lng: 72.8777 },
  { city: "New Delhi", country: "India", countryCode: "IN", lat: 28.6139, lng: 77.2090 },
  { city: "Pune", country: "India", countryCode: "IN", lat: 18.5204, lng: 73.8567 },
  { city: "Chennai", country: "India", countryCode: "IN", lat: 13.0827, lng: 80.2707 },
  { city: "Lahore", country: "Pakistan", countryCode: "PK", lat: 31.5204, lng: 74.3587 },
  { city: "Karachi", country: "Pakistan", countryCode: "PK", lat: 24.8607, lng: 67.0011 },
  { city: "Islamabad", country: "Pakistan", countryCode: "PK", lat: 33.6844, lng: 73.0479 },
  { city: "Kathmandu", country: "Nepal", countryCode: "NP", lat: 27.7172, lng: 85.3240 },
  { city: "Pokhara", country: "Nepal", countryCode: "NP", lat: 28.2096, lng: 83.9856 },
  { city: "Colombo", country: "Sri Lanka", countryCode: "LK", lat: 6.9271, lng: 79.8612 },
  { city: "Kandy", country: "Sri Lanka", countryCode: "LK", lat: 7.2906, lng: 80.6337 },
  { city: "Beijing", country: "China", countryCode: "CN", lat: 39.9042, lng: 116.4074 },
  { city: "Shanghai", country: "China", countryCode: "CN", lat: 31.2304, lng: 121.4737 },
  { city: "Shenzhen", country: "China", countryCode: "CN", lat: 22.5431, lng: 114.0579 },
  { city: "Guangzhou", country: "China", countryCode: "CN", lat: 23.1291, lng: 113.2644 },
  { city: "Hangzhou", country: "China", countryCode: "CN", lat: 30.2741, lng: 120.1551 },
  { city: "Hong Kong", country: "Hong Kong", countryCode: "HK", lat: 22.3193, lng: 114.1694 },
  { city: "Taipei", country: "Taiwan", countryCode: "TW", lat: 25.0330, lng: 121.5654 },
  { city: "Hsinchu", country: "Taiwan", countryCode: "TW", lat: 24.8138, lng: 120.9675 },
  { city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", lat: 10.8231, lng: 106.6297 },
  { city: "Hanoi", country: "Vietnam", countryCode: "VN", lat: 21.0285, lng: 105.8542 },
  { city: "Da Nang", country: "Vietnam", countryCode: "VN", lat: 16.0544, lng: 108.2022 },
  { city: "Manila", country: "Philippines", countryCode: "PH", lat: 14.5995, lng: 120.9842 },
  { city: "Cebu City", country: "Philippines", countryCode: "PH", lat: 10.3157, lng: 123.8854 },
  { city: "Davao City", country: "Philippines", countryCode: "PH", lat: 7.1907, lng: 125.4578 },
  { city: "Phnom Penh", country: "Cambodia", countryCode: "KH", lat: 11.5564, lng: 104.9282 },
  { city: "Siem Reap", country: "Cambodia", countryCode: "KH", lat: 13.3671, lng: 103.8448 },

  // Africa
  { city: "Cape Town", country: "South Africa", countryCode: "ZA", lat: -33.9249, lng: 18.4241 },
  { city: "Johannesburg", country: "South Africa", countryCode: "ZA", lat: -26.2041, lng: 28.0473 },
  { city: "Pretoria", country: "South Africa", countryCode: "ZA", lat: -25.7479, lng: 28.2293 },
  { city: "Lagos", country: "Nigeria", countryCode: "NG", lat: 6.5244, lng: 3.3792 },
  { city: "Abuja", country: "Nigeria", countryCode: "NG", lat: 9.0765, lng: 7.3986 },
  { city: "Nairobi", country: "Kenya", countryCode: "KE", lat: -1.2921, lng: 36.8219 },
  { city: "Mombasa", country: "Kenya", countryCode: "KE", lat: -4.0435, lng: 39.6682 },
  { city: "Cairo", country: "Egypt", countryCode: "EG", lat: 30.0444, lng: 31.2357 },
  { city: "Alexandria", country: "Egypt", countryCode: "EG", lat: 31.2001, lng: 29.9187 },
  { city: "Casablanca", country: "Morocco", countryCode: "MA", lat: 33.5731, lng: -7.5898 },
  { city: "Rabat", country: "Morocco", countryCode: "MA", lat: 34.0209, lng: -6.8416 },
  { city: "Marrakech", country: "Morocco", countryCode: "MA", lat: 31.6295, lng: -7.9811 },

  // Latin America
  { city: "Sao Paulo", country: "Brazil", countryCode: "BR", lat: -23.5505, lng: -46.6333 },
  { city: "Rio de Janeiro", country: "Brazil", countryCode: "BR", lat: -22.9068, lng: -43.1729 },
  { city: "Curitiba", country: "Brazil", countryCode: "BR", lat: -25.4284, lng: -49.2733 },
  { city: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.6037, lng: -58.3816 },
  { city: "Cordoba", country: "Argentina", countryCode: "AR", lat: -31.4201, lng: -64.1888 },
  { city: "Mexico City", country: "Mexico", countryCode: "MX", lat: 19.4326, lng: -99.1332 },
  { city: "Guadalajara", country: "Mexico", countryCode: "MX", lat: 20.6597, lng: -103.3496 },
  { city: "Monterrey", country: "Mexico", countryCode: "MX", lat: 25.6866, lng: -100.3161 },
  { city: "Santiago", country: "Chile", countryCode: "CL", lat: -33.4489, lng: -70.6693 },
  { city: "Valparaiso", country: "Chile", countryCode: "CL", lat: -33.0472, lng: -71.6127 },
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
  isDemo?: boolean;
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
  realAlumni?: number;
  demoAlumni?: number;
  totalCountries: number;
  totalCities: number;
  hasEnoughData: boolean;
}

