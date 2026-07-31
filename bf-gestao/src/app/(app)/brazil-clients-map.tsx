import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

import topology from "@/data/brazil-states-topo.json";

type StateProps = { sigla: string; name: string };

const WIDTH = 620;
const HEIGHT = 520;

function radiusFor(count: number): number {
  if (count <= 0) return 0;
  return Math.min(30, 7 + Math.sqrt(count) * 3.4);
}

export function BrazilClientsMap({ countsByUf }: { countsByUf: Record<string, number> }) {
  const topo = topology as unknown as Topology;
  const geo = feature(topo, topo.objects.states as GeometryCollection<StateProps>);
  const projection = geoMercator().fitSize([WIDTH, HEIGHT], geo);
  const path = geoPath(projection);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Clientes ativos por estado no Brasil">
      {geo.features.map((f) => {
        const uf = f.properties?.sigla ?? "";
        const count = countsByUf[uf] ?? 0;
        const label = `${f.properties?.name}: ${count} cliente(s) ativo(s)`;
        return (
          <path key={uf} d={path(f) ?? undefined} fill={count > 0 ? "#3D3E40" : "#2E2F2C"} stroke="#F7F5EF" strokeWidth={0.8}>
            <title>{label}</title>
          </path>
        );
      })}
      {geo.features.map((f) => {
        const uf = f.properties?.sigla ?? "";
        const count = countsByUf[uf] ?? 0;
        if (count <= 0) return null;
        const [cx, cy] = path.centroid(f);
        const r = radiusFor(count);
        const label = `${f.properties?.name}: ${count} cliente(s) ativo(s)`;
        return (
          <g key={`bubble-${uf}`}>
            <circle cx={cx} cy={cy} r={r} fill="#F7F5EF" stroke="#24252A" strokeWidth={1} />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={r > 14 ? 13 : 11} fontWeight={700} fill="#24252A">
              {String(count)}
            </text>
            <title>{label}</title>
          </g>
        );
      })}
    </svg>
  );
}
