import { geoMercator, geoPath } from "d3-geo";
import type { GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

type StateProps = { sigla: string; name: string };

const WIDTH = 620;
const HEIGHT = 520;

function radiusFor(count: number): number {
  if (count <= 0) return 0;
  return Math.min(30, 7 + Math.sqrt(count) * 3.4);
}

// Genérico pra qualquer topologia de estados/UFs no formato { sigla, name } — hoje serve
// o mapa do Brasil e o dos EUA; outro país só precisa de uma topologia nesse formato.
// `makeProjection` é customizável porque o Mercator padrão encolhe demais um país que
// tenha estados muito espalhados (ex.: Alasca e Havaí nos EUA) — nesse caso o chamador
// passa geoAlbersUsa, que posiciona esses estados como encartes perto do continente.
export function StatesBubbleMap({
  topology,
  countsBySigla,
  hrefFor,
  ariaLabel,
  makeProjection = geoMercator,
}: {
  topology: Topology;
  countsBySigla: Record<string, number>;
  hrefFor: (sigla: string) => string;
  ariaLabel: string;
  makeProjection?: () => GeoProjection;
}) {
  const geo = feature(topology, topology.objects.states as GeometryCollection<StateProps>);
  const projection = makeProjection().fitSize([WIDTH, HEIGHT], geo);
  const path = geoPath(projection);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={ariaLabel}>
      {geo.features.map((f) => {
        const sigla = f.properties?.sigla ?? "";
        const count = countsBySigla[sigla] ?? 0;
        const label = `${f.properties?.name}: ${count} cliente(s) ativo(s)`;
        const shape = (
          <path d={path(f) ?? undefined} fill={count > 0 ? "#3D3E40" : "#2E2F2C"} stroke="#F7F5EF" strokeWidth={0.8}>
            <title>{label}</title>
          </path>
        );
        return count > 0 ? (
          <a key={sigla} href={hrefFor(sigla)} className="cursor-pointer">
            {shape}
          </a>
        ) : (
          <g key={sigla}>{shape}</g>
        );
      })}
      {geo.features.map((f) => {
        const sigla = f.properties?.sigla ?? "";
        const count = countsBySigla[sigla] ?? 0;
        if (count <= 0) return null;
        const [cx, cy] = path.centroid(f);
        const r = radiusFor(count);
        const label = `${f.properties?.name}: ${count} cliente(s) ativo(s)`;
        return (
          <a key={`bubble-${sigla}`} href={hrefFor(sigla)} className="cursor-pointer">
            <circle cx={cx} cy={cy} r={r} fill="#F7F5EF" stroke="#24252A" strokeWidth={1} />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={r > 14 ? 13 : 11} fontWeight={700} fill="#24252A">
              {String(count)}
            </text>
            <title>{label}</title>
          </a>
        );
      })}
    </svg>
  );
}
