// Catálogo de productos: ilustración, categoría, unidad, lugar, tienda sugerida y precio aproximado (MXN).
import { A } from "./art.js";

export const CATS = [
  { id: "verduras", name: "Verduras", tint: "#7DBB4E" },
  { id: "frutas", name: "Frutas", tint: "#F2A93B" },
  { id: "lacteos", name: "Lácteos y huevo", tint: "#5AA0DB" },
  { id: "carnes", name: "Carnes y pescado", tint: "#D0654B" },
  { id: "pan", name: "Tortillas y pan", tint: "#D2A66A" },
  { id: "abarrotes", name: "Despensa", tint: "#9A7656" },
  { id: "especias", name: "Especias y condimentos", tint: "#C1693C" },
  { id: "bebidas", name: "Bebidas", tint: "#4FB3C9" },
  { id: "congelados", name: "Congelados", tint: "#8FB8E8" },
  { id: "botanas", name: "Botanas y dulces", tint: "#E0823D" },
  { id: "limpieza", name: "Limpieza", tint: "#58A6A6" },
  { id: "higiene", name: "Higiene y baño", tint: "#A58BD8" },
  { id: "mascotas", name: "Mascotas", tint: "#B48A5A" },
  { id: "otros", name: "Otros", tint: "#9AA39B" },
];
export const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));

export const PLACES = ["Refri", "Congelador", "Alacena", "Frutero", "Baño", "Lavandería"];
export const UNITS = ["pza", "kg", "g", "l", "ml", "paquete", "bolsa", "lata", "caja", "frasco", "botella", "rollo", "manojo"];
export const DEFAULT_STORES = ["Mercado", "Walmart", "Chedraui", "Sam's Club"];

export const norm = (s) => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Ilustraciones originales a mano
const RAW = {
  jitomate: `<circle cx="32" cy="36" r="21" fill="#E04A3A"/><ellipse cx="24" cy="30" rx="6" ry="4" fill="#fff" opacity=".35"/><path d="M32 18c-6-4-12-2-14 2 5 1 9 1 14-2 5 3 9 3 14 2-2-4-8-6-14-2z" fill="#3E8E3A"/><path d="M32 18l3-7" stroke="#3E8E3A" stroke-width="3" stroke-linecap="round"/>`,
  leche: `<path d="M20 22L32 12L44 22Z" fill="#DCE6F2"/><rect x="20" y="22" width="24" height="34" rx="2" fill="#F7FAFD" stroke="#C9D6E6"/><rect x="20" y="36" width="24" height="12" fill="#3A78C2"/><rect x="29" y="8" width="6" height="6" rx="1" fill="#3A78C2"/>`,
  aguacate: `<path d="M32 8C22 8 16 30 14 40c-2 12 8 18 18 18s20-6 18-18C48 30 42 8 32 8z" fill="#3E6B2A"/><path d="M32 13c-7 0-11 18-13 27-1 10 6 14 13 14s14-4 13-14c-2-9-6-27-13-27z" fill="#C8DB7A"/><circle cx="32" cy="42" r="8" fill="#8A5A34"/>`,
  platano: `<path d="M10 22c4 24 30 34 46 18-6 4-26 4-38-18z" fill="#F2C94C"/><path d="M18 26c8 14 22 20 34 16" stroke="#D9A92B" stroke-width="2" fill="none"/><path d="M10 22l-3-4" stroke="#5B4A2A" stroke-width="3" stroke-linecap="round"/>`,
  queso: `<path d="M8 40L56 26V50H8z" fill="#F5C842"/><path d="M8 40L56 26L48 20z" fill="#F9DC7A"/><circle cx="22" cy="44" r="3" fill="#D9A92B"/><circle cx="40" cy="38" r="4" fill="#D9A92B"/><circle cx="48" cy="45" r="2.5" fill="#D9A92B"/>`,
  tortillas: `<ellipse cx="32" cy="46" rx="24" ry="8" fill="#D2A66A"/><ellipse cx="32" cy="40" rx="24" ry="8" fill="#E5C189"/><ellipse cx="32" cy="34" rx="24" ry="8" fill="#F1D6A6"/><circle cx="24" cy="33" r="1.5" fill="#C99A5A"/><circle cx="38" cy="35" r="1.5" fill="#C99A5A"/><circle cx="31" cy="31" r="1.2" fill="#C99A5A"/>`,
  pollo: `<path d="M38 38l12 14" stroke="#EFE7D8" stroke-width="5" stroke-linecap="round"/><circle cx="52" cy="50" r="3.5" fill="#EFE7D8"/><circle cx="48" cy="54" r="3.5" fill="#EFE7D8"/><ellipse cx="30" cy="28" rx="17" ry="14" fill="#C9772F" transform="rotate(-30 30 28)"/><ellipse cx="25" cy="23" rx="6" ry="3.5" fill="#E39A52" transform="rotate(-30 25 23)"/>`,
  cebolla: `<path d="M32 10c-2 8-18 16-18 30 0 10 8 16 18 16s18-6 18-16c0-14-16-22-18-30z" fill="#B65C8F"/><path d="M32 14c-1 10-8 18-8 28 0 8 4 12 8 12M32 14c1 10 8 18 8 28" stroke="#D88BB5" stroke-width="2" fill="none"/>`,
  yogurt: `<path d="M16 22h32l-4 32H20z" fill="#F4F2EE" stroke="#DDD8D0"/><rect x="14" y="16" width="36" height="7" rx="2" fill="#E2687A"/><path d="M18 34h28l-1 10H19z" fill="#F3B8C2"/>`,
  agua: `<rect x="26" y="6" width="12" height="6" rx="1.5" fill="#2F6FB0"/><path d="M24 14h16c2 4 4 6 4 12v28c0 3-2 4-4 4H24c-2 0-4-1-4-4V26c0-6 2-8 4-12z" fill="#CFE6F7"/><rect x="20" y="30" width="24" height="12" fill="#5AA0DB"/>`,
  frijol: `<path d="M10 34h44c0 14-10 22-22 22S10 48 10 34z" fill="#E9E1D3"/><ellipse cx="32" cy="34" rx="22" ry="6" fill="#5A2E1E"/><ellipse cx="24" cy="32" rx="3.5" ry="2" fill="#8A5038"/><ellipse cx="36" cy="33" rx="3.5" ry="2" fill="#8A5038"/><ellipse cx="30" cy="36" rx="3.5" ry="2" fill="#8A5038"/>`,
};

