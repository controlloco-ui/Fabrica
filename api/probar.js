'use strict';
// Probador virtual — función de servidor (POST /api/probar).
//
// Recibe la foto del cliente y los ids de las prendas elegidas, busca las fotos de esas
// prendas en probador/catalogo.json y le pide a Gemini (Google) una imagen de la misma
// persona con esas prendas puestas. La clave de la IA vive solo acá (variable de entorno
// GEMINI_API_KEY), nunca en la página.
//
// Funciona como función de Vercel tal cual, y también con probador/servidor-local.js.

const fs = require('fs/promises');
const path = require('path');

const DIR_PROBADOR = path.join(__dirname, '..', 'probador');
const API_GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models';
// Se prueban en orden; si uno no existe (404) se pasa al siguiente. GEMINI_MODEL va primero.
const MODELOS = ['gemini-3.1-flash-image', 'gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];
const MAX_PRENDAS = 4;
const MAX_FOTO = 8 * 1024 * 1024; // largo máximo del data URL de la foto del cliente
const MAX_IMAGEN_PRENDA = 5 * 1024 * 1024; // bytes por foto de prenda
const ESPERA_IA_MS = 110 * 1000;
const PROPORCIONES = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'];
const TIPOS_IMAGEN = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// Qué es cada categoría del catálogo, explicado para el modelo.
const CATEGORIAS = {
  superior: 'a top (t-shirt, shirt, sweater or similar). It replaces whatever the person wears on the upper body.',
  inferior: 'a bottom (trousers, jeans, skirt or shorts). It replaces whatever the person wears on the lower body.',
  entero: 'a one-piece garment (dress or jumpsuit). It replaces both the top and the bottom the person is wearing.',
  abrigo: 'outerwear (jacket, coat or blazer). The person wears it as the outer layer, over the other clothes.',
  calzado: 'footwear. It replaces the shoes the person is wearing.',
  accesorio: 'an accessory. Add it where it is naturally worn.',
};
// Categorías que no se pueden combinar (además de repetir la misma).
const CHOQUES = { entero: ['superior', 'inferior'], superior: ['entero'], inferior: ['entero'] };

const INTRO = 'You are the virtual fitting room of a clothing store. Dress the customer shown in IMAGE 1 with the catalog garments shown in the following images.';
const REGLAS = `Create a new version of IMAGE 1 where the same person is wearing all of the catalog garments listed above.
Rules:
1. The person must stay exactly the same: face, identity, expression, hair, skin tone, body shape, height and proportions. Do not slim, reshape, age or beautify them.
2. Keep the same pose, camera angle, framing, background and lighting as IMAGE 1. Do not crop or zoom.
3. Copy each garment faithfully from its product photo: same color, fabric, texture, pattern, print, logos, buttons, length and cut. Ignore any hanger, mannequin, model, label or background in the product photos.
4. The garments must fit the body naturally in a regular size, with realistic drape, folds and shadows that match the lighting of IMAGE 1.
5. Any clothing of the person that is not replaced by a catalog garment stays as it is.
6. Do not add text, watermarks, logos, extra accessories or other people.
Return only the final photo.`;

const FOTO_RECHAZADA = 'La IA no pudo procesar esta foto. Probá con otra: de cuerpo entero, de frente, con buena luz y sin otras personas.';

class ErrorProbador extends Error {
  constructor(status, mensaje) { super(mensaje); this.status = status; }
}

// ---------- Límite de uso por IP (en memoria: es aproximado en servidores sin estado) ----------
const usos = new Map();
let modeloQueAnda = null;

function superaLimite(ip) {
  const limite = process.env.PROBADOR_LIMITE_POR_HORA ? Number(process.env.PROBADOR_LIMITE_POR_HORA) : 20;
  if (!limite) return false;
  const ahora = Date.now();
  const recientes = (usos.get(ip) || []).filter(t => ahora - t < 3600 * 1000);
  const supera = recientes.length >= limite;
  if (!supera) recientes.push(ahora);
  if (usos.size > 5000) usos.clear();
  usos.set(ip, recientes);
  return supera;
}

function ipDe(req) {
  const reenviada = req.headers && req.headers['x-forwarded-for'];
  if (reenviada) return String(reenviada).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'desconocida';
}

// ---------- Datos de entrada ----------
function leerCuerpo(cuerpo) {
  if (Buffer.isBuffer(cuerpo)) cuerpo = cuerpo.toString('utf8');
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch { throw new ErrorProbador(400, 'El pedido no es válido.'); }
  }
  if (!cuerpo || typeof cuerpo !== 'object') throw new ErrorProbador(400, 'El pedido no es válido.');
  return cuerpo;
}

