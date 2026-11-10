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
  X,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ArrowUpRight,
  Info,
} from "lucide-react";
import {
  Map as MapLibreInstance,
  Popup as MapLibrePopup,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Feature, Point } from "geojson";
import {
  MAP_CONFIG,
  SATELLITE_SOURCE_ID,
  SATELLITE_LAYER_ID,
  ALUMNI_GEOJSON_SOURCE_ID,
  CLUSTERS_LAYER_ID,
  CLUSTER_COUNT_LAYER_ID,
  UNCLUSTERED_POINT_LAYER_ID,
} from "@/lib/map-config";
import type { MapAlumniItem, PublicCityCluster, AlumniMapStats } from "@/lib/alumni-map";
import { Avatar, Badge } from "@/components/ui";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreInstance | null>(null);
  const popupRef = useRef<MapLibrePopup | null>(null);

  // Mode and view state
  const [mapMode, setMapMode] = useState<"map" | "satellite">("map");
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedAlumni, setSelectedAlumni] = useState<MapAlumniItem | null>(null);
  const [selectedCityCluster, setSelectedCityCluster] = useState<PublicCityCluster | null>(null);
  const [showAttributionModal, setShowAttributionModal] = useState<boolean>(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedGradYear, setSelectedGradYear] = useState<string>("ALL");

  // Filter options derived from props or items
  const filterOptions = useMemo(() => {
    if (availableFilters) {
      return availableFilters;
    }

    const countries = new Set<string>();
    const cities = new Set<string>();
    const departments = new Set<string>();
    const graduationYears = new Set<string>();

    if (isPublicMode) {
      initialClusters.forEach((c) => {
        if (c.country) countries.add(c.country);
        if (c.city) cities.add(c.city);
      });
    } else {
      initialItems.forEach((i) => {
        if (i.country) countries.add(i.country);
        if (i.city) cities.add(i.city);
        if (i.department) departments.add(i.department);
        if (i.graduationYear) graduationYears.add(i.graduationYear);
      });
    }

    return {
      countries: Array.from(countries).sort(),
      cities: Array.from(cities).sort(),
      departments: Array.from(departments).sort(),
      graduationYears: Array.from(graduationYears).sort((a, b) => Number(b) - Number(a)),
    };
  }, [availableFilters, initialItems, initialClusters, isPublicMode]);

  // Filtered dataset
  const filteredItems = useMemo(() => {
    if (isPublicMode) return [];
    return initialItems.filter((item) => {
      if (selectedCountry !== "ALL" && item.country.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false;
      }
      if (selectedCity !== "ALL" && item.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (
        selectedDepartment !== "ALL" &&
        item.department?.toLowerCase() !== selectedDepartment.toLowerCase()
      ) {
        return false;
      }
      if (selectedGradYear !== "ALL" && item.graduationYear !== selectedGradYear) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCompany = item.company?.toLowerCase().includes(q);
        const matchesDesignation = item.designation?.toLowerCase().includes(q);
        const matchesCity = item.city.toLowerCase().includes(q);
        const matchesDept = item.department?.toLowerCase().includes(q);
        return Boolean(matchesName || matchesCompany || matchesDesignation || matchesCity || matchesDept);
      }
      return true;
    });
  }, [initialItems, isPublicMode, selectedCountry, selectedCity, selectedDepartment, selectedGradYear, searchQuery]);

  const filteredClusters = useMemo(() => {
    if (!isPublicMode) return [];
    return initialClusters.filter((cluster) => {
      if (selectedCountry !== "ALL" && cluster.country.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false;
      }
      if (selectedCity !== "ALL" && cluster.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return cluster.city.toLowerCase().includes(q) || cluster.country.toLowerCase().includes(q);
      }
      return true;
    });
  }, [initialClusters, isPublicMode, selectedCountry, selectedCity, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCountry !== "ALL" ||
    selectedCity !== "ALL" ||
    selectedDepartment !== "ALL" ||
    selectedGradYear !== "ALL";

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCountry("ALL");
    setSelectedCity("ALL");
    setSelectedDepartment("ALL");
    setSelectedGradYear("ALL");
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: MAP_CONFIG.initialCenter,
        zoom: MAP_CONFIG.initialZoom,
        duration: 800,
      });
    }
  }, []);

  // Build GeoJSON FeatureCollection
  const geojsonData = useMemo<FeatureCollection>(() => {
    if (isPublicMode) {
      return {
        type: "FeatureCollection",
        features: filteredClusters.map((cluster) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [cluster.lng, cluster.lat],
          },
          properties: {
            id: `cluster-${cluster.city}-${cluster.country}`,
            name: cluster.city,
            city: cluster.city,
            country: cluster.country,
            count: cluster.count,
            isPublicCluster: true,
          },
        })),
      };
    }

    return {
      type: "FeatureCollection",
      features: filteredItems.map((alumnus) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [alumnus.lng, alumnus.lat],
        },
        properties: {
          id: alumnus.id,
          name: alumnus.name,
          image: alumnus.image || "",
          department: alumnus.department || "",
          graduationYear: alumnus.graduationYear || "",
          company: alumnus.company || "",
          designation: alumnus.designation || "",
          city: alumnus.city,
          country: alumnus.country,
          isDemo: Boolean(alumnus.isDemo),
          isPublicCluster: false,
        },
      })),
    };
  }, [filteredItems, filteredClusters, isPublicMode]);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isDark = false;
    if (typeof document !== "undefined") {
      isDark = document.documentElement.classList.contains("dark");
    }

    const styleUrl = isDark ? MAP_CONFIG.roadmapStyleDark : MAP_CONFIG.roadmapStyleLight;

    try {
      const map = new MapLibreInstance({
        container: containerRef.current,
        style: styleUrl,
        center: MAP_CONFIG.initialCenter,
        zoom: MAP_CONFIG.initialZoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        attributionControl: false, // Custom attribution panel
      });

      map.on("load", () => {
        // 1. Add Satellite Raster Source & Layer (preloaded for instant switching)
        map.addSource(SATELLITE_SOURCE_ID, {
          type: "raster",
          tiles: MAP_CONFIG.satelliteTiles,
          tileSize: MAP_CONFIG.satelliteTileSize,
          maxzoom: MAP_CONFIG.satelliteMaxZoom,
          attribution: MAP_CONFIG.satelliteAttribution,
        });

        // Insert satellite imagery before labels/text layers if possible, or as bottom raster
        const layers = map.getStyle().layers;
        let firstSymbolId: string | undefined;
        if (layers) {
          for (const l of layers) {
            if (l.type === "symbol") {
              firstSymbolId = l.id;
              break;
            }
          }
        }

        map.addLayer(
          {
            id: SATELLITE_LAYER_ID,
            type: "raster",
            source: SATELLITE_SOURCE_ID,
            layout: {
              visibility: "none",
            },
            paint: {
              "raster-opacity": 1.0,
              "raster-fade-duration": 250,
            },
          },
          firstSymbolId
        );

        // 2. Add GeoJSON points source with native clustering
        map.addSource(ALUMNI_GEOJSON_SOURCE_ID, {
          type: "geojson",
          data: geojsonData,
          cluster: true,
          clusterMaxZoom: 13,
          clusterRadius: 45,
        });

        // 3. Clustered circles layer
        map.addLayer({
          id: CLUSTERS_LAYER_ID,
          type: "circle",
          source: ALUMNI_GEOJSON_SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#005691", // ULAB Navy
              4,
              "#0284c7", // Sky blue
              15,
              "#003865", // Deep Navy
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              16,
              4,
              22,
              15,
              28,
            ],
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
          },
        });

        // 4. Cluster Count text layer
        map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: "symbol",
          source: ALUMNI_GEOJSON_SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-size": 12,
            "text-font": ["Noto Sans Bold", "Open Sans Bold"],
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        // 5. Unclustered individual markers layer
        map.addLayer({
          id: UNCLUSTERED_POINT_LAYER_ID,
          type: "circle",
          source: ALUMNI_GEOJSON_SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#005691",
            "circle-radius": 7.5,
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Interactivity: Cluster click zooms smoothly into cluster
        map.on("click", CLUSTERS_LAYER_ID, async (e: MapLayerMouseEvent) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [CLUSTERS_LAYER_ID] });
          if (!features.length) return;
          const clusterId = features[0].properties?.cluster_id;
          const source = map.getSource(ALUMNI_GEOJSON_SOURCE_ID) as GeoJSONSource;
          if (clusterId && source && typeof source.getClusterExpansionZoom === "function") {
            try {
              const zoom = await source.getClusterExpansionZoom(clusterId);
              const geom = features[0].geometry as Point;
              map.easeTo({
                center: geom.coordinates as [number, number],
                zoom: Math.min(zoom + 0.5, 14),
                duration: 600,
              });
            } catch {
              // Graceful fallback zoom
              const geom = features[0].geometry as Point;
              map.easeTo({
                center: geom.coordinates as [number, number],
                zoom: map.getZoom() + 2,
                duration: 600,
              });
            }
          }
        });

        // Interactivity: Click unclustered point shows preview card
        map.on("click", UNCLUSTERED_POINT_LAYER_ID, (e: MapLayerMouseEvent) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [UNCLUSTERED_POINT_LAYER_ID] });
          if (!features.length) return;
          const props = features[0].properties;

          if (props?.isPublicCluster) {
            setSelectedCityCluster({
              city: props.city,
              country: props.country,
              countryCode: props.countryCode || "",
              lat: (features[0].geometry as Point).coordinates[1],
              lng: (features[0].geometry as Point).coordinates[0],
              count: Number(props.count || 1),
            });
            setSelectedAlumni(null);
          } else {
            setSelectedAlumni({
              id: props.id,
              name: props.name,
              image: props.image || null,
              department: props.department,
              graduationYear: props.graduationYear,
              company: props.company,
              designation: props.designation,
              city: props.city,
              country: props.country,
              countryCode: props.countryCode || "",
              lat: (features[0].geometry as Point).coordinates[1],
              lng: (features[0].geometry as Point).coordinates[0],
              isDemo: props.isDemo === true || props.isDemo === "true",
            });
            setSelectedCityCluster(null);
          }

          map.easeTo({
            center: (features[0].geometry as Point).coordinates as [number, number],
            duration: 400,
          });
        });

        // Cursor state
        map.on("mouseenter", CLUSTERS_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", CLUSTERS_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", UNCLUSTERED_POINT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", UNCLUSTERED_POINT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });

        setMapLoaded(true);
      });

      map.on("error", (e: any) => {
        console.warn("MapLibre tile event warning:", e.error?.message || e);
      });

      mapRef.current = map;
    } catch (err: any) {
      console.error("MapLibre GL initialization error:", err);
      setMapError("Could not initialize WebGL map canvas. Please ensure hardware acceleration is enabled.");
    }

    return () => {
      if (popupRef.current) popupRef.current.remove();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update GeoJSON source whenever filters change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const source = mapRef.current.getSource(ALUMNI_GEOJSON_SOURCE_ID) as GeoJSONSource | undefined;
    if (source && typeof source.setData === "function") {
      source.setData(geojsonData);
    }
  }, [geojsonData, mapLoaded]);

  // Seamless Map / Satellite Switching (Instant raster layer toggle, 0 map recreation)
  const handleToggleMapMode = (nextMode: "map" | "satellite") => {
    setMapMode(nextMode);
    if (!mapRef.current || !mapLoaded) return;
    try {
      if (mapRef.current.getLayer(SATELLITE_LAYER_ID)) {
        mapRef.current.setLayoutProperty(
          SATELLITE_LAYER_ID,
          "visibility",
          nextMode === "satellite" ? "visible" : "none"
        );
      }
    } catch (err) {
      console.warn("Error toggling satellite layer:", err);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut({ duration: 300 });
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: MAP_CONFIG.initialCenter,
        zoom: MAP_CONFIG.initialZoom,
        duration: 800,
      });
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current?.parentElement) return;
    if (!document.fullscreenElement) {
      containerRef.current.parentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Center on Country
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedCity("ALL");
    if (!mapRef.current) return;

    if (country === "ALL") {
      handleResetView();
      return;
    }

    const target = isPublicMode
      ? filteredClusters.find((c) => c.country.toLowerCase() === country.toLowerCase())
      : filteredItems.find((i) => i.country.toLowerCase() === country.toLowerCase());

    if (target) {
      mapRef.current.easeTo({
        center: [target.lng, target.lat],
        zoom: 4.8,
        duration: 800,
      });
    }
  };

  // Center on City
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (!mapRef.current) return;

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

    if (target) {
      mapRef.current.easeTo({
        center: [target.lng, target.lat],
        zoom: 8.5,
        duration: 800,
      });
    }
  };

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-3xl border border-mist bg-surface shadow-soft transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : ""
      } ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 border-b border-mist/70 bg-paper/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-sky text-ulab">
              <Globe2 size={16} />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">{title}</h2>
          </div>
          <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">{subtitle}</p>
        </div>

        {/* Global Statistics Counter & Map Mode Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 rounded-xl border border-mist bg-surface px-3 py-1.5 text-xs shadow-xs">
            <div>
              <span className="font-semibold text-ulab-deep">{stats.totalAlumni}</span>
              <span className="ml-1 text-ink-soft">Alumni</span>
            </div>
            {stats.realAlumni !== undefined && stats.demoAlumni !== undefined && stats.demoAlumni > 0 && (
              <div className="flex items-center gap-1.5 border-l border-mist pl-3 text-[10px]">
                <span className="rounded-md bg-sky px-1.5 py-0.5 font-medium text-ulab">{stats.realAlumni} Real</span>
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  {stats.demoAlumni} Demo
                </span>
              </div>
            )}
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
              onClick={() => handleToggleMapMode("map")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                mapMode === "map"
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
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
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
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-mist/70 bg-surface/95 px-5 py-2.5 text-xs">
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
          {isPublicMode ? "city hubs" : "alumni"}
        </div>
      </div>

      {/* Main Map Container Canvas */}
      <div
        className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-900"
        style={{ height: isFullscreen ? "calc(100vh - 120px)" : height }}
      >
        {/* Real MapLibre GL Canvas DIV */}
        <div ref={containerRef} className="size-full" />

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
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-sky hover:text-ink transition"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>

        {/* Map Legend (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-10 hidden rounded-xl border border-mist/80 bg-paper/95 px-3 py-2 text-xs shadow-md backdrop-blur-xs sm:block">
          <p className="font-semibold text-ink">Network Legend</p>
          <div className="mt-1 flex items-center gap-3 text-ink-soft">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-ulab shadow-xs" />
              <span>Verified Alumni</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-4 rounded-full bg-ulab text-[10px] font-bold text-white grid place-items-center border border-white">
                #
              </span>
              <span>Regional Cluster</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={13} />
              <span>City-Center Approx</span>
            </div>
          </div>
        </div>

        {/* Map Attribution Bar (Bottom Right) */}
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 rounded-lg border border-mist/60 bg-paper/90 px-2.5 py-1 text-[11px] text-ink-soft backdrop-blur-xs">
          <span>
            {mapMode === "satellite" ? "Imagery: EOxCloudless Sentinel-2" : "Map: OpenFreeMap / OSM"}
          </span>
          <button
            type="button"
            onClick={() => setShowAttributionModal(!showAttributionModal)}
            className="text-ulab hover:underline ml-1"
          >
            <Info size={11} className="inline" />
          </button>
        </div>

        {/* Attribution & Data License Dialog */}
        {showAttributionModal && (
          <div className="absolute bottom-10 right-2 z-20 max-w-xs rounded-xl border border-mist bg-paper p-3 text-xs shadow-lg">
            <div className="flex items-center justify-between font-semibold text-ink">
              <span>Map & Imagery Attributions</span>
              <button
                type="button"
                onClick={() => setShowAttributionModal(false)}
                className="text-ink-soft hover:text-ink"
              >
                <X size={13} />
              </button>
            </div>
            <div className="mt-2 space-y-1.5 text-ink-soft">
              <p>
                <strong>Vector Map:</strong> &copy;{" "}
                <a href="https://openfreemap.org" target="_blank" rel="noreferrer" className="text-ulab underline">
                  OpenFreeMap
                </a>{" "}
                &copy;{" "}
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-ulab underline">
                  OpenStreetMap
                </a>{" "}
                contributors.
              </p>
              <p>
                <strong>Satellite Imagery:</strong> EOxCloudless &copy; EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2020). 10-metre global cloudless optical mosaic.
              </p>
              <p className="text-[10px] text-ink-soft/80">
                Privacy Notice: Coordinates represent municipal city-centers only; private residential addresses and real-time GPS locations are never collected or stored.
              </p>
            </div>
          </div>
        )}

        {/* Empty State Overlay if 0 items match active filters */}
        {mapLoaded && (isPublicMode ? filteredClusters.length === 0 : filteredItems.length === 0) && (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center px-4">
            <div className="pointer-events-auto rounded-2xl border border-mist bg-paper/95 px-4 py-3 shadow-lg backdrop-blur-md text-center max-w-md">
              <p className="font-semibold text-ink text-sm">No alumni found for selected criteria</p>
              <p className="text-xs text-ink-soft mt-0.5">
                {hasActiveFilters
                  ? "Try adjusting your search keywords or clearing active filters to see the full network."
                  : "No alumni have enabled map visibility yet. Alumni can opt in through their profile settings."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-2 text-xs font-semibold text-ulab hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* WebGL Canvas Error Notification */}
        {mapError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-paper/90 p-6">
            <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center dark:border-rose-900/50 dark:bg-rose-950/40">
              <p className="font-semibold text-rose-800 dark:text-rose-300 text-sm">Map Initialization Notice</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">{mapError}</p>
            </div>
          </div>
        )}

        {/* Selected Individual Alumni Profile Card (Bottom Right Floating Modal) */}
        {selectedAlumni && (
          <div className="absolute bottom-5 right-5 z-20 w-full max-w-sm rounded-2xl border border-mist bg-paper/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
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

            <div className="mt-3 flex items-center justify-between pt-1">
              {selectedAlumni.isDemo ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
                  Demo Profile
                </span>
              ) : (
                <Badge tone="blue">Verified ULABian</Badge>
              )}
              <Link
                href={`/student/people`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-ulab hover:underline"
              >
                View Directory <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {/* Selected City Cluster Modal (Public Mode) */}
        {selectedCityCluster && (
          <div className="absolute bottom-5 right-5 z-20 w-full max-w-xs rounded-2xl border border-mist bg-paper/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
            <button
              type="button"
              onClick={() => setSelectedCityCluster(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-ink-soft hover:bg-sky hover:text-ink"
            >
              <X size={15} />
            </button>
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-sky text-ulab">
                <MapPin size={18} />
              </span>
              <div>
                <h4 className="font-display font-semibold text-ink text-base">{selectedCityCluster.city}</h4>
                <p className="text-xs text-ink-soft">{selectedCityCluster.country}</p>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-mist bg-surface p-2.5 text-center">
              <span className="text-xl font-bold text-ulab-deep">{selectedCityCluster.count}</span>
              <p className="text-xs text-ink-soft">Verified ULAB Alumni residing here</p>
            </div>
            <div className="mt-3 text-center">
              <Link
                href="/login?next=/student/people"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ulab hover:underline"
              >
                Sign in to view member profiles <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