// [nombre, palabras clave extra, categoría, unidad, lugar, tienda, precio por unidad, ilustración]
const M = "Mercado", W = "Walmart", CH = "Chedraui", SC = "Sam's Club";
const ROWS = [
  // ── Verduras
  ["Jitomate", "tomate rojo|jitomate saladet|jitomate bola", "verduras", "kg", "Refri", M, 32, RAW.jitomate],
  ["Tomate verde", "tomatillo|tomate de cascara", "verduras", "kg", "Refri", M, 30, A.round("#8DBF4A", "husk", 18)],
  ["Cebolla", "cebolla blanca", "verduras", "pza", "Alacena", M, 7, A.round("#F2EEE4", "stem", 19) + `<circle cx="32" cy="37" r="19" fill="none" stroke="rgba(40,60,70,.22)" stroke-width="1.5"/><path d="M32 22c-2 10-8 18-8 28M32 22c2 10 8 18 8 28" stroke="#DCD3C1" stroke-width="2" fill="none"/>`],
  ["Cebolla morada", "cebolla roja", "verduras", "pza", "Alacena", M, 9, RAW.cebolla],
  ["Cebollín", "cebollita|cebolla de rabo|cebollitas", "verduras", "manojo", "Refri", M, 15, A.stalks("#7FB654", "#F2EEE4")],
  ["Ajo", "ajos|cabeza de ajo", "verduras", "pza", "Alacena", M, 8, A.garlic()],
  ["Papa", "papas|patata", "verduras", "kg", "Alacena", M, 30, A.potato("#C9A06A", "#9A7448")],
  ["Camote", "batata", "verduras", "kg", "Alacena", M, 32, A.potato("#B5566A", "#8A3C4E")],
  ["Zanahoria", "zanahorias", "verduras", "kg", "Refri", M, 22, A.carrot("#F08A2E")],
  ["Betabel", "remolacha", "verduras", "pza", "Refri", M, 12, A.root("#8E2448")],
  ["Rábano", "rabanos", "verduras", "manojo", "Refri", M, 15, A.root("#E04A6A", "#F5E9EC")],
  ["Jícama", "jicama", "verduras", "pza", "Refri", M, 25, A.root("#C9A06A", "#C9A06A")],
  ["Pepino", "pepinos", "verduras", "pza", "Refri", M, 8, A.long("#3E7D35", "#5E9E45")],
  ["Calabacita", "calabacitas|calabacin|zucchini", "verduras", "kg", "Refri", M, 28, A.long("#7AAE4C", "#A2CC6E")],
  ["Calabaza", "calabaza de castilla", "verduras", "pza", "Alacena", M, 45, A.pumpkin("#E07A2E", "#EE9142")],
  ["Chayote", "chayotes", "verduras", "pza", "Refri", M, 9, A.chayote()],
  ["Berenjena", "berenjenas", "verduras", "pza", "Refri", M, 15, A.long("#5A2E6A", "#7B4A8C", -45)],
  ["Pimiento morrón", "morron|pimiento|pimiento rojo", "verduras", "pza", "Refri", M, 15, A.bell("#D63A2E")],
  ["Pimiento verde", "morron verde", "verduras", "pza", "Refri", M, 12, A.bell("#3E8E3A")],
  ["Chile serrano", "serrano|serranos|chile verde", "verduras", "kg", "Refri", M, 45, A.chile("#3E8E3A")],
  ["Chile jalapeño", "jalapeno|jalapenos|cuaresmeno", "verduras", "kg", "Refri", M, 40, A.chile("#2F6E2E")],
  ["Chile poblano", "poblano|poblanos", "verduras", "kg", "Refri", M, 50, A.bell("#24552A")],
  ["Chile habanero", "habanero|habaneros", "verduras", "kg", "Refri", M, 80, A.chile("#F08A2E")],
  ["Chile seco", "chile guajillo|guajillo|chile ancho|chile de arbol|chile pasilla|chipotle", "especias", "bolsa", "Alacena", M, 25, A.chile("#7A1E1E")],
  ["Elote", "elotes|maiz", "verduras", "pza", "Refri", M, 10, A.corn()],
  ["Ejote", "ejotes|judia verde", "verduras", "kg", "Refri", M, 35, A.beans("#4E9A3A")],
  ["Chícharo", "chicharos|guisante", "verduras", "kg", "Refri", M, 40, A.pod("#5FA84A", "#8DCB6A")],
  ["Nopal", "nopales", "verduras", "pza", "Refri", M, 3, A.nopal()],
  ["Lechuga", "lechuga romana|lechuga orejona", "verduras", "pza", "Refri", M, 22, A.leafy("#6FAE45", "#A4D46C", "#B9E08A")],
  ["Espinaca", "espinacas|acelga|acelgas", "verduras", "manojo", "Refri", M, 18, A.leafy("#2F6E2E", "#3E8E3A", "#4E9A3A")],
  ["Col", "repollo|col blanca", "verduras", "pza", "Refri", M, 25, A.cabbage("#B7D99A", "#8DBA5A")],
  ["Col morada", "repollo morado", "verduras", "pza", "Refri", M, 30, A.cabbage("#7B3A7A", "#A35AA0")],
  ["Brócoli", "brocoli", "verduras", "pza", "Refri", M, 25, A.tree("#3E7D35", "#7AAE4C")],
  ["Coliflor", "coliflores", "verduras", "pza", "Refri", M, 30, A.tree("#F2EEDC", "#8DBA5A")],
  ["Apio", "apios", "verduras", "pza", "Refri", M, 20, A.stalks("#9CC86A", "#7AAE4C")],
  ["Poro", "puerro|poros", "verduras", "pza", "Refri", M, 15, A.stalks("#E3EFC9", "#5FA84A")],
  ["Espárrago", "esparragos", "verduras", "manojo", "Refri", M, 60, A.stalks("#6E9E45", "#4E7A35")],
  ["Champiñón", "champinones|hongos|setas", "verduras", "paquete", "Refri", W, 35, A.mush("#E8DCC8", "#C9B79C")],
  ["Cilantro", "cilantros", "verduras", "manojo", "Refri", M, 8, A.herb("#3E8E3A")],
  ["Perejil", "perejiles", "verduras", "manojo", "Refri", M, 8, A.herb("#2F6E2E")],
  ["Epazote", "", "verduras", "manojo", "Refri", M, 8, A.herb("#5E8A3A")],
  ["Hierbabuena", "menta", "verduras", "manojo", "Refri", M, 8, A.herb("#4FAE6A")],
  ["Jengibre", "gengibre", "verduras", "pza", "Refri", M, 10, A.ginger()],
  // ── Frutas
  ["Aguacate", "aguacates|palta", "frutas", "pza", "Frutero", M, 16, RAW.aguacate],
  ["Plátano", "platanos|banana|platano tabasco", "frutas", "kg", "Frutero", M, 25, RAW.platano],
  ["Plátano macho", "platano macho", "frutas", "pza", "Frutero", M, 10, A.long("#E3C14A", "#C9A635", -50)],
  ["Manzana", "manzanas|manzana roja", "frutas", "kg", "Frutero", M, 45, A.round("#D63A3A")],
  ["Manzana verde", "manzana golden|manzana amarilla", "frutas", "kg", "Frutero", M, 48, A.round("#9CC84A")],
  ["Pera", "peras", "frutas", "kg", "Frutero", M, 50, A.pear("#C9CF4A")],
  ["Naranja", "naranjas", "frutas", "kg", "Frutero", M, 22, A.round("#F2922E", "leaf")],
  ["Mandarina", "mandarinas", "frutas", "kg", "Frutero", M, 28, A.oval("#F0802A", 19, 16, 0, "leaf")],
  ["Toronja", "toronjas|pomelo", "frutas", "kg", "Frutero", M, 25, A.round("#F4B04A", "stem", 21)],
  ["Limón", "limones|lima", "frutas", "kg", "Frutero", M, 38, A.oval("#8CC63F", 19, 15, -20, "none")],
  ["Mango", "mangos|mango ataulfo|mango manila", "frutas", "kg", "Frutero", M, 40, A.mango("#F2B233", "#E36B2E")],
  ["Papaya", "papayas", "frutas", "kg", "Frutero", M, 28, A.slice("#7DB03E", "#F28A4A", "#2A2F33")],
  ["Sandía", "sandias", "frutas", "pza", "Frutero", M, 70, A.slice("#3E8E3A", "#E8455A", "#2A2F33")],
  ["Melón", "melones", "frutas", "pza", "Frutero", M, 45, A.slice("#C9CF8A", "#F6B26B", "#E9D9A0")],
  ["Piña", "pinas", "frutas", "pza", "Frutero", M, 35, A.pine()],
  ["Fresa", "fresas|frutilla", "frutas", "paquete", "Refri", M, 45, A.straw("#E0384A")],
  ["Uva", "uvas", "frutas", "kg", "Refri", M, 70, A.grapes("#7E3A8E", "#B98AC8")],
  ["Uva verde", "uvas verdes", "frutas", "kg", "Refri", M, 70, A.grapes("#A9C95A", "#D9EBA8")],
  ["Zarzamora", "zarzamoras|moras", "frutas", "paquete", "Refri", W, 45, A.berries("#3A1E3E", "#6A4A70")],
  ["Frambuesa", "frambuesas", "frutas", "paquete", "Refri", W, 55, A.berries("#D8345A", "#F28AA0")],
  ["Arándano", "arandanos|blueberry|blueberries", "frutas", "paquete", "Refri", W, 60, A.berries("#3A4E9A", "#8AA0D8")],
  ["Cereza", "cerezas", "frutas", "paquete", "Refri", W, 90, A.cherry("#B81E2E")],
  ["Durazno", "duraznos|melocoton", "frutas", "kg", "Frutero", M, 50, A.round("#F6A86A", "leaf")],
  ["Ciruela", "ciruelas", "frutas", "kg", "Frutero", M, 55, A.round("#7A2A5A", "stem", 18)],
  ["Guayaba", "guayabas", "frutas", "kg", "Frutero", M, 35, A.oval("#D8D85A", 19, 17, 0, "leaf", "#B8B83A")],
  ["Kiwi", "kiwis", "frutas", "pza", "Frutero", W, 8, A.cut("#8A6A3E", "#7CB342", "#E8F0C8", "#1C2A1C")],
  ["Granada", "granadas", "frutas", "pza", "Frutero", M, 30, A.pomegranate()],
  ["Coco", "cocos", "frutas", "pza", "Frutero", M, 35, A.coconut()],
  ["Tuna", "tunas", "frutas", "kg", "Frutero", M, 30, A.oval("#9CB84A", 15, 19, 0, "none", "#E8F0C8")],
  ["Higo", "higos", "frutas", "kg", "Frutero", M, 80, A.pear("#6A3A5A")],
  ["Maracuyá", "maracuya|fruta de la pasion", "frutas", "pza", "Frutero", M, 15, A.round("#6A2A5A", "stem", 18)],
  // ── Lácteos y huevo
  ["Leche", "leche entera|leche deslactosada|leche light", "lacteos", "l", "Refri", W, 28, RAW.leche],
  ["Leche de almendra", "leche vegetal|leche de avena|leche de soya", "lacteos", "l", "Refri", W, 55, A.carton("#E3D6C0", "#F7F2EA", "#B88E55")],
  ["Huevo", "huevos|blanquillos", "lacteos", "pza", "Refri", W, 3.5, A.egg()],
  ["Queso", "queso oaxaca|queso manchego|queso amarillo|queso chihuahua", "lacteos", "g", "Refri", W, 0.18, RAW.queso],
  ["Queso panela", "panela|queso fresco|queso blanco", "lacteos", "g", "Refri", W, 0.16, A.bowl("#F4F2EE", "#FBFAF6")],
  ["Queso crema", "philadelphia", "lacteos", "pza", "Refri", W, 45, A.bar("#E9EEF4", "#5AA0DB")],
  ["Yogurt", "yogur|yoghurt|yogurt natural|yogurt griego", "lacteos", "pza", "Refri", W, 15, RAW.yogurt],
  ["Crema", "crema acida|media crema", "lacteos", "pza", "Refri", W, 38, A.cream("#5AA0DB")],
  ["Mantequilla", "margarina", "lacteos", "pza", "Refri", W, 45, A.butter()],
  // ── Carnes y pescado
  ["Pollo", "pechuga|muslo|pierna de pollo|alitas", "carnes", "kg", "Refri", CH, 140, RAW.pollo],
  ["Carne de res", "bistec|res|arrachera|filete", "carnes", "kg", "Refri", CH, 220, A.steak()],
  ["Carne molida", "molida|picadillo", "carnes", "kg", "Refri", CH, 170, A.ground()],
  ["Cerdo", "puerco|chuleta|lomo|costilla", "carnes", "kg", "Refri", CH, 150, A.steak()],
  ["Pescado", "filete de pescado|tilapia|salmon|robalo", "carnes", "kg", "Congelador", CH, 180, A.fish("#8FA9B8")],
  ["Camarón", "camarones", "carnes", "kg", "Congelador", CH, 280, A.shrimp()],
  ["Atún", "atun en lata|lata de atun", "abarrotes", "lata", "Alacena", W, 22, A.can("#2F6FB0", "#F4F2EE")],
  ["Jamón", "jamon|jamon de pavo", "carnes", "paquete", "Refri", W, 55, A.ham()],
  ["Salchicha", "salchichas|hot dog", "carnes", "paquete", "Refri", W, 45, A.sausage("#D9876A")],
  ["Chorizo", "longaniza", "carnes", "paquete", "Refri", W, 45, A.sausage("#A8322A")],
  ["Tocino", "bacon", "carnes", "paquete", "Refri", W, 70, A.tray("#D9876A")],
  // ── Tortillas y pan
  ["Tortillas", "tortilla|tortillas de maiz", "pan", "kg", "Alacena", M, 26, RAW.tortillas],
  ["Tortillas de harina", "tortilla de harina", "pan", "paquete", "Alacena", W, 35, A.bowl("#F1E3C4", "#F7EDD8")],
  ["Bolillo", "bolillos|telera|teleras|pan salado", "pan", "pza", "Alacena", M, 3, A.bread()],
  ["Pan de caja", "pan blanco|pan integral|pan bimbo", "pan", "paquete", "Alacena", W, 50, A.loaf()],
  ["Pan dulce", "concha|conchas|pan de dulce", "pan", "pza", "Alacena", M, 12, A.cookie("#E7B66A", "#F4DDB4")],
  ["Tostadas", "tostada", "pan", "paquete", "Alacena", W, 30, A.bowl("#E7B66A", "#F2C94C")],
  // ── Despensa
  ["Frijol", "frijoles|frijol negro|frijol pinto|frijol bayo", "abarrotes", "kg", "Alacena", SC, 38, RAW.frijol],
  ["Arroz", "arroz blanco", "abarrotes", "kg", "Alacena", W, 32, A.rice()],
  ["Lenteja", "lentejas", "abarrotes", "kg", "Alacena", W, 40, A.bowl("#E9E1D3", "#9C6B3E")],
  ["Pasta", "sopa|espagueti|spaghetti|fideo|codito|macarron", "abarrotes", "paquete", "Alacena", W, 14, A.pasta()],
  ["Harina", "harina de trigo|harina de maiz|maseca", "abarrotes", "kg", "Alacena", W, 25, A.bag("#F4F2EE", "#2F6FB0")],
  ["Azúcar", "azucar", "abarrotes", "kg", "Alacena", W, 30, A.bag("#F7F7F5", "#E04A3A")],
  ["Avena", "avena en hojuelas", "abarrotes", "paquete", "Alacena", W, 35, A.bag("#E7D6B0", "#8A6A3E")],
  ["Cereal", "cereales|corn flakes|granola", "abarrotes", "caja", "Alacena", W, 60, A.box("#F2922E", "#E04A3A")],
  ["Aceite", "aceite de cocina|aceite vegetal|aceite de oliva", "abarrotes", "l", "Alacena", SC, 48, A.bottle("#D9A92B", "#F2D46B")],
  ["Vinagre", "vinagres", "abarrotes", "l", "Alacena", W, 22, A.bottle("#8E2433", "#F4EDE2", "#E04A3A")],
  ["Café", "cafe|cafe molido|cafe soluble|nescafe", "abarrotes", "paquete", "Alacena", SC, 120, A.coffee()],
  ["Té", "te|te de manzanilla|te verde|tes", "abarrotes", "caja", "Alacena", W, 35, A.box("#7DB03E", "#4E7A35")],
  ["Chocolate en polvo", "chocolate|chocolate abuelita|cocoa|nesquik", "abarrotes", "paquete", "Alacena", W, 55, A.choco()],
  ["Miel", "miel de abeja", "abarrotes", "frasco", "Alacena", W, 90, A.honey()],
  ["Mermelada", "mermeladas", "abarrotes", "frasco", "Refri", W, 40, A.jar("#C9372C", "#C9372C", "#F4F2EE")],
  ["Crema de cacahuate", "peanut butter|crema de mani", "abarrotes", "frasco", "Alacena", W, 60, A.jar("#C9372C", "#C9945A", "#F4F2EE")],
  ["Mayonesa", "mayonesas", "abarrotes", "frasco", "Refri", W, 45, A.jar("#2F6FB0", "#F7F1D8", "#2F6FB0")],
  ["Catsup", "ketchup|salsa catsup", "abarrotes", "botella", "Refri", W, 35, A.squeeze("#2A2F33", "#C9372C")],
  ["Mostaza", "mostazas", "abarrotes", "botella", "Refri", W, 30, A.squeeze("#2A2F33", "#E9C232")],
  ["Salsa picante", "salsa valentina|valentina|salsa botanera|salsa", "abarrotes", "botella", "Alacena", W, 25, A.bottle("#C9372C", "#9A2A1E", "#F2C94C")],
  ["Salsa de soya", "soya|salsa inglesa|jugo maggi", "abarrotes", "botella", "Alacena", W, 40, A.bottle("#E04A3A", "#3A2418")],
  ["Puré de tomate", "pure de tomate|salsa de tomate", "abarrotes", "pza", "Alacena", W, 12, A.carton("#C9372C", "#E04A3A", "#3E8E3A")],
  ["Chiles en lata", "chiles enlatados|chipotles|rajas", "abarrotes", "lata", "Alacena", W, 20, A.can("#C9372C", "#3E8E3A")],
  ["Elote en lata", "granos de elote", "abarrotes", "lata", "Alacena", W, 22, A.can("#3E8E3A", "#F2C94C")],
  ["Frijoles en lata", "frijoles refritos", "abarrotes", "lata", "Alacena", W, 22, A.can("#6B3E26", "#E9C232")],
  ["Leche condensada", "lechera|leche evaporada", "abarrotes", "lata", "Alacena", W, 28, A.can("#2F6FB0", "#F7F1D8")],
  ["Gelatina", "gelatinas|grenetina", "abarrotes", "caja", "Alacena", W, 15, A.box("#E8455A", "#F28AA0")],
  ["Galletas", "galleta|galletas marias", "botanas", "paquete", "Alacena", W, 30, A.cookie("#D9A35B", "#8A5A34")],
  // ── Especias y condimentos
  ["Sal", "sal de mesa|sal de grano", "especias", "pza", "Alacena", W, 15, A.shaker("#D8DDE0", "#F7F7F5")],
  ["Pimienta", "pimienta negra|pimienta molida", "especias", "frasco", "Alacena", W, 35, A.shaker("#2A2F33", "#3A3430")],
  ["Orégano", "oregano", "especias", "bolsa", "Alacena", M, 15, A.jar("#3E8E3A", "#5E7A3A")],
  ["Comino", "cominos", "especias", "bolsa", "Alacena", M, 15, A.jar("#8A5A34", "#A87A3E")],
  ["Canela", "canela en raja|canela molida", "especias", "bolsa", "Alacena", M, 20, A.sticks("#A0562A", "#8A4520")],
  ["Clavo", "clavos de olor|clavo de olor", "especias", "bolsa", "Alacena", M, 15, A.jar("#5A3A2A", "#4A2A1E")],
  ["Laurel", "hojas de laurel|hoja de laurel", "especias", "bolsa", "Alacena", M, 12, A.bay("#5E8A3A")],
  ["Tomillo", "mejorana|hierbas de olor|hierbas finas", "especias", "bolsa", "Alacena", M, 15, A.jar("#5E8A3A", "#7A9A4A")],
  ["Paprika", "pimenton|chile en polvo|chile piquin|tajin", "especias", "frasco", "Alacena", W, 30, A.shaker("#C9372C", "#C9452E")],
  ["Ajo en polvo", "cebolla en polvo|ajo molido", "especias", "frasco", "Alacena", W, 30, A.shaker("#E9C232", "#F2E2B8")],
  ["Cúrcuma", "curcuma|curry", "especias", "frasco", "Alacena", W, 35, A.shaker("#E9A51E", "#F2B92E")],
  ["Consomé", "consome|knorr|caldo de pollo|cubitos", "especias", "frasco", "Alacena", W, 40, A.cube("#E9B14C")],
  ["Vainilla", "extracto de vainilla", "especias", "botella", "Alacena", W, 45, A.bottle("#2A2F33", "#6B3E26", "#F2E2B8")],
  ["Ajonjolí", "ajonjoli|sesamo", "especias", "bolsa", "Alacena", M, 20, A.jar("#D9B27A", "#F2E2B8")],
  ["Bicarbonato", "polvo para hornear|royal|levadura", "especias", "pza", "Alacena", W, 20, A.box("#F7F7F5", "#E04A3A", "#E04A3A")],
  // ── Bebidas
  ["Agua", "agua natural|garrafon|agua embotellada", "bebidas", "l", "Alacena", CH, 12, RAW.agua],
  ["Agua mineral", "topo chico|peñafiel|agua con gas", "bebidas", "botella", "Refri", W, 20, A.bottle("#3E8E3A", "#CFE6D6", "#3E8E3A")],
  ["Refresco", "coca|coca cola|refrescos|soda|pepsi", "bebidas", "l", "Refri", W, 22, A.bottle("#C9372C", "#5A2A1E", "#C9372C")],
  ["Jugo", "jugos|jugo de naranja|jugo de manzana", "bebidas", "l", "Refri", W, 35, A.carton("#F2922E", "#FDF3E6", "#F2922E")],
  ["Cerveza", "cervezas|chela|chelas", "bebidas", "pza", "Refri", W, 22, A.bottle("#D9A92B", "#8A5A1E", "#F2E2B8")],
  ["Vino", "vinos|vino tinto|vino blanco", "bebidas", "botella", "Alacena", W, 180, A.bottle("#5A1E2E", "#3A1420", "#F2E2B8")],
  ["Bebida deportiva", "gatorade|electrolit|suero", "bebidas", "botella", "Refri", W, 25, A.bottle("#2F6FB0", "#6DB4D8", "#F2C94C")],
  // ── Congelados
  ["Helado", "helados|nieve", "congelados", "pza", "Congelador", W, 80, A.icecream("#E8A0B4")],
  ["Paletas", "paleta|paletas heladas", "congelados", "paquete", "Congelador", W, 60, A.popsicle("#E8455A")],
  ["Pizza congelada", "pizza", "congelados", "pza", "Congelador", W, 90, A.pizza()],
  ["Verduras congeladas", "mix de verduras|chicharo y zanahoria", "congelados", "bolsa", "Congelador", W, 40, A.bag("#8FB8E8", "#3E8E3A")],
  ["Papas a la francesa", "papas congeladas", "congelados", "bolsa", "Congelador", W, 55, A.bag("#E04A3A", "#F2C94C")],
  ["Hielo", "bolsa de hielo|hielos", "congelados", "bolsa", "Congelador", CH, 25, A.bag("#DDEFFA", "#5AA0DB")],
  // ── Botanas y dulces
  ["Papitas", "papas fritas|sabritas|botana", "botanas", "bolsa", "Alacena", W, 20, A.chips("#F2C94C", "#E04A3A")],
  ["Totopos", "totopo|chips de tortilla", "botanas", "bolsa", "Alacena", W, 35, A.chips("#E07A2E", "#F2C94C")],
  ["Cacahuates", "cacahuate|mani|nueces|almendras", "botanas", "bolsa", "Alacena", SC, 45, A.bowl("#C9945A", "#D9B27A")],
  ["Palomitas", "palomitas de maiz", "botanas", "caja", "Alacena", W, 35, A.box("#E04A3A", "#F7F7F5", "#F2E2B8")],
  ["Chocolates", "chocolate|chocolates|barra de chocolate", "botanas", "pza", "Alacena", W, 25, A.choco()],
  ["Dulces", "dulce|caramelos|gomitas|paletas de dulce", "botanas", "bolsa", "Alacena", W, 30, A.candy("#E8455A")],
  // ── Limpieza
  ["Jabón para trastes", "lavatrastes|salvo|axion|jabon de trastes", "limpieza", "botella", "Lavandería", W, 45, A.squeeze("#2F6FB0", "#5FC1A0")],
  ["Detergente", "detergente para ropa|jabon para ropa|ariel|roma|foca", "limpieza", "kg", "Lavandería", SC, 45, A.box("#2F6FB0", "#E04A3A")],
  ["Suavizante", "suavitel|downy", "limpieza", "l", "Lavandería", SC, 40, A.bottle("#5A3A8E", "#A58BD8")],
  ["Cloro", "blanqueador|clorox", "limpieza", "l", "Lavandería", W, 25, A.bottle("#2F6FB0", "#F4F6FA", "#2F6FB0")],
  ["Limpiador", "pinol|fabuloso|limpiador multiusos|desinfectante|lysol", "limpieza", "l", "Lavandería", W, 35, A.bottle("#E9C232", "#C988E0", "#F4F2EE")],
  ["Esponjas", "esponja|fibra|fibras", "limpieza", "paquete", "Lavandería", W, 30, A.sponge()],
  ["Bolsas de basura", "bolsas para basura|bolsa de basura", "limpieza", "rollo", "Lavandería", SC, 45, A.trashbags()],
  ["Papel aluminio", "aluminio", "limpieza", "rollo", "Alacena", W, 40, A.foil("#C8CFD4")],
  ["Plástico para envolver", "egapack|kleen pack|film", "limpieza", "rollo", "Alacena", W, 35, A.foil("#DDEFFA")],
  ["Servilletas", "servilleta", "limpieza", "paquete", "Alacena", W, 25, A.pack("#F4F6FA", "#E8EEF4", 2)],
  ["Toallas de papel", "papel de cocina|toallas de cocina", "limpieza", "rollo", "Alacena", SC, 40, A.roll("#F4F6FA", "#C8B79C")],
  ["Escoba", "trapeador|recogedor", "limpieza", "pza", "Lavandería", W, 70, A.broom()],
  ["Pilas", "baterias|pila", "otros", "paquete", "Alacena", SC, 90, A.battery()],
  ["Focos", "foco|bombilla", "otros", "pza", "Alacena", W, 45, A.bulb()],
  // ── Higiene y baño
  ["Papel de baño", "papel higienico|papel de bano|papel sanitario", "higiene", "paquete", "Baño", SC, 95, A.roll("#FFFFFF", "#C8B79C")],
  ["Jabón de baño", "jabon de tocador|jabon|jabones|jabon en barra", "higiene", "pza", "Baño", W, 18, A.bar("#F2A7C0")],
  ["Jabón líquido", "jabon de manos|jabon liquido", "higiene", "botella", "Baño", W, 45, A.pump("#F4F6FA", "#7BC4C4")],
  ["Shampoo", "champu|shampoo|acondicionador", "higiene", "botella", "Baño", W, 70, A.squeeze("#5A3A8E", "#A58BD8")],
  ["Pasta de dientes", "pasta dental|dentifrico|colgate", "higiene", "pza", "Baño", W, 35, A.tube("#2F6FB0", "#E04A3A")],
  ["Cepillo de dientes", "cepillos|cepillo dental", "higiene", "pza", "Baño", W, 30, A.brush("#2F6FB0")],
  ["Hilo dental", "enjuague bucal|listerine", "higiene", "pza", "Baño", W, 45, A.pump("#2F6FB0", "#5FC1A0")],
  ["Desodorante", "desodorantes|antitranspirante", "higiene", "pza", "Baño", W, 60, A.deo("#2F6FB0")],
  ["Crema corporal", "crema para el cuerpo|crema humectante|bloqueador", "higiene", "botella", "Baño", W, 70, A.squeeze("#F4F6FA", "#F2D6B8")],
  ["Rastrillo", "rastrillos|navaja de afeitar|espuma de afeitar", "higiene", "paquete", "Baño", W, 60, A.razor("#2F6FB0")],
  ["Toallas femeninas", "toallas sanitarias|tampones|protectores", "higiene", "paquete", "Baño", W, 50, A.pad("#C988E0")],
  ["Pañales", "panal|panales|toallitas humedas", "higiene", "paquete", "Baño", SC, 250, A.diaper()],
  ["Pañuelos", "kleenex|panuelos desechables", "higiene", "caja", "Baño", W, 30, A.box("#7BC4C4", "#F4F6FA", "#F4F6FA")],
  ["Algodón", "algodon|cotonetes|hisopos", "higiene", "paquete", "Baño", W, 30, A.pack("#F4F6FA", "#FFFFFF", 3)],
  ["Medicinas", "paracetamol|ibuprofeno|botiquin|curitas|vitaminas", "higiene", "caja", "Baño", W, 60, A.pill("#E04A3A")],
  // ── Mascotas
  ["Croquetas de perro", "croquetas|comida de perro|alimento para perro", "mascotas", "kg", "Alacena", SC, 60, A.pet("#C9372C")],
  ["Croquetas de gato", "comida de gato|alimento para gato", "mascotas", "kg", "Alacena", SC, 70, A.pet("#5A3A8E")],
  ["Arena para gato", "arena", "mascotas", "kg", "Lavandería", SC, 25, A.bag("#B48A5A", "#5A3A8E")],
];

