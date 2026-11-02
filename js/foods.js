// Ilustraciones, categorías, precios aproximados (MXN) y alimentos frecuentes.

export const CATS = [
  { id: "verduras", name: "Verduras", tint: "#7DBB4E" },
  { id: "frutas", name: "Frutas", tint: "#F2A93B" },
  { id: "lacteos", name: "Lácteos y huevo", tint: "#5AA0DB" },
  { id: "carnes", name: "Carnes y pescado", tint: "#D0654B" },
  { id: "pan", name: "Tortillas y pan", tint: "#D2A66A" },
  { id: "abarrotes", name: "Abarrotes", tint: "#9A7656" },
  { id: "bebidas", name: "Bebidas", tint: "#4FB3C9" },
  { id: "congelados", name: "Congelados", tint: "#8FB8E8" },
  { id: "limpieza", name: "Limpieza e higiene", tint: "#A58BD8" },
  { id: "otros", name: "Otros", tint: "#9AA39B" },
];
export const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));

export const PLACES = ["Refri", "Congelador", "Alacena", "Frutero"];
export const UNITS = ["pza", "kg", "g", "l", "ml", "paquete", "bolsa", "lata", "caja", "manojo"];
export const DEFAULT_STORES = ["Mercado", "Walmart", "Chedraui", "Sam's Club"];

export const norm = (s) =>
  String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// kind: [palabras clave, categoría, unidad, lugar, tienda sugerida, precios aprox. por unidad]
const KINDS = {
  jitomate: [["jitomate", "tomate rojo", "tomate"], "verduras", "pza", "Refri", "Mercado", { kg: 32, pza: 6 }],
  cebolla: [["cebolla"], "verduras", "pza", "Refri", "Mercado", { kg: 28, pza: 6 }],
  aguacate: [["aguacate"], "verduras", "pza", "Frutero", "Mercado", { kg: 70, pza: 16 }],
  lechuga: [["lechuga", "espinaca", "acelga"], "verduras", "pza", "Refri", "Mercado", { pza: 22 }],
  limon: [["limon", "lima"], "frutas", "kg", "Frutero", "Mercado", { kg: 38, pza: 2 }],
  platano: [["platano", "banana"], "frutas", "pza", "Frutero", "Mercado", { kg: 25, pza: 4, manojo: 28 }],
  leche: [["leche"], "lacteos", "l", "Refri", "Walmart", { l: 28 }],
  huevo: [["huevo"], "lacteos", "pza", "Refri", "Walmart", { pza: 3.5, caja: 110, kg: 50 }],
  queso: [["queso", "panela", "oaxaca", "manchego"], "lacteos", "g", "Refri", "Walmart", { g: 0.18, kg: 180, paquete: 65 }],
  yogurt: [["yogurt", "yoghurt", "yogur"], "lacteos", "pza", "Refri", "Walmart", { pza: 15, l: 45 }],
  tortillas: [["tortilla"], "pan", "kg", "Alacena", "Mercado", { kg: 26, paquete: 30 }],
  pollo: [["pollo", "pechuga", "muslo"], "carnes", "kg", "Refri", "Chedraui", { kg: 140 }],
  frijol: [["frijol"], "abarrotes", "kg", "Alacena", "Sam's Club", { kg: 38, bolsa: 38, lata: 22 }],
  agua: [["agua", "garrafon"], "bebidas", "l", "Alacena", "Chedraui", { l: 12, pza: 45 }],
};
const PLAIN = {
  arroz: [["arroz"], "abarrotes", "kg", "Alacena", "Walmart", { kg: 32 }],
  papa: [["papa"], "verduras", "kg", "Alacena", "Mercado", { kg: 30 }],
  zanahoria: [["zanahoria"], "verduras", "kg", "Refri", "Mercado", { kg: 22 }],
  chile: [["chile", "serrano", "jalapeno", "poblano"], "verduras", "kg", "Refri", "Mercado", { kg: 45 }],
  ajo: [["ajo"], "verduras", "pza", "Alacena", "Mercado", { pza: 8 }],
  manzana: [["manzana"], "frutas", "kg", "Frutero", "Mercado", { kg: 45, pza: 8 }],
  naranja: [["naranja", "mandarina"], "frutas", "kg", "Frutero", "Mercado", { kg: 22 }],
  pan: [["pan", "bolillo", "telera"], "pan", "paquete", "Alacena", "Walmart", { paquete: 50, pza: 3 }],
  carne: [["carne", "res", "bistec", "molida"], "carnes", "kg", "Refri", "Chedraui", { kg: 190 }],
  jamon: [["jamon", "salchicha"], "carnes", "paquete", "Refri", "Walmart", { paquete: 55 }],
  pescado: [["pescado", "atun", "camaron"], "carnes", "kg", "Congelador", "Chedraui", { kg: 220, lata: 25 }],
  aceite: [["aceite"], "abarrotes", "l", "Alacena", "Sam's Club", { l: 48 }],
  azucar: [["azucar"], "abarrotes", "kg", "Alacena", "Walmart", { kg: 30 }],
  cafe: [["cafe"], "abarrotes", "paquete", "Alacena", "Sam's Club", { paquete: 120 }],
  pasta: [["pasta", "sopa", "espagueti", "fideo"], "abarrotes", "paquete", "Alacena", "Walmart", { paquete: 14 }],
  refresco: [["refresco", "jugo"], "bebidas", "l", "Refri", "Walmart", { l: 22 }],
  papel: [["papel"], "limpieza", "paquete", "Alacena", "Sam's Club", { paquete: 95 }],
  jabon: [["jabon", "detergente", "cloro", "suavizante"], "limpieza", "pza", "Alacena", "Walmart", { pza: 45, l: 40 }],
  helado: [["helado", "congelad"], "congelados", "pza", "Congelador", "Walmart", { pza: 80 }],
};
const ALL = { ...KINDS, ...PLAIN };

