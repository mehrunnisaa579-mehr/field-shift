'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Maximize2 } from 'lucide-react';
import { IOWA_BOUNDS } from '@/lib/constants';
import { geometryBounds } from '@/lib/geo';
import { cn } from '@/lib/utils';
import type { CountyFeatureProperties } from '@/types';

type CountyCollection = FeatureCollection<Geometry, CountyFeatureProperties>;
type CountyFeature = Feature<Geometry, CountyFeatureProperties>;

export interface InteractiveMapProps {
  /** URL of the Iowa county GeoJSON (features need `fips` and `name` properties). */
  geojsonUrl: string;
  /** Metric value per county FIPS. Counties without a value render as "no data". */
  values: Record<string, number | undefined>;
  /** [min, max] mapped onto the palette. */
  domain: [number, number];
  /** Low-to-high colour stops. */
  palette: string[];
  metricLabel: string;
  formatValue: (value: number) => string;
  selectedFips: string | null;
  onSelect: (fips: string | null) => void;
  className?: string;
}

interface TooltipState {
  name: string;
  value: number | null;
  x: number;
  y: number;
  /** Open the tooltip to the left of the cursor near the right edge. */
  flip: boolean;
}

const SOURCE = 'counties';
const NO_DATA = '#16221b';
const EDGE = '#0a100c';

/** A blank dark canvas: no tile server, token, or network dependency. Swap in a basemap style URL if desired. */
const BLANK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#0a100c' } }],
};

const FIT_PADDING = { top: 24, right: 24, bottom: 24, left: 24 };

function colorExpression(domain: [number, number], palette: string[]): ExpressionSpecification {
  const [min, rawMax] = domain;
  const max = rawMax > min ? rawMax : min + 1;
  const step = (max - min) / (palette.length - 1);
  const stops = palette.flatMap((color, i) => [min + step * i, color]);
  return [
    'case',
    ['==', ['typeof', ['get', 'value']], 'number'],
    ['interpolate', ['linear'], ['get', 'value'], ...stops],
    NO_DATA,
  ] as unknown as ExpressionSpecification;
}

