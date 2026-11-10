"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import {
  resolveLocationData,
  validateCoordinates,
  type MapAlumniItem,
  type PublicCityCluster,
  type AlumniMapStats,
  type LocationVisibilityPreference,
} from "@/lib/alumni-map";

/**
 * Public aggregate map endpoint for homepage & guest visitors.
 * Strictly anonymous: only exposes city-level counts, never individual identities.
 */
export async function getPublicAlumniMapPayload(): Promise<{
  clusters: PublicCityCluster[];
  stats: AlumniMapStats;
}> {
  try {
    const publicAlumni = await db.user.findMany({
      where: {
        role: "ALUMNI",
        status: "APPROVED",
        alumniVerified: true,
        deletedAt: null,
        mapLocationVisibility: "PUBLIC",
        latitude: { not: null },
        longitude: { not: null },
        city: { not: null },
        country: { not: null },
      },
      select: {
        city: true,
        country: true,
        countryCode: true,
        latitude: true,
        longitude: true,
      },
    });

    const clusterMap = new Map<string, PublicCityCluster>();
    const countriesSet = new Set<string>();
    const citiesSet = new Set<string>();

    for (const a of publicAlumni) {
      if (!a.city || !a.country || a.latitude === null || a.longitude === null) continue;
      const key = `${a.city.toLowerCase()}:${a.country.toLowerCase()}`;
      countriesSet.add(a.country);
      citiesSet.add(a.city);

      const existing = clusterMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        clusterMap.set(key, {
          city: a.city,
          country: a.country,
          countryCode: a.countryCode,
          lat: a.latitude,
          lng: a.longitude,
          count: 1,
        });
      }
    }

    const clusters = Array.from(clusterMap.values()).sort((a, b) => b.count - a.count);
    const stats: AlumniMapStats = {
      totalAlumni: publicAlumni.length,
      totalCountries: countriesSet.size,
      totalCities: citiesSet.size,
      hasEnoughData: publicAlumni.length > 0,
    };

    return { clusters, stats };
  } catch (err) {
    console.error("Failed to load public alumni map data:", err);
    return {
      clusters: [],
      stats: { totalAlumni: 0, totalCountries: 0, totalCities: 0, hasEnoughData: false },
    };
  }
}

export interface AlumniMapFilters {
  q?: string;
  country?: string;
  city?: string;
  department?: string;
  graduationYear?: string;
  company?: string;
}

/**
 * Authenticated & Verified Member map endpoint.
 * Returns individual authorized alumni pins for members who opted into PUBLIC or MEMBERS_ONLY visibility.
 */