const unique = new Map();
export const CATALOG = ROWS.map(([name, kw, cat, unit, place, store, price, art]) => {
  const keys = [norm(name), ...String(kw).split("|").map(norm).filter(Boolean)];
  return { name, keys, cat, unit, place, store, price, art };
}).filter((e) => (unique.has(norm(e.name)) ? false : unique.set(norm(e.name), 1)));

// Busca el producto del catálogo que mejor coincide con lo que escribió la persona.
// Gana la palabra clave más larga que aparece al inicio de una palabra; las muy cortas (sal, té) deben ser palabra completa.
const KEYS = CATALOG.flatMap((e) => e.keys.map((k) => [k, e])).sort((a, b) => b[0].length - a[0].length);
const cache = new Map();
export function findFood(name) {
  const n = " " + norm(name).replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ") + " ";
  if (cache.has(n)) return cache.get(n);
  let hit = null;
  for (const [k, e] of KEYS) {
    const i = n.indexOf(" " + k);
    if (i < 0) continue;
    const after = n[i + 1 + k.length];
    if (k.length <= 3 ? after === " " : true) { hit = e; break; }
  }
  cache.set(n, hit);
  return hit;
}

export function guess(name) {
  const e = findFood(name);
  if (!e) return { entry: null, cat: "otros", unit: "pza", place: "Refri", store: null };
  return { entry: e, cat: e.cat, unit: e.unit, place: e.place, store: e.store };
}

