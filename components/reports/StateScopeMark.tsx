import * as d3 from "d3-geo";
import * as topojson from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import statesTopologyRaw from "us-atlas/states-10m.json";

import styles from "./state-scope-mark.module.css";

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};
const FIPS_TO_STATE: Record<string,string> = {"01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY"};

type Feature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }> & { id?: string | number };
const topology = statesTopologyRaw as unknown as Topology;
const collection = topojson.feature(
  topology,
  topology.objects.states as GeometryCollection,
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const projection = d3.geoAlbersUsa().scale(1220).translate([480, 300]);
const path = d3.geoPath(projection);

export function StateScopeMark({ state }: { state: string }) {
  const code = state.toUpperCase();
  const feature = (collection.features as Feature[]).find(
    (candidate) => FIPS_TO_STATE[String(candidate.id).padStart(2, "0")] === code,
  );
  if (!feature || !STATE_NAMES[code]) return null;

  const [[x0, y0], [x1, y1]] = path.bounds(feature);
  const padding = 12;

  return (
    <div className={styles.mark}>
      <svg
        aria-label={`${STATE_NAMES[code]} state outline`}
        role="img"
        viewBox={`${x0 - padding} ${y0 - padding} ${x1 - x0 + padding * 2} ${y1 - y0 + padding * 2}`}
      >
        <path d={path(feature) || ""} />
      </svg>
      <div><strong>{STATE_NAMES[code]}</strong><span>Single-state evidence scope</span></div>
    </div>
  );
}
