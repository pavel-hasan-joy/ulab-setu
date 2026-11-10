/**
 * Centralized Map Provider Abstraction for ULAB Setu Global Alumni Network Map
 *
 * Provides:
 * - Free Vector Map Provider: OpenFreeMap (Positron light & Dark styles, no API key required)
 * - Free Satellite Imagery Provider: EOxCloudless Sentinel-2 10m cloudless mosaic
 * - Provider attribution configurations
 * - MapLibre GeoJSON cluster styling & expressions
 * - Initial view parameters
 */

export interface MapProviderConfig {
  name: string;
  roadmapStyleLight: string;
  roadmapStyleDark: string;
  roadmapAttribution: string;
  satelliteTiles: string[];
  satelliteTileSize: number;
  satelliteMaxZoom: number;
  satelliteAttribution: string;
  initialCenter: [number, number]; // [lng, lat]
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
}

export const MAP_CONFIG: MapProviderConfig = {
  name: "OpenFreeMap + EOxCloudless",
  roadmapStyleLight: "https://tiles.openfreemap.org/styles/positron",
  roadmapStyleDark: "https://tiles.openfreemap.org/styles/dark",
  roadmapAttribution:
    '&copy; <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  satelliteTiles: [
    "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
  ],
  satelliteTileSize: 256,
  satelliteMaxZoom: 14,
  satelliteAttribution:
    "EOxCloudless &copy; EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2020)",
  initialCenter: [35.0, 24.0], // Centered globally with great visibility of South Asia & world
  initialZoom: 2.2,
  minZoom: 1.5,
  maxZoom: 16,
};

export const SATELLITE_SOURCE_ID = "eox-satellite-source";
export const SATELLITE_LAYER_ID = "eox-satellite-layer";
export const ALUMNI_GEOJSON_SOURCE_ID = "alumni-points-source";
export const CLUSTERS_LAYER_ID = "alumni-clusters-layer";
export const CLUSTER_COUNT_LAYER_ID = "alumni-cluster-count-layer";
export const UNCLUSTERED_POINT_LAYER_ID = "alumni-unclustered-point-layer";

/**
 * ULAB Brand colors for MapLibre circle styling
 */
export const MAP_THEME = {
  primary: "#005691", // ULAB Deep Blue
  primaryHover: "#004070",
  secondary: "#0284c7", // Sky Blue
  accent: "#f59e0b", // Gold
  pointRadius: 7,
  pointStrokeWidth: 2.5,
  pointStrokeColor: "#ffffff",
};