export function InteractiveMap({
  geojsonUrl,
  values,
  domain,
  palette,
  metricLabel,
  formatValue,
  selectedFips,
  onSelect,
  className,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const selectedFromMapRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);

  const [geo, setGeo] = useState<CountyCollection | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // 1. Load boundaries
  useEffect(() => {
    const controller = new AbortController();
    fetch(geojsonUrl, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Boundary file returned ${r.status}`);
        return r.json() as Promise<CountyCollection>;
      })
      .then(setGeo)
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setLoadError(e instanceof Error ? e.message : 'Could not load county boundaries');
      });
    return () => controller.abort();
  }, [geojsonUrl]);

  // 2. Create the map once. maplibre-gl is imported lazily so it never runs during SSR.
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (cancelled || !containerRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: BLANK_STYLE,
        bounds: IOWA_BOUNDS,
        fitBoundsOptions: { padding: FIT_PADDING },
        minZoom: 5,
        maxZoom: 10,
        dragRotate: false,
        attributionControl: false,
      });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: 'County boundaries: US Census Bureau',
        }),
        'bottom-left',
      );

      map.on('load', () => {
        if (!map) return;
        map.addSource(SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
          id: 'county-fill',
          type: 'fill',
          source: SOURCE,
          paint: { 'fill-color': NO_DATA, 'fill-opacity': 0.95 },
        });
        map.addLayer({
          id: 'county-line',
          type: 'line',
          source: SOURCE,
          paint: { 'line-color': EDGE, 'line-width': 0.9 },
        });
        map.addLayer({
          id: 'county-hover',
          type: 'line',
          source: SOURCE,
          filter: ['==', ['get', 'fips'], ''],
          paint: { 'line-color': '#ece7d6', 'line-width': 1.6, 'line-opacity': 0.8 },
        });
        map.addLayer({
          id: 'county-selected',
          type: 'line',
          source: SOURCE,
          filter: ['==', ['get', 'fips'], ''],
          paint: { 'line-color': '#e3b341', 'line-width': 3 },
        });

        map.on('mousemove', 'county-fill', (e) => {
          const f = e.features?.[0];
          if (!f || !map) return;
          const props = f.properties as CountyFeatureProperties;
          map.getCanvas().style.cursor = 'pointer';
          if (hoveredRef.current !== props.fips) {
            hoveredRef.current = props.fips;
            map.setFilter('county-hover', ['==', ['get', 'fips'], props.fips]);
          }
          setTooltip({
            name: props.name,
            value: typeof props.value === 'number' ? props.value : null,
            x: e.point.x,
            y: e.point.y,
            flip: e.point.x > map.getContainer().clientWidth - 200,
          });
        });

        map.on('mouseleave', 'county-fill', () => {
          if (!map) return;
          hoveredRef.current = null;
          map.getCanvas().style.cursor = '';
          map.setFilter('county-hover', ['==', ['get', 'fips'], '']);
          setTooltip(null);
        });

        map.on('click', (e) => {
          if (!map) return;
          const hit = map.queryRenderedFeatures(e.point, { layers: ['county-fill'] })[0];
          const fips = hit ? (hit.properties as CountyFeatureProperties).fips : null;
          selectedFromMapRef.current = fips;
          onSelectRef.current(fips);
        });

        mapRef.current = map;
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current = null;
      map?.remove();
    };
  }, []);

  // 3. Push values + colour scale into the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !geo) return;
    const features: CountyFeature[] = geo.features.map((f) => ({
      ...f,
      properties: { ...f.properties, value: values[f.properties.fips] ?? null },
    }));
    (map.getSource(SOURCE) as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features });
    map.setPaintProperty('county-fill', 'fill-color', colorExpression(domain, palette));
  }, [ready, geo, values, domain, palette]);

  // 4. Reflect the selected county (outline + camera)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !geo) return;
    map.setFilter('county-selected', ['==', ['get', 'fips'], selectedFips ?? '']);

    // Only move the camera when the selection came from outside the map (e.g. the ranking table).
    if (selectedFips && selectedFips === selectedFromMapRef.current) return;
    const feature = selectedFips ? geo.features.find((f) => f.properties.fips === selectedFips) : null;
    map.fitBounds(feature ? geometryBounds(feature.geometry) : IOWA_BOUNDS, {
      padding: feature ? { top: 80, right: 80, bottom: 80, left: 80 } : FIT_PADDING,
      maxZoom: 7.5,
      duration: 700,
    });
  }, [ready, geo, selectedFips]);

  const resetView = useCallback(() => {
    selectedFromMapRef.current = null;
    onSelect(null);
    mapRef.current?.fitBounds(IOWA_BOUNDS, { padding: FIT_PADDING, duration: 700 });
  }, [onSelect]);

  return (
    <div className={cn('relative h-full w-full', className)}>
      <div ref={containerRef} className="h-full w-full" role="application" aria-label="Iowa county map" />

      <button
        type="button"
        onClick={resetView}
        className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md border border-line bg-canopy/90 px-2.5 py-1.5 text-xs font-medium text-parchment backdrop-blur hover:bg-furrow"
      >
        <Maximize2 className="size-3.5" aria-hidden /> Reset view
      </button>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 min-w-36 rounded-md border border-line bg-canopy/95 px-3 py-2 shadow-xl backdrop-blur"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: `translate(${tooltip.flip ? 'calc(-100% - 14px)' : '14px'}, 14px)`,
          }}
        >
          <p className="font-display text-base leading-tight text-parchment">{tooltip.name} County</p>
          <p className="mt-1 text-xs text-fog">{metricLabel}</p>
          <p className="num text-sm font-semibold text-wheat">
            {tooltip.value === null ? 'No data' : formatValue(tooltip.value)}
          </p>
        </div>
      )}

      {!ready && !loadError && (
        <div className="absolute inset-0 grid place-items-center text-sm text-fog">Loading county boundaries...</div>
      )}
      {loadError && (
        <div role="alert" className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-clay">
          {loadError}. Check that public/data/iowa-counties.geojson exists, or run <code>npm run data:geojson</code>.
        </div>
      )}
    </div>
  );
}
