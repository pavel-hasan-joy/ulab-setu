/**
 * Centralized Map Provider Configuration for ULAB Setu Global Alumni Network Map
 *
 * Supported Map Providers (100% Free, No Credit Card, No API Key):
 * - Roadmap / Street View: CartoDB Voyager raster tiles & OpenFreeMap vector styles (OpenStreetMap derived, rich labels & colors)
 * - Dark Roadmap: CartoDB Dark Matter / OpenFreeMap Dark raster tiles
 * - Satellite View: Esri World Imagery & EOxCloudless Sentinel-2 (high-resolution global satellite mosaic up to z=19)
 * - Fallback Roadmap: Standard OpenStreetMap raster tiles
 */

import type { StyleSpecification } from "maplibre-gl";

export const SATELLITE_SOURCE_ID = "esri-satellite-source";
export const SATELLITE_LAYER_ID = "esri-satellite-layer";
export const ROADMAP_SOURCE_ID = "carto-voyager-source";
export const ROADMAP_LAYER_ID = "carto-voyager-layer";
export const ALUMNI_GEOJSON_SOURCE_ID = "alumni-points-source";
export const CLUSTERS_LAYER_ID = "alumni-clusters-layer";
export const CLUSTER_COUNT_LAYER_ID = "alumni-cluster-count-layer";
export const UNCLUSTERED_POINT_LAYER_ID = "alumni-unclustered-point-layer";

/**
 * Self-contained MapLibre Style Specification.
 * Embedding the style directly eliminates external JSON style network failures,
 * font/glyph fetch errors, and vector decoding issues.
 */
export function buildMapLibreStyle(isDark = false): StyleSpecification {
  const roadmapTiles = isDark
    ? [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ]
    : [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ];

  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      [ROADMAP_SOURCE_ID]: {
        type: "raster",
        tiles: roadmapTiles,
        tileSize: 256,
        attribution:
          '&copy; <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
        maxzoom: 19,
      },
      [SATELLITE_SOURCE_ID]: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution:
          '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a>, Maxar, Earthstar Geographics, USDA, USGS & EOxCloudless Copernicus Sentinel',
      },
    },
    layers: [
      {
        id: ROADMAP_LAYER_ID,
        type: "raster",
        source: ROADMAP_SOURCE_ID,
        minzoom: 0,
        maxzoom: 19,
        paint: {
          "raster-opacity": 1.0,
          "raster-fade-duration": 200,
        },
      },
      {
        id: SATELLITE_LAYER_ID,
        type: "raster",
        source: SATELLITE_SOURCE_ID,
        minzoom: 0,
        maxzoom: 19,
        layout: {
          visibility: "none",
        },
        paint: {
          "raster-opacity": 1.0,
          "raster-fade-duration": 200,
        },
      },
    ],
  };
}

export const MAP_CONFIG = {
  name: "OpenFreeMap + EOxCloudless + CartoDB + Esri",
  roadmapStyleLight: "https://tiles.openfreemap.org/styles/positron",
  roadmapStyleDark: "https://tiles.openfreemap.org/styles/dark",
  roadmapAttribution:
    '&copy; <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com" target="_blank" rel="noreferrer">CARTO</a>',
  satelliteTiles: [
    "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  ],
  satelliteTileSize: 256,
  satelliteMaxZoom: 14,
  satelliteAttribution:
    "EOxCloudless &copy; EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2020) &copy; Esri World Imagery",
  initialCenter: [35.0, 24.0] as [number, number],
  initialZoom: 2.2,
  minZoom: 1.5,
  maxZoom: 18,
  workerUrl: "https://cdn.jsdelivr.net/npm/maplibre-gl@6.17.0/dist/maplibre-gl-worker.mjs",
  localWorkerUrl: "/maplibre-gl-worker.mjs",
  attribution:
    '&copy; <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com" target="_blank" rel="noreferrer">CARTO</a> &copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a>',
};

export const MAP_THEME = {
  primary: "#005691",
  primaryHover: "#004070",
  secondary: "#0284c7",
  accent: "#f59e0b",
  pointRadius: 7,
  pointStrokeWidth: 2.5,
  pointStrokeColor: "#ffffff",
};