export function guess(name) {
  const n = " " + norm(name) + " ";
  for (const [kind, v] of Object.entries(ALL)) {
    if (v[0].some((k) => n.includes(k))) {
      return { kind: KINDS[kind] ? kind : null, cat: v[1], unit: v[2], place: v[3], store: v[4], prices: v[5] };
    }
  }
  return { kind: null, cat: "otros", unit: "pza", place: "Refri", store: null, prices: {} };
}

export function unitPrice(item) {
  if (item.price) return Number(item.price);
  const g = guess(item.name);
  return g.prices[item.unit || "pza"] ?? null;
}

export const QUICK = ["Jitomate", "Aguacate", "Leche", "Huevo", "Tortillas", "Pollo", "Limón", "Plátano", "Cebolla", "Queso", "Frijol", "Agua"];
export const STAPLES = ["Tortillas", "Huevo", "Leche", "Jitomate", "Cebolla", "Frijol", "Arroz", "Limón"];

const SVG = {
  jitomate: `<circle cx="32" cy="36" r="21" fill="#E04A3A"/><ellipse cx="24" cy="30" rx="6" ry="4" fill="#fff" opacity=".35"/><path d="M32 18c-6-4-12-2-14 2 5 1 9 1 14-2 5 3 9 3 14 2-2-4-8-6-14-2z" fill="#3E8E3A"/><path d="M32 18l3-7" stroke="#3E8E3A" stroke-width="3" stroke-linecap="round"/>`,
  leche: `<path d="M20 22L32 12L44 22Z" fill="#DCE6F2"/><rect x="20" y="22" width="24" height="34" rx="2" fill="#F7FAFD" stroke="#C9D6E6"/><rect x="20" y="36" width="24" height="12" fill="#3A78C2"/><rect x="29" y="8" width="6" height="6" rx="1" fill="#3A78C2"/>`,
  huevo: `<ellipse cx="24" cy="36" rx="11" ry="14" fill="#EED6B4"/><ellipse cx="40" cy="38" rx="11" ry="14" fill="#F8EBD6"/><ellipse cx="37" cy="32" rx="3" ry="4" fill="#fff" opacity=".7"/>`,
  aguacate: `<path d="M32 8C22 8 16 30 14 40c-2 12 8 18 18 18s20-6 18-18C48 30 42 8 32 8z" fill="#3E6B2A"/><path d="M32 13c-7 0-11 18-13 27-1 10 6 14 13 14s14-4 13-14c-2-9-6-27-13-27z" fill="#C8DB7A"/><circle cx="32" cy="42" r="8" fill="#8A5A34"/>`,
  platano: `<path d="M10 22c4 24 30 34 46 18-6 4-26 4-38-18z" fill="#F2C94C"/><path d="M18 26c8 14 22 20 34 16" stroke="#D9A92B" stroke-width="2" fill="none"/><path d="M10 22l-3-4" stroke="#5B4A2A" stroke-width="3" stroke-linecap="round"/>`,
  lechuga: `<circle cx="32" cy="36" r="20" fill="#6FAE45"/><circle cx="26" cy="32" r="12" fill="#A4D46C"/><circle cx="38" cy="38" r="10" fill="#B9E08A"/><path d="M32 20v32" stroke="#5E9837" stroke-width="2"/>`,
  queso: `<path d="M8 40L56 26V50H8z" fill="#F5C842"/><path d="M8 40L56 26L48 20z" fill="#F9DC7A"/><circle cx="22" cy="44" r="3" fill="#D9A92B"/><circle cx="40" cy="38" r="4" fill="#D9A92B"/><circle cx="48" cy="45" r="2.5" fill="#D9A92B"/>`,
  tortillas: `<ellipse cx="32" cy="46" rx="24" ry="8" fill="#D2A66A"/><ellipse cx="32" cy="40" rx="24" ry="8" fill="#E5C189"/><ellipse cx="32" cy="34" rx="24" ry="8" fill="#F1D6A6"/><circle cx="24" cy="33" r="1.5" fill="#C99A5A"/><circle cx="38" cy="35" r="1.5" fill="#C99A5A"/><circle cx="31" cy="31" r="1.2" fill="#C99A5A"/>`,
  pollo: `<path d="M38 38l12 14" stroke="#EFE7D8" stroke-width="5" stroke-linecap="round"/><circle cx="52" cy="50" r="3.5" fill="#EFE7D8"/><circle cx="48" cy="54" r="3.5" fill="#EFE7D8"/><ellipse cx="30" cy="28" rx="17" ry="14" fill="#C9772F" transform="rotate(-30 30 28)"/><ellipse cx="25" cy="23" rx="6" ry="3.5" fill="#E39A52" transform="rotate(-30 25 23)"/>`,
  limon: `<ellipse cx="32" cy="34" rx="20" ry="16" fill="#8CC63F"/><ellipse cx="25" cy="29" rx="6" ry="3.5" fill="#fff" opacity=".35"/><path d="M50 30l5-3" stroke="#6E9E2E" stroke-width="3" stroke-linecap="round"/>`,
  cebolla: `<path d="M32 10c-2 8-18 16-18 30 0 10 8 16 18 16s18-6 18-16c0-14-16-22-18-30z" fill="#B65C8F"/><path d="M32 14c-1 10-8 18-8 28 0 8 4 12 8 12M32 14c1 10 8 18 8 28" stroke="#D88BB5" stroke-width="2" fill="none"/>`,
  yogurt: `<path d="M16 22h32l-4 32H20z" fill="#F4F2EE" stroke="#DDD8D0"/><rect x="14" y="16" width="36" height="7" rx="2" fill="#E2687A"/><path d="M18 34h28l-1 10H19z" fill="#F3B8C2"/>`,
  agua: `<rect x="26" y="6" width="12" height="6" rx="1.5" fill="#2F6FB0"/><path d="M24 14h16c2 4 4 6 4 12v28c0 3-2 4-4 4H24c-2 0-4-1-4-4V26c0-6 2-8 4-12z" fill="#CFE6F7"/><rect x="20" y="30" width="24" height="12" fill="#5AA0DB"/>`,
  frijol: `<path d="M10 34h44c0 14-10 22-22 22S10 48 10 34z" fill="#E9E1D3"/><ellipse cx="32" cy="34" rx="22" ry="6" fill="#5A2E1E"/><ellipse cx="24" cy="32" rx="3.5" ry="2" fill="#8A5038"/><ellipse cx="36" cy="33" rx="3.5" ry="2" fill="#8A5038"/><ellipse cx="30" cy="36" rx="3.5" ry="2" fill="#8A5038"/>`,
};

const escTxt = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function foodSVG(name, cat, size = 56) {
  const g = guess(name);
  if (g.kind && SVG[g.kind]) {
    return `<svg class="food" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">${SVG[g.kind]}</svg>`;
  }
  const tint = (CAT[cat] || CAT.otros).tint;
  const letter = escTxt((String(name).trim()[0] || "?").toUpperCase());
  return `<svg class="food" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="22" fill="${tint}" opacity=".22"/><circle cx="32" cy="34" r="15" fill="${tint}" opacity=".55"/><text x="32" y="41" text-anchor="middle" font-family="Bricolage, sans-serif" font-weight="800" font-size="20" fill="#fff">${letter}</text></svg>`;
}