const CONV = { kg: ["g", 1000], l: ["ml", 1000] };
export function unitPrice(item) {
  if (item.price) return Number(item.price);
  const e = findFood(item.name);
  if (!e || e.price == null) return null;
  const u = item.unit || e.unit;
  if (u === e.unit) return e.price;
  if (CONV[e.unit]?.[0] === u) return e.price / CONV[e.unit][1];
  if (CONV[u]?.[0] === e.unit) return e.price * CONV[u][1];
  return null;
}

export const QUICK = ["Jitomate", "Cebolla", "Aguacate", "Limón", "Plátano", "Leche", "Huevo", "Tortillas", "Pollo", "Queso", "Frijol", "Papel de baño"];
export const STAPLES = ["Tortillas", "Huevo", "Leche", "Jitomate", "Cebolla", "Frijol", "Arroz", "Limón", "Papel de baño", "Sal", "Aceite", "Jabón para trastes"];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function foodSVG(name, cat, size = 56) {
  const e = findFood(name);
  if (e) return `<svg class="food" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">${e.art}</svg>`;
  const tint = (CAT[cat] || CAT.otros).tint;
  const letter = esc((String(name).trim()[0] || "?").toUpperCase());
  return `<svg class="food" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="22" fill="${tint}" opacity=".22"/><circle cx="32" cy="34" r="15" fill="${tint}" opacity=".55"/><text x="32" y="41" text-anchor="middle" font-family="Bricolage, sans-serif" font-weight="800" font-size="20" fill="#fff">${letter}</text></svg>`;
}
