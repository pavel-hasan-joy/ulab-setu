"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  Globe2,
  Layers,
  Satellite,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Filter,
  X,
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { loadGoogleMapsScript } from "@/lib/google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { MapAlumniItem, PublicCityCluster, AlumniMapStats } from "@/lib/alumni-map";
import { Avatar, Badge, Button, Card, Input, Select } from "@/components/ui";

interface AlumniMapViewProps {
  initialItems?: MapAlumniItem[];
  initialClusters?: PublicCityCluster[];
  stats: AlumniMapStats;
  isPublicMode?: boolean;
  availableFilters?: {
    countries: string[];
    cities: string[];
    departments: string[];
    graduationYears: string[];
  };
  className?: string;
  height?: string;
  title?: string;
  subtitle?: string;
}

export function AlumniMapView({
  initialItems = [],
  initialClusters = [],
  stats,
  isPublicMode = false,
  availableFilters,
  className = "",
  height = "640px",
  title = "ULABians Around the World",
  subtitle = "Discover the global ULAB community. Find alumni across the world and connect with people who share your journey.",
}: AlumniMapViewProps) {
  // Map container reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // State
  const [mapMode, setMapMode] = useState<"roadmap" | "satellite">("roadmap");
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedAlumni, setSelectedAlumni] = useState<MapAlumniItem | null>(null);
  const [selectedCityCluster, setSelectedCityCluster] = useState<PublicCityCluster | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedGradYear, setSelectedGradYear] = useState<string>("ALL");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Filter items based on client-side search query and filter selections
  const filteredItems = useMemo(() => {
    if (isPublicMode) return [];
    return initialItems.filter((item) => {
      if (selectedCountry !== "ALL" && item.country.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false;
      }
      if (selectedCity !== "ALL" && item.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (selectedDepartment !== "ALL" && item.department !== selectedDepartment) {
        return false;
      }
      if (selectedGradYear !== "ALL" && item.graduationYear !== selectedGradYear) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCompany = item.company?.toLowerCase().includes(q);
        const matchesDesig = item.designation?.toLowerCase().includes(q);
        const matchesCity = item.city.toLowerCase().includes(q);
        const matchesCountry = item.country.toLowerCase().includes(q);
        const matchesDept = item.department?.toLowerCase().includes(q);
        if (!matchesName && !matchesCompany && !matchesDesig && !matchesCity && !matchesCountry && !matchesDept) {
          return false;
        }
      }
      return true;
    });
  }, [
    initialItems,
    isPublicMode,
    selectedCountry,
    selectedCity,
    selectedDepartment,
    selectedGradYear,
    searchQuery,
  ]);

  // Public clusters filtering
  const filteredClusters = useMemo(() => {
    if (!isPublicMode) return [];
    return initialClusters.filter((c) => {
      if (selectedCountry !== "ALL" && c.country.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false;
      }
      if (selectedCity !== "ALL" && c.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
      }
      return true;
    });
  }, [initialClusters, isPublicMode, selectedCountry, selectedCity, searchQuery]);

  // Derived filter options
  const filterOptions = useMemo(() => {
    if (availableFilters) return availableFilters;
    const countries = Array.from(new Set(initialItems.map((i) => i.country))).filter(Boolean).sort();
    const cities = Array.from(new Set(initialItems.map((i) => i.city))).filter(Boolean).sort();
    const departments = Array.from(new Set(initialItems.map((i) => i.department).filter(Boolean))) as string[];
    const graduationYears = Array.from(
      new Set(initialItems.map((i) => i.graduationYear).filter(Boolean))
    ) as string[];
    return {
      countries,
      cities,
      departments: departments.sort(),
      graduationYears: graduationYears.sort((a, b) => Number(b) - Number(a)),
    };
  }, [availableFilters, initialItems]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCountry !== "ALL" ||
    selectedCity !== "ALL" ||
    selectedDepartment !== "ALL" ||
    selectedGradYear !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCountry("ALL");
    setSelectedCity("ALL");
    setSelectedDepartment("ALL");
    setSelectedGradYear("ALL");
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 24.0, lng: 20.0 });
      mapInstanceRef.current.setZoom(2.5);
    }
  };

  // 1. Initialize Google Maps
  useEffect(() => {
    let isCancelled = false;

    if (!mapContainerRef.current) return;

    loadGoogleMapsScript()
      .then((maps) => {
        if (isCancelled || !mapContainerRef.current) return;

        // Custom stylish light roadmap styling
        const styledMapType = new maps.StyledMapType(
          [
            { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
            {
              featureType: "administrative.country",
              elementType: "geometry.stroke",
              stylers: [{ color: "#cbd5e1" }, { weight: 1 }],
            },
            {
              featureType: "administrative.province",
              elementType: "geometry.stroke",
              stylers: [{ color: "#e2e8f0" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#dbeafe" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#64748b" }],
            },
            {
              featureType: "landscape.natural",
              elementType: "geometry",
              stylers: [{ color: "#f1f5f9" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#ffffff" }],
            },
          ],
          { name: "ULAB Modern" }
        );

        const defaultCenter = { lat: 24.0, lng: 20.0 };
        const map = new maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 2.5,
          minZoom: 2,
          maxZoom: 18,
          mapTypeId: mapMode === "satellite" ? maps.MapTypeId.SATELLITE : "ulab_style",
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          backgroundColor: "#e2e8f0",
          gestureHandling: "greedy",
        });

        map.mapTypes.set("ulab_style", styledMapType);
        if (mapMode === "roadmap") {
          map.setMapTypeId("ulab_style");
        }

        mapInstanceRef.current = map;
        setMapLoaded(true);
        setMapError(null);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn("Google Maps script load status:", err.message);
          setMapError(err.message);
          setMapLoaded(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Handle Roadmap / Satellite switch
  const handleToggleMapMode = (mode: "roadmap" | "satellite") => {
    setMapMode(mode);
    if (!mapInstanceRef.current || !window.google?.maps) return;

    if (mode === "satellite") {
      mapInstanceRef.current.setMapTypeId(window.google.maps.MapTypeId.SATELLITE);
    } else {
      mapInstanceRef.current.setMapTypeId("ulab_style");
    }
  };

  // 3. Reset map view to global
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setCenter({ lat: 24.0, lng: 20.0 });
    mapInstanceRef.current.setZoom(2.5);
    setSelectedAlumni(null);
    setSelectedCityCluster(null);
  };

  // 4. Zoom Controls
  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    const current = mapInstanceRef.current.getZoom() || 2;
    mapInstanceRef.current.setZoom(current + 1);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    const current = mapInstanceRef.current.getZoom() || 2;
    mapInstanceRef.current.setZoom(Math.max(2, current - 1));
  };

  // 5. Render markers & clusters
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    const maps = window.google.maps;
    const map = mapInstanceRef.current;

    // Clear existing markers and clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Create marker icons
    const createAlumniIcon = () => ({
      path: maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: "#0b57d0",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2.5,
    });

    const createClusterIcon = (count: number) => {
      const radius = count > 20 ? 18 : count > 5 ? 15 : 12;
      return {
        path: maps.SymbolPath.CIRCLE,
        scale: radius,
        fillColor: "#0284c7",
        fillOpacity: 0.9,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      };
    };

    if (isPublicMode) {
      // Public mode: render city clusters only
      const newMarkers = filteredClusters.map((cluster) => {
        const marker = new maps.Marker({
          position: { lat: cluster.lat, lng: cluster.lng },
          map,
          title: `${cluster.city}, ${cluster.country} (${cluster.count} alumni)`,
          icon: createClusterIcon(cluster.count),
          label: {
            text: String(cluster.count),
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "bold",
          },
        });

        marker.addListener("click", () => {
          setSelectedCityCluster(cluster);
          map.panTo({ lat: cluster.lat, lng: cluster.lng });
          map.setZoom(Math.max(map.getZoom() || 2, 7));
        });

        return marker;
      });

      markersRef.current = newMarkers;
    } else {
      // Authenticated mode: render individual alumni markers with clustering
      const newMarkers = filteredItems.map((alumnus) => {
        const marker = new maps.Marker({
          position: { lat: alumnus.lat, lng: alumnus.lng },
          title: `${alumnus.name} — ${alumnus.city}, ${alumnus.country}`,
          icon: createAlumniIcon(),
        });

        marker.addListener("click", () => {
          setSelectedAlumni(alumnus);
          map.panTo({ lat: alumnus.lat, lng: alumnus.lng });
          map.setZoom(Math.max(map.getZoom() || 2, 8));
        });

        return marker;
      });

      markersRef.current = newMarkers;

      // Initialize Clusterer
      clustererRef.current = new MarkerClusterer({
        map,
        markers: newMarkers,
      });
    }
  }, [mapLoaded, isPublicMode, filteredItems, filteredClusters]);

  // Center on country when selected
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedCity("ALL");
    if (!mapInstanceRef.current) return;

    if (country === "ALL") {
      handleResetView();
      return;
    }

    // Find first matching location in this country
    const target = isPublicMode
      ? filteredClusters.find((c) => c.country.toLowerCase() === country.toLowerCase())
      : filteredItems.find((i) => i.country.toLowerCase() === country.toLowerCase());

    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: target.lat, lng: target.lng });
      mapInstanceRef.current.setZoom(5);
    }
  };

  // Center on city when selected
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (!mapInstanceRef.current) return;

    if (city === "ALL") {
      if (selectedCountry !== "ALL") {
        handleCountryChange(selectedCountry);
      } else {
        handleResetView();
      }
      return;
    }

    const target = isPublicMode
      ? filteredClusters.find((c) => c.city.toLowerCase() === city.toLowerCase())
      : filteredItems.find((i) => i.city.toLowerCase() === city.toLowerCase());

    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: target.lat, lng: target.lng });
      mapInstanceRef.current.setZoom(9);
    }
  };

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-3xl border border-mist bg-surface shadow-soft ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col gap-4 border-b border-mist/70 bg-paper/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-sky text-ulab">
              <Globe2 size={16} />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">{title}</h2>
          </div>
          <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">{subtitle}</p>
        </div>

        {/* Global Statistics Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 rounded-xl border border-mist bg-surface px-3 py-1.5 text-xs shadow-xs">
            <div>
              <span className="font-semibold text-ulab-deep">{stats.totalAlumni}</span>
              <span className="ml-1 text-ink-soft">Alumni</span>
            </div>
            <div className="h-3 w-px bg-mist" />
            <div>
              <span className="font-semibold text-ulab-deep">{stats.totalCountries}</span>
              <span className="ml-1 text-ink-soft">Countries</span>
            </div>
            <div className="h-3 w-px bg-mist" />
            <div>
              <span className="font-semibold text-ulab-deep">{stats.totalCities}</span>
              <span className="ml-1 text-ink-soft">Cities</span>
            </div>
          </div>

          {/* Map / Satellite Mode Toggle */}
          <div className="inline-flex rounded-xl border border-mist bg-surface p-0.5 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => handleToggleMapMode("roadmap")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
                mapMode === "roadmap"
                  ? "bg-ulab text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Layers size={13} />
              <span>Map</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleMapMode("satellite")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
                mapMode === "satellite"
                  ? "bg-ulab text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Satellite size={13} />
              <span>Satellite</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-mist/70 bg-surface/90 px-5 py-2.5 text-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Keyword Search */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, city..."
              className="w-full rounded-lg border border-mist bg-paper pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none focus:ring-1 focus:ring-ulab"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Country Filter */}
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="rounded-lg border border-mist bg-paper px-2.5 py-1.5 text-xs text-ink focus:border-ulab focus:outline-none"
          >
            <option value="ALL">All Countries ({filterOptions.countries.length})</option>
            {filterOptions.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="rounded-lg border border-mist bg-paper px-2.5 py-1.5 text-xs text-ink focus:border-ulab focus:outline-none"
          >
            <option value="ALL">All Cities ({filterOptions.cities.length})</option>
            {filterOptions.cities.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>

          {!isPublicMode && (
            <>
              {/* Department Filter */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="hidden rounded-lg border border-mist bg-paper px-2.5 py-1.5 text-xs text-ink sm:block focus:border-ulab focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {filterOptions.departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Graduation Year Filter */}
              <select
                value={selectedGradYear}
                onChange={(e) => setSelectedGradYear(e.target.value)}
                className="hidden rounded-lg border border-mist bg-paper px-2.5 py-1.5 text-xs text-ink md:block focus:border-ulab focus:outline-none"
              >
                <option value="ALL">All Batches</option>
                {filterOptions.graduationYears.map((y) => (
                  <option key={y} value={y}>
                    Class of {y}
                  </option>
                ))}
              </select>
            </>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Results Counter */}
        <div className="text-xs text-ink-soft">
          Showing{" "}
          <span className="font-semibold text-ink">
            {isPublicMode ? filteredClusters.length : filteredItems.length}
          </span>{" "}
          locations
        </div>
      </div>

      {/* Main Map Container Area */}
      <div className="relative w-full overflow-hidden" style={{ height }}>
        {/* Real Google Maps DIV */}
        <div ref={mapContainerRef} className="size-full" />

        {/* Floating Map Controls (Top Right) */}
        <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5 rounded-xl border border-mist/80 bg-paper/95 p-1 shadow-md backdrop-blur-xs">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-sky hover:text-ink transition"
          >
            <span className="text-lg font-bold leading-none">+</span>
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-sky hover:text-ink transition"
          >
            <span className="text-lg font-bold leading-none">−</span>
          </button>
          <div className="my-0.5 h-px bg-mist" />
          <button
            type="button"
            onClick={handleResetView}
            title="Reset Global View"
            className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-sky hover:text-ink transition"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Map Legend (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-10 hidden rounded-xl border border-mist/80 bg-paper/95 px-3 py-2 text-xs shadow-md backdrop-blur-xs sm:block">
          <p className="font-semibold text-ink">Map Legend</p>
          <div className="mt-1 flex items-center gap-3 text-ink-soft">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-ulab shadow-xs" />
              <span>Verified Alumni</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3.5 rounded-full bg-sky text-[9px] font-bold text-ulab-deep grid place-items-center border border-ulab">
                #
              </span>
              <span>Cluster</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={13} />
              <span>City-Center Approx</span>
            </div>
          </div>
        </div>

        {/* Graceful Fallback Overlay if Google Maps Key is Missing or Fails to Load */}
        {mapError && (
          <div className="absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-br from-paper via-sky/20 to-surface p-6">
            <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-center dark:border-amber-900/50 dark:bg-amber-950/40">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <Globe2 size={20} />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-ink">
                Global Explorer Ready (Offline / Keyless Mode)
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                Google Maps tiles can be connected with <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px] text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
                All alumni networking, city discovery, and filters are fully interactive below.
              </p>
            </div>

            {/* Interactive Location Discovery Grid (Graceful Fallback Mode) */}
            <div className="my-auto grid max-h-[400px] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
              {(isPublicMode ? filteredClusters : filteredItems).slice(0, 9).map((item: any) => (
                <div
                  key={item.id || `${item.city}-${item.country}`}
                  onClick={() => (!isPublicMode ? setSelectedAlumni(item) : setSelectedCityCluster(item))}
                  className="cursor-pointer rounded-xl border border-mist bg-surface p-3 transition hover:border-ulab hover:shadow-soft"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-ink text-sm">{item.name || item.city}</p>
                      <p className="text-xs text-ink-soft flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-ulab" />
                        {item.city}, {item.country}
                      </p>
                    </div>
                    {item.count ? (
                      <Badge tone="blue">{item.count} Alumni</Badge>
                    ) : (
                      <Badge tone="gold">{item.graduationYear || "Alumni"}</Badge>
                    )}
                  </div>
                  {item.company && (
                    <p className="mt-2 text-xs text-ink-soft truncate">
                      {item.designation} at <span className="font-medium text-ink">{item.company}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center text-xs text-ink-soft">
              {stats.totalAlumni} verified alumni registered across {stats.totalCountries} countries
            </div>
          </div>
        )}

        {/* Selected Alumni Profile Preview Popup */}
        {selectedAlumni && (
          <div className="absolute bottom-5 right-5 z-30 w-full max-w-sm rounded-2xl border border-mist bg-paper/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
            <button
              type="button"
              onClick={() => setSelectedAlumni(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-ink-soft hover:bg-sky hover:text-ink"
            >
              <X size={15} />
            </button>

            <div className="flex items-start gap-3">
              <Avatar name={selectedAlumni.name} src={selectedAlumni.image} size={50} />
              <div className="flex-1 pr-6">
                <h4 className="font-display font-semibold text-ink text-base">{selectedAlumni.name}</h4>
                <p className="text-xs text-ink-soft flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-ulab" />
                  {selectedAlumni.city}, {selectedAlumni.country}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 rounded-xl border border-mist/80 bg-surface/80 p-2.5 text-xs">
              {selectedAlumni.department && (
                <div className="flex items-center gap-1.5 text-ink">
                  <GraduationCap size={13} className="text-ink-soft" />
                  <span>
                    {selectedAlumni.department}
                    {selectedAlumni.graduationYear && ` (${selectedAlumni.graduationYear})`}
                  </span>
                </div>
              )}
              {selectedAlumni.company && (
                <div className="flex items-center gap-1.5 text-ink">
                  <Briefcase size={13} className="text-ink-soft" />
                  <span>
                    {selectedAlumni.designation ? `${selectedAlumni.designation} at ` : ""}
                    <strong>{selectedAlumni.company}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Link
                href={`/student/people?q=${encodeURIComponent(selectedAlumni.name)}`}
                className="flex-1 rounded-xl bg-ulab px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-ulab-deep shadow-xs"
              >
                View Full Profile
              </Link>
              <Button
                variant="outline"
                onClick={() => setSelectedAlumni(null)}
                className="text-xs py-2 px-3"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Public Cluster Preview Modal */}
        {selectedCityCluster && (
          <div className="absolute bottom-5 right-5 z-30 w-full max-w-xs rounded-2xl border border-mist bg-paper/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
            <button
              type="button"
              onClick={() => setSelectedCityCluster(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-ink-soft hover:bg-sky hover:text-ink"
            >
              <X size={15} />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-sky text-ulab">
                <MapPin size={18} />
              </span>
              <div>
                <h4 className="font-semibold text-ink">{selectedCityCluster.city}</h4>
                <p className="text-xs text-ink-soft">{selectedCityCluster.country}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-mist bg-surface p-3 text-center">
              <p className="text-2xl font-bold text-ulab-deep">{selectedCityCluster.count}</p>
              <p className="text-xs text-ink-soft">Verified ULAB Alumni in this hub</p>
            </div>

            <p className="mt-2 text-center text-[11px] text-ink-soft">
              Sign in to ULAB Setu to discover member profiles and connect with alumni in {selectedCityCluster.city}.
            </p>

            <div className="mt-3">
              <Link
                href="/login?next=/student/people"
                className="block w-full rounded-xl bg-ulab py-2 text-center text-xs font-semibold text-white shadow-xs hover:bg-ulab-deep"
              >
                Sign In to Connect
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

