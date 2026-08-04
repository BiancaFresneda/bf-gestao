import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

import topology from "@/data/world-countries-topo.json";

type CountryProps = { name: string };

const WIDTH = 640;
const HEIGHT = 360;

function radiusFor(count: number): number {
  if (count <= 0) return 0;
  return Math.min(30, 7 + Math.sqrt(count) * 3.4);
}

// Um item por país com cliente ativo — o Dashboard já resolve, por país, quantos
// clientes existem e (se houver) qual unidade selecionar ao clicar. Países sem nenhum
// cliente simplesmente não aparecem em `regions`, então o mapa nunca fica hardcoded a
// BR/EUA: se o grupo abrir uma unidade em outro país, ela aparece sozinha.
export function WorldClientsMap({
  regions,
}: {
  regions: Record<string, { count: number; href: string }>;
}) {
  const topo = topology as unknown as Topology;
  const geo = feature(topo, topo.objects.countries as GeometryCollection<CountryProps>);
  const projection = geoMercator().fitSize([WIDTH, HEIGHT], geo);
  const path = geoPath(projection);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Clientes ativos por país">
      {geo.features.map((f, i) => {
        // Algumas feições do dataset (territórios em disputa, sem código ISO — Kosovo,
        // Somalilândia etc.) não têm `id`; o índice garante uma key única mesmo assim.
        const isoId = f.id != null ? String(f.id) : `sem-id-${i}`;
        const region = regions[isoId];
        const count = region?.count ?? 0;
        const label = `${f.properties?.name}: ${count} cliente(s) ativo(s)`;
        const shape = (
          <path d={path(f) ?? undefined} fill={count > 0 ? "#3D3E40" : "#2E2F2C"} stroke="#F7F5EF" strokeWidth={0.4}>
            <title>{label}</title>
          </path>
        );
        return region ? (
          <a key={isoId} href={region.href} className="cursor-pointer">
            {shape}
          </a>
        ) : (
          <g key={isoId}>{shape}</g>
        );
      })}
      {geo.features.map((f, i) => {
        const isoId = f.id != null ? String(f.id) : `sem-id-${i}`;
        const region = regions[isoId];
        if (!region || region.count <= 0) return null;
        const [cx, cy] = path.centroid(f);
        const r = radiusFor(region.count);
        const label = `${f.properties?.name}: ${region.count} cliente(s) ativo(s)`;
        return (
          <a key={`bubble-${isoId}`} href={region.href} className="cursor-pointer">
            <circle cx={cx} cy={cy} r={r} fill="#F7F5EF" stroke="#24252A" strokeWidth={1} />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={r > 14 ? 13 : 11} fontWeight={700} fill="#24252A">
              {String(region.count)}
            </text>
            <title>{label}</title>
          </a>
        );
      })}
    </svg>
  );
}