function leerFoto(foto) {
  if (typeof foto !== 'string' || !foto) throw new ErrorProbador(400, 'Falta tu foto.');
  if (foto.length > MAX_FOTO) throw new ErrorProbador(413, 'La foto es demasiado pesada. Probá con otra.');
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(foto);
  if (!m) throw new ErrorProbador(400, 'La foto tiene que ser JPG, PNG o WEBP.');
  return { mimeType: m[1], data: m[2] };
}

async function cargarCatalogo() {
  const texto = await fs.readFile(path.join(DIR_PROBADOR, 'catalogo.json'), 'utf8');
  return JSON.parse(texto);
}

function elegirPrendas(catalogo, ids) {
  if (!Array.isArray(ids) || ids.length === 0) throw new ErrorProbador(400, 'Elegí al menos una prenda.');
  if (ids.length > MAX_PRENDAS) throw new ErrorProbador(400, `Podés probarte hasta ${MAX_PRENDAS} prendas a la vez.`);
  if (new Set(ids).size !== ids.length) throw new ErrorProbador(400, 'Elegiste la misma prenda dos veces.');
  const prendas = ids.map(id => {
    const prenda = (catalogo.prendas || []).find(p => p.id === id);
    if (!prenda || !CATEGORIAS[prenda.categoria]) throw new ErrorProbador(400, 'Una de las prendas ya no está en el catálogo. Recargá la página.');
    return prenda;
  });
  for (const a of prendas) {
    const chocan = prendas.filter(b => b !== a && (b.categoria === a.categoria || (CHOQUES[a.categoria] || []).includes(b.categoria)));
    if (chocan.length) throw new ErrorProbador(400, `No se pueden combinar "${a.nombre}" y "${chocan[0].nombre}". Elegí una sola prenda de cada tipo.`);
  }
  return prendas;
}

async function cargarImagenPrenda(prenda) {
  const falla = () => new ErrorProbador(500, `No se pudo cargar la foto de "${prenda.nombre}".`);
  let datos, mimeType;
  if (/^https?:\/\//i.test(prenda.imagen)) {
    let r;
    try { r = await fetch(prenda.imagen, { signal: AbortSignal.timeout(20000) }); } catch { throw falla(); }
    mimeType = (r.headers.get('content-type') || '').split(';')[0].trim();
    if (!r.ok || !Object.values(TIPOS_IMAGEN).includes(mimeType)) throw falla();
    datos = Buffer.from(await r.arrayBuffer());
  } else {
    const ruta = path.resolve(DIR_PROBADOR, prenda.imagen);
    mimeType = TIPOS_IMAGEN[path.extname(ruta).toLowerCase()];
    if (!ruta.startsWith(DIR_PROBADOR + path.sep) || !mimeType) throw falla();
    try { datos = await fs.readFile(ruta); } catch { throw falla(); }
  }
  if (datos.length > MAX_IMAGEN_PRENDA) throw new ErrorProbador(500, `La foto de "${prenda.nombre}" es demasiado pesada (máximo 5 MB).`);
  return { mimeType, data: datos.toString('base64') };
}

// ---------- Pedido a Gemini ----------
function armarPedido({ foto, prendas, imagenes, proporcion }) {
  const partes = [{ text: INTRO }, { text: 'IMAGE 1 — the customer:' }, { inlineData: foto }];
  prendas.forEach((p, i) => {
    const color = p.color ? ` (color: ${p.color})` : '';
    const detalle = p.descripcion ? ` Details: ${p.descripcion}.` : '';
    partes.push({ text: `IMAGE ${i + 2} — catalog product "${p.nombre}"${color}: ${CATEGORIAS[p.categoria]}${detalle}` });
    partes.push({ inlineData: imagenes[i] });
  });
  partes.push({ text: REGLAS });
  const generationConfig = { responseModalities: ['TEXT', 'IMAGE'] };
  if (PROPORCIONES.includes(proporcion)) generationConfig.imageConfig = { aspectRatio: proporcion };
  return { contents: [{ role: 'user', parts: partes }], generationConfig };
}

