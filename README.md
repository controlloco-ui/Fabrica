# Fabrica
Stock

## Probador virtual — La Fábrica · Santos (`probador/`)

Web para clientes: suben una foto de cuerpo entero, eligen prendas del catálogo de las dos tiendas (hasta 4, una de cada tipo) y una IA genera la misma foto con esas prendas puestas. Incluye comparador antes/después, descarga, compartir, historial de pruebas de la sesión y botón para consultar por WhatsApp a cada tienda.

**Cómo funciona.** La página (`probador/index.html`) achica la foto en el teléfono y la manda a la función `api/probar.js`. La función busca las fotos de las prendas elegidas en `probador/catalogo.json` y le pide la imagen a **Gemini** (la IA de imágenes de Google). La clave de la IA queda solo en el servidor; la foto del cliente no se guarda.

### Ponerlo en marcha

1. **Clave de la IA.** Creá una clave en [Google AI Studio](https://aistudio.google.com/apikey) y activá la facturación en ese proyecto (sin facturación, Google puede usar los datos para mejorar sus productos; con facturación, no). Conviene poner un tope de gasto en Google Cloud.
2. **Publicar.** Importá este repo en [Vercel](https://vercel.com/new) (plan gratuito) y en *Settings → Environment Variables* cargá `GEMINI_API_KEY`. El probador queda en `https://tu-sitio.vercel.app/probador/`. `vercel.json` ya configura la función (tiempo máximo e inclusión de las fotos).
3. **Cargar las prendas reales** (ver abajo) y borrar las de ejemplo.

Variables opcionales: `GEMINI_MODEL` (para usar otro modelo de imagen, por ejemplo uno de mayor calidad; si no existe, prueba los de siempre) y `PROBADOR_LIMITE_POR_HORA` (pruebas por hora por persona, 20 por defecto; `0` = sin límite).

**Costo aproximado:** unos US$ 0,07 por prueba con el modelo por defecto (cada vez que alguien toca «Probármelo»); unos US$ 0,13 si se usa un modelo Pro. Verificá los precios vigentes en la página de precios de Gemini.

### Cargar el catálogo

Cada prenda va en `probador/catalogo.json`, con su foto en `probador/prendas/`:

```json
{
  "id": "santos-camisa-celeste",
  "tienda": "santos",
  "nombre": "Camisa de lino",
  "categoria": "superior",
  "color": "Celeste",
  "precio": 45000,
  "descripcion": "Camisa de lino manga larga, cuello clásico, botones blancos",
  "imagen": "prendas/camisa-celeste.jpg"
}
```

- `tienda`: `fabrica` o `santos` (definidas arriba en `tiendas`; ahí también va el `whatsapp` de cada una, con código de país, ej. `5491122334455`, para que aparezca el botón «Consultar»).
- `categoria`: `superior` (remeras, camisas, buzos), `inferior` (pantalones, jeans, polleras, shorts), `entero` (vestidos, enteritos), `abrigo` (camperas, sacos, blazers), `calzado` o `accesorio`.
- `precio` es opcional. `descripcion` ayuda a la IA a respetar tela, largo y calce.
- `imagen`: archivo en `probador/prendas/` o una URL `https://` (por ejemplo, la foto de la tienda online).
- **Fotos de prendas:** la prenda sola, de frente, completa, con fondo liso (sobre una mesa o en percha). JPG, PNG o WEBP, de menos de 5 MB (idealmente unos 1000 px y menos de 1 MB).
- Las prendas con `"ejemplo": true` son ilustraciones de muestra: reemplazalas por las reales.

Para revisar que el catálogo esté bien (ids repetidos, fotos que faltan, categorías mal escritas): `node --test`.

### Probarlo en tu computadora

```bash
GEMINI_API_KEY=tu-clave node probador/servidor-local.js
# o con la clave en un archivo .env (no se sube al repo): node --env-file=.env probador/servidor-local.js
```

y abrí <http://localhost:3000/probador/>. Requiere Node 18 o más nuevo.

**Límites a tener en cuenta:** es una simulación hecha con IA. Sirve para ver cómo combina y cómo queda una prenda, pero no garantiza talle ni calce exactos, y a veces puede cambiar detalles (estampas chicas, logos, textura). Funciona mejor con fotos de cuerpo entero, de frente, con buena luz y una sola persona.

## Zancada — app de entrenamiento para runners (`runner/`)

PWA instalable y sin conexión (abre `runner/index.html`). Los datos se guardan en el dispositivo (con exportar/importar JSON).

- **Hoy**: entreno del día, semana con cumplimiento, km semana/mes, cuenta atrás a la carrera, ratio de carga aguda:crónica (riesgo de lesión) y consejo diario.
- **Correr**: seguimiento GPS (distancia, ritmo actual/medio, parciales por km con aviso por voz, recorrido) con avisos por voz configurables (cada distancia o tiempo), ritmo objetivo y meta; y constructor de sesiones de series: bloques con repeticiones, trabajo y recuperación por tiempo o distancia (m/km), ritmo objetivo por tramo, entrenador de ritmo por voz, sesiones guardadas y resultados por serie.
- **Mapa y resumen**: mapa en vivo con OpenStreetMap (Leaflet, incluido en `runner/vendor/`, capa satélite opcional) y, al terminar, resumen con el recorrido coloreado por ritmo, marcas por km, tiempo en movimiento, desnivel, calorías, gráfico de parciales, *negative split* y puntuación de efectividad (meta/plan, ritmo objetivo y regularidad). Exportación GPX para Strava, Garmin o Google Earth.
- **Pantalla apagada (Android)**: un servicio en primer plano mantiene GPS, cronómetro, series, voz (bajando el volumen de la música) y pitidos con la pantalla bloqueada, con una notificación que muestra el progreso.
- **Plan**: generador de planes 5K / 10K / media / maratón según nivel, días por semana, volumen actual y fecha de carrera. Periodización base → construcción → específico → taper, progresión ≤ 10 %, descarga cada 4 semanas, 80/20, fuerza incluida.
- **Diario**: registro con RPE, FC, zapatillas y notas; estadísticas (volumen semanal, distribución por intensidad, mejores marcas) y control de kilometraje de zapatillas.
- **Calcular**: VDOT de Daniels con ritmos E/M/T/I/R y predicción de marcas (y Riegel), ritmo/tiempo/distancia, zonas de FC (Karvonen + Tanaka), parciales con negative split, nutrición e hidratación en carrera, conversor ritmo/velocidad.
- **Guía**: principios, tipos de entreno, calentamiento, fuerza, prevención de lesiones, nutrición, técnica y checklist de carrera, con fuentes.
