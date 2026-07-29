import * as d3 from "d3-geo";
import * as topojson from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import statesTopologyRaw from "us-atlas/states-10m.json";

import { FIPS_TO_US_STATE, stateDisplayName } from "@/lib/us-states";

type Feature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }> & {
  id?: string | number;
};

const topology = statesTopologyRaw as unknown as Topology;
const collection = topojson.feature(
  topology,
  topology.objects.states as GeometryCollection,
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const projection = d3.geoAlbersUsa().scale(1220).translate([480, 300]);
const path = d3.geoPath(projection);

export function StateOutline({
  state,
  decorative = false,
}: {
  state: string;
  decorative?: boolean;
}) {
  const code = state.toUpperCase();
  const feature = (collection.features as Feature[]).find(
    (candidate) =>
      FIPS_TO_US_STATE[String(candidate.id).padStart(2, "0")] === code,
  );
  if (!feature) return null;

  const [[x0, y0], [x1, y1]] = path.bounds(feature);
  const padding = 12;

  return (
    <svg
      data-entity-state-outline={code}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${stateDisplayName(code)} state outline`}
      role={decorative ? undefined : "img"}
      viewBox={`${x0 - padding} ${y0 - padding} ${x1 - x0 + padding * 2} ${y1 - y0 + padding * 2}`}
    >
      <path d={path(feature) || ""} fill="currentColor" />
    </svg>
  );
}
