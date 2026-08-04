// Código ISO 3166-1 numérico de cada país usado no sistema — é a chave que o dataset de
// topojson do mapa mundial (src/data/world-countries-topo.json) usa como `id`. Adicionar
// um país novo aqui é o único passo manual necessário pro mapa mundial do Dashboard
// passar a reconhecer clientes daquele país.
export const ISO_NUMERIC_BY_COUNTRY: Record<string, string> = {
  BR: "076",
  US: "840",
};