function errorDeGemini(status, json) {
  const detalle = (json && json.error && json.error.message) || '';
  console.error(`Gemini respondió ${status}: ${detalle}`);
  if (status === 400 && /api key/i.test(detalle)) return new ErrorProbador(500, 'La clave de Gemini configurada en el servidor no es válida.');
  if (status === 401 || status === 403) return new ErrorProbador(500, 'La clave de Gemini no tiene permiso para generar imágenes (revisá que la facturación esté activa).');
  if (status === 429) return new ErrorProbador(429, 'El probador está con mucha demanda. Esperá un minuto y probá de nuevo.');
  if (status === 400) return new ErrorProbador(422, FOTO_RECHAZADA);
  return new ErrorProbador(502, 'El servicio de IA está con problemas. Probá de nuevo en un rato.');
}

function extraerImagen(json) {
  if (json.promptFeedback && json.promptFeedback.blockReason) throw new ErrorProbador(422, FOTO_RECHAZADA);
  const candidato = (json.candidates || [])[0] || {};
  const partes = (candidato.content && candidato.content.parts) || [];
  const imagen = partes.filter(p => !p.thought && (p.inlineData || p.inline_data)).pop();
  if (imagen) {
    const d = imagen.inlineData || imagen.inline_data;
    return `data:${d.mimeType || d.mime_type || 'image/png'};base64,${d.data}`;
  }
  const texto = partes.map(p => p.text).filter(Boolean).join(' ');
  console.error(`Gemini no devolvió imagen (finishReason=${candidato.finishReason}): ${texto.slice(0, 300)}`);
  if (candidato.finishReason && candidato.finishReason !== 'STOP') throw new ErrorProbador(422, FOTO_RECHAZADA);
  throw new ErrorProbador(502, 'La IA no devolvió una imagen. Probá de nuevo.');
}

async function generar(pedido, clave) {
  const candidatos = modeloQueAnda ? [modeloQueAnda] : [...new Set([process.env.GEMINI_MODEL, ...MODELOS].filter(Boolean))];
  const cuerpo = JSON.stringify(pedido);
  for (const modelo of candidatos) {
    let r;
    try {
      r = await fetch(`${API_GEMINI}/${encodeURIComponent(modelo)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
        body: cuerpo,
        signal: AbortSignal.timeout(ESPERA_IA_MS),
      });
    } catch (e) {
      if (e && e.name === 'TimeoutError') throw new ErrorProbador(504, 'La IA tardó demasiado en responder. Probá de nuevo.');
      throw new ErrorProbador(502, 'No pudimos conectar con el servicio de IA. Probá de nuevo.');
    }
    const json = await r.json().catch(() => ({}));
    if (r.status === 404) {
      console.warn(`El modelo ${modelo} no está disponible; pruebo el siguiente.`);
      continue;
    }
    if (!r.ok) throw errorDeGemini(r.status, json);
    modeloQueAnda = modelo;
    return { imagen: extraerImagen(json), modelo };
  }
  throw new ErrorProbador(500, 'Ningún modelo de imagen de Gemini está disponible. Configurá GEMINI_MODEL con un modelo vigente.');
}

// ---------- Handler ----------
function responder(res, status, objeto) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(objeto));
}

async function probar(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return responder(res, 405, { error: 'Método no permitido.' });
  }
  try {
    const clave = process.env.GEMINI_API_KEY;
    if (!clave) throw new ErrorProbador(503, 'El probador todavía no está configurado: falta la clave GEMINI_API_KEY en el servidor.');
    const datos = leerCuerpo(req.body);
    const foto = leerFoto(datos.foto);
    const prendas = elegirPrendas(await cargarCatalogo(), datos.prendas);
    if (superaLimite(ipDe(req))) throw new ErrorProbador(429, 'Hiciste muchas pruebas seguidas. Esperá un rato y volvé a intentar.');
    const imagenes = await Promise.all(prendas.map(cargarImagenPrenda));
    const pedido = armarPedido({ foto, prendas, imagenes, proporcion: datos.proporcion });
    const { imagen, modelo } = await generar(pedido, clave);
    responder(res, 200, { imagen, modelo });
  } catch (e) {
    if (e instanceof ErrorProbador) return responder(res, e.status, { error: e.message });
    console.error(e);
    responder(res, 500, { error: 'Algo salió mal al generar la imagen. Probá de nuevo.' });
  }
}

module.exports = probar;
module.exports._interno = {
  armarPedido, elegirPrendas, cargarCatalogo, CATEGORIAS, MAX_PRENDAS,
  reiniciar() { usos.clear(); modeloQueAnda = null; },
};
