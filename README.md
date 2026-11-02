# 🧊 Refri Familiar

App para celular (Android y iPhone) para saber **qué hay en el refri**, armar la **lista de compras por tienda** y recibir **recomendaciones de qué comprar**. Se comparte entre toda la familia, funciona **sin internet** y se **actualiza sola**.

- 📱 Se instala desde el navegador, sin tiendas de apps.
- 👨‍👩‍👧‍👦 Hasta 8 personas por hogar, cada quien con su cuenta (Google o correo).
- 📶 Sin señal puedes seguir usándola; se sincroniza al volver.
- 🛒 Lista separada por tienda (Mercado, Walmart, Chedraui, Sam's Club…) y exportable a PDF.
- 💡 Recomendaciones y gasto estimado en pesos, calculados con el consumo de tu familia. **Gratis**, sin IA de pago.
- 🌗 Tema claro, oscuro o automático, 5 colores y letra grande.

**Costo: $0.** Se aloja en GitHub Pages y los datos viven en el plan gratuito de Firebase.

---

## Configuración (una sola vez, ~10 minutos)

### 1. Crear el proyecto de Firebase
1. Entra a <https://console.firebase.google.com> y toca **Agregar proyecto**. Nómbralo `refri-familiar`. Puedes desactivar Google Analytics.
2. En el menú, abre **Compilación → Firestore Database → Crear base de datos**. Elige la ubicación `nam5 (us-central)` y empieza en **modo de producción**.
3. En Firestore, abre la pestaña **Reglas**, borra lo que haya, pega el contenido de [`firestore.rules`](firestore.rules) y toca **Publicar**.
4. Abre **Compilación → Authentication → Comenzar**. En *Método de acceso* activa **Google** y **Correo electrónico/contraseña**.
5. En *Authentication → Configuración → Dominios autorizados*, agrega `amarillo07.github.io`.

### 2. Conectar la app
1. En ⚙️ **Configuración del proyecto → Tus apps**, toca el ícono **`</>`** (Web), ponle un nombre y regístrala. *No necesitas Firebase Hosting.*
2. Copia el bloque `firebaseConfig` y pégalo en [`js/config.js`](js/config.js).
3. Sube el cambio. En `sw.js`, cambia `VERSION` (por ejemplo `refri-v1.0.1`) para que los teléfonos tomen la configuración nueva.

> Los valores de `firebaseConfig` **no son secretos**. Lo que protege tus datos son las reglas de Firestore.

### 3. Instalar en el celular
Abre **https://amarillo07.github.io/refri-familiar/**
- **iPhone (Safari):** botón Compartir → **Agregar a inicio**.
- **Android (Chrome):** menú ⋮ → **Instalar app** o **Agregar a la pantalla principal**.

### 4. Invitar a la familia
1. La primera persona entra y toca **Crear hogar**.
2. En **Ajustes** aparece un **código de 6 letras**. Compártelo.
3. Los demás instalan la app, entran con su cuenta y escriben el código en **Unirme a mi familia**.

---

## Cómo se actualiza
Cada cambio que se sube a la rama `main` se publica solo en GitHub Pages. Al abrir la app, aparece **"Hay una versión nueva · Actualizar"**. Recuerda subir `VERSION` en `sw.js` en cada publicación.

## Estructura
| Archivo | Qué es |
|---|---|
| `index.html`, `styles.css` | La app y su diseño |
| `js/app.js` | Pantallas, sincronización, lista, PDF y recomendaciones |
| `js/foods.js` | Ilustraciones, categorías y precios aproximados (MXN) |
| `js/config.js` | Conexión a tu Firebase |
| `sw.js`, `manifest.webmanifest`, `icons/` | Lo que la hace instalable y funcionar sin internet |
| `vendor/`, `fonts/` | Firebase, jsPDF y tipografías guardadas localmente |
| `firestore.rules` | Reglas de seguridad de la base de datos |