export async function getVerifiedAlumniMapPayload(filters?: AlumniMapFilters): Promise<{
  items: MapAlumniItem[];
  stats: AlumniMapStats;
  availableFilters: {
    countries: string[];
    cities: string[];
    departments: string[];
    graduationYears: string[];
  };
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Unauthenticated fallback
      const pub = await getPublicAlumniMapPayload();
      return {
        items: [],
        stats: pub.stats,
        availableFilters: { countries: [], cities: [], departments: [], graduationYears: [] },
      };
    }

    const q = filters?.q?.trim() || "";
    const country = filters?.country?.trim() || undefined;
    const city = filters?.city?.trim() || undefined;
    const department = filters?.department?.trim() || undefined;
    const graduationYear = filters?.graduationYear?.trim() || undefined;
    const company = filters?.company?.trim() || undefined;

    // Fetch verified alumni who have allowed either PUBLIC or MEMBERS_ONLY map location
    const alumni = await db.user.findMany({
      where: {
        role: "ALUMNI",
        status: "APPROVED",
        alumniVerified: true,
        deletedAt: null,
        mapLocationVisibility: { in: ["PUBLIC", "MEMBERS_ONLY"] },
        latitude: { not: null },
        longitude: { not: null },
        city: { not: null },
        country: { not: null },
        ...(country && { country: { equals: country, mode: "insensitive" } }),
        ...(city && { city: { equals: city, mode: "insensitive" } }),
        ...(department && { department: { equals: department, mode: "insensitive" } }),
        ...(graduationYear && { graduationYear: { equals: graduationYear } }),
        ...(company && { company: { contains: company, mode: "insensitive" } }),
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
            { designation: { contains: q, mode: "insensitive" } },
            { skills: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
            { department: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        image: true,
        department: true,
        graduationYear: true,
        company: true,
        designation: true,
        city: true,
        country: true,
        countryCode: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { graduationYear: "desc" },
    });

    const items: MapAlumniItem[] = alumni
      .filter((a) => a.city && a.country && a.latitude !== null && a.longitude !== null)
      .map((a) => ({
        id: a.id,
        name: a.name,
        image: a.image,
        department: a.department,
        graduationYear: a.graduationYear,
        company: a.company,
        designation: a.designation,
        city: a.city!,
        country: a.country!,
        countryCode: a.countryCode,
        lat: a.latitude!,
        lng: a.longitude!,
      }));

    // Aggregate filters based on active opt-in alumni
    const countriesSet = new Set<string>();
    const citiesSet = new Set<string>();
    const departmentsSet = new Set<string>();
    const gradYearsSet = new Set<string>();

    for (const item of items) {
      if (item.country) countriesSet.add(item.country);
      if (item.city) citiesSet.add(item.city);
      if (item.department) departmentsSet.add(item.department);
      if (item.graduationYear) gradYearsSet.add(item.graduationYear);
    }

    const stats: AlumniMapStats = {
      totalAlumni: items.length,
      totalCountries: countriesSet.size,
      totalCities: citiesSet.size,
      hasEnoughData: items.length > 0,
    };

    return {
      items,
      stats,
      availableFilters: {
        countries: Array.from(countriesSet).sort(),
        cities: Array.from(citiesSet).sort(),
        departments: Array.from(departmentsSet).sort(),
        graduationYears: Array.from(gradYearsSet).sort((a, b) => Number(b) - Number(a)),
      },
    };
  } catch (err) {
    console.error("Failed to load verified alumni map data:", err);
    return {
      items: [],
      stats: { totalAlumni: 0, totalCountries: 0, totalCities: 0, hasEnoughData: false },
      availableFilters: { countries: [], cities: [], departments: [], graduationYears: [] },
    };
  }
}

/**
 * Updates the current alumnus's location and map privacy settings.
 */
export async function updateAlumniMapLocation(params: {
  city?: string | null;
  country?: string | null;
  mapLocationVisibility: LocationVisibilityPreference;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const user = await requireUser();

    const validVisibilities: LocationVisibilityPreference[] = [
      "HIDDEN",
      "MEMBERS_ONLY",
      "PUBLIC",
    ];
    const visibility = validVisibilities.includes(params.mapLocationVisibility)
      ? params.mapLocationVisibility
      : "HIDDEN";

    const resolved = resolveLocationData(
      params.city,
      params.country,
      params.latitude,
      params.longitude
    );

    // If opting in, coordinates must be available
    if (visibility !== "HIDDEN" && (!resolved.latitude || !resolved.longitude)) {
      return {
        success: false,
        error:
          "Please specify a recognized city or valid coordinates to display your location on the map.",
      };
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        city: resolved.city,
        country: resolved.country,
        countryCode: resolved.countryCode,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        mapLocationVisibility: visibility,
      },
    });

    revalidatePath("/student/people");
    revalidatePath("/alumni/people");
    revalidatePath("/");

    return {
      success: true,
      message:
        visibility === "HIDDEN"
          ? "Your location is now hidden from the alumni map."
          : `Location saved: ${resolved.city}, ${resolved.country} (${
              visibility === "PUBLIC" ? "Public" : "Members Only"
            }).`,
    };
  } catch (err) {
    console.error("Update alumni map location failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update location settings.",
    };
  }
}

