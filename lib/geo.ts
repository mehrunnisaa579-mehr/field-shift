import type { Geometry, Position } from 'geojson';

export type Bounds = [[number, number], [number, number]];

function walk(coords: unknown, visit: (p: Position) => void): void {
  if (Array.isArray(coords) && typeof coords[0] === 'number') {
    visit(coords as Position);
  } else if (Array.isArray(coords)) {
    coords.forEach((c) => walk(c, visit));
  }
}

/** Bounding box [[west, south], [east, north]] of any GeoJSON geometry. */
export function geometryBounds(geometry: Geometry): Bounds {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  if (geometry.type === 'GeometryCollection') {
    geometry.geometries.forEach((g) => {
      const [[gw, gs], [ge, gn]] = geometryBounds(g);
      w = Math.min(w, gw); s = Math.min(s, gs); e = Math.max(e, ge); n = Math.max(n, gn);
    });
  } else {
    walk(geometry.coordinates, ([x, y]) => {
      w = Math.min(w, x); e = Math.max(e, x);
      s = Math.min(s, y); n = Math.max(n, y);
    });
  }
  return [[w, s], [e, n]];
}

/** Centre of the bounding box. Adequate for sampling 0.5-degree NASA POWER grid cells. */
export function boundsCenter([[w, s], [e, n]]: Bounds): [number, number] {
  const r = (v: number) => Math.round(v * 1e4) / 1e4;
  return [r((w + e) / 2), r((s + n) / 2)];
}
