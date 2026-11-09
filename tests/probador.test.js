'use strict';
// Pruebas del probador virtual. Correr con: node --test
// No llaman a la IA de verdad: se reemplaza fetch por respuestas simuladas.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const probar = require('../api/probar.js');
const { reiniciar, CATEGORIAS } = probar._interno;

const CATALOGO = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'probador', 'catalogo.json'), 'utf8'));
const FOTO = 'data:image/jpeg;base64,' + Buffer.from('foto-de-prueba').toString('base64');
const IMAGEN_IA = Buffer.from('imagen-generada').toString('base64');
const fetchOriginal = global.fetch;

function pedir(body, { method = 'POST', ip = '1.1.1.1' } = {}) {
  return new Promise(resolve => {
    const res = {
      headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(texto) { resolve({ status: this.statusCode, json: JSON.parse(texto) }); },
    };
    probar({ method, body, headers: { 'x-forwarded-for': ip } }, res);
  });
}

// Simula la API de Gemini y guarda los pedidos que recibe.
function simularGemini(responder) {
  const pedidos = [];
  global.fetch = async (url, opciones) => {
    pedidos.push({ url: String(url), opciones, cuerpo: JSON.parse(opciones.body) });
    const { status = 200, json } = responder(String(url), pedidos.length);
    return new Response(JSON.stringify(json), { status, headers: { 'content-type': 'application/json' } });
  };
  return pedidos;
}
const respuestaConImagen = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'listo' }, { inlineData: { mimeType: 'image/png', data: IMAGEN_IA } }] } }] };

test.beforeEach(() => {
  reiniciar();
  process.env.GEMINI_API_KEY = 'clave-de-prueba';
  process.env.PROBADOR_LIMITE_POR_HORA = '0';
  delete process.env.GEMINI_MODEL;
});
test.afterEach(() => { global.fetch = fetchOriginal; });

test('el catálogo es válido: ids únicos, tiendas y categorías conocidas, fotos existentes', () => {
  const ids = new Set();
  assert.ok(CATALOGO.prendas.length > 0, 'el catálogo no tiene prendas');
  for (const p of CATALOGO.prendas) {
    assert.ok(p.id && !ids.has(p.id), `id repetido o vacío: ${p.id}`);
    ids.add(p.id);
    assert.ok(p.nombre, `${p.id}: falta el nombre`);
    assert.ok(CATALOGO.tiendas[p.tienda], `${p.id}: tienda desconocida "${p.tienda}"`);
    assert.ok(CATEGORIAS[p.categoria], `${p.id}: categoría desconocida "${p.categoria}"`);
    if (!/^https?:\/\//.test(p.imagen)) {
      const ruta = path.join(__dirname, '..', 'probador', p.imagen);
      assert.ok(fs.existsSync(ruta), `${p.id}: no existe la foto ${p.imagen}`);
      assert.ok(/\.(jpe?g|png|webp)$/i.test(p.imagen), `${p.id}: la foto tiene que ser JPG, PNG o WEBP`);
      assert.ok(fs.statSync(ruta).size <= 5 * 1024 * 1024, `${p.id}: la foto pesa más de 5 MB`);
    }
  }
});

test('sin clave de Gemini avisa que no está configurado', async () => {
  delete process.env.GEMINI_API_KEY;
  const r = await pedir({ foto: FOTO, prendas: ['fabrica-remera-blanca'] });
  assert.equal(r.status, 503);
  assert.match(r.json.error, /GEMINI_API_KEY/);
});

test('solo acepta POST', async () => {
  const r = await pedir(undefined, { method: 'GET' });
  assert.equal(r.status, 405);
});

test('valida la foto y las prendas', async () => {
  simularGemini(() => { throw new Error('no debería llamar a la IA'); });
  assert.equal((await pedir({ prendas: ['fabrica-remera-blanca'] })).status, 400);
  assert.equal((await pedir({ foto: 'data:text/html;base64,AAAA', prendas: ['fabrica-remera-blanca'] })).status, 400);
  assert.equal((await pedir({ foto: FOTO, prendas: [] })).status, 400);
  assert.equal((await pedir({ foto: FOTO, prendas: ['no-existe'] })).status, 400);
  assert.equal((await pedir({ foto: FOTO, prendas: ['fabrica-remera-blanca', 'fabrica-remera-blanca'] })).status, 400);
  const choque = await pedir({ foto: FOTO, prendas: ['fabrica-remera-blanca', 'santos-camisa-celeste'] });
  assert.equal(choque.status, 400);
  assert.match(choque.json.error, /una sola prenda de cada tipo/);
  const vestidoYJean = await pedir({ foto: FOTO, prendas: ['santos-vestido-terracota', 'fabrica-jean-azul'] });
  assert.equal(vestidoYJean.status, 400);
  assert.equal((await pedir('esto no es json')).status, 400);
});

test('arma el pedido con la foto, las prendas en orden y devuelve la imagen', async () => {
  const pedidos = simularGemini(() => ({ json: respuestaConImagen }));
  const prendas = ['fabrica-remera-blanca', 'fabrica-jean-azul', 'fabrica-zapatillas-blancas', 'santos-blazer-beige'];
  const r = await pedir(JSON.stringify({ foto: FOTO, prendas, proporcion: '3:4' }));
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.imagen, `data:image/png;base64,${IMAGEN_IA}`);

  assert.equal(pedidos.length, 1);
  const { url, opciones, cuerpo } = pedidos[0];
  assert.match(url, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/[^/]+:generateContent$/);
  assert.equal(opciones.headers['x-goog-api-key'], 'clave-de-prueba');
  assert.deepEqual(cuerpo.generationConfig.imageConfig, { aspectRatio: '3:4' });
  assert.ok(cuerpo.generationConfig.responseModalities.includes('IMAGE'));

  const partes = cuerpo.contents[0].parts;
  const imagenes = partes.filter(p => p.inlineData);
  assert.equal(imagenes.length, 1 + prendas.length);
  assert.equal(imagenes[0].inlineData.data, Buffer.from('foto-de-prueba').toString('base64'));
  const remera = fs.readFileSync(path.join(__dirname, '..', 'probador', 'prendas', 'remera-blanca.jpg')).toString('base64');
  assert.equal(imagenes[1].inlineData.data, remera);
  assert.equal(imagenes[1].inlineData.mimeType, 'image/jpeg');
  const texto = partes.filter(p => p.text).map(p => p.text).join('\n');
  for (const [i, nombre] of ['Remera básica', 'Jean recto', 'Zapatillas urbanas', 'Blazer sastrero'].entries()) {
    assert.match(texto, new RegExp(`IMAGE ${i + 2} — catalog product "${nombre}"`));
  }
});

test('ignora una proporción desconocida', async () => {
  const pedidos = simularGemini(() => ({ json: respuestaConImagen }));
  await pedir({ foto: FOTO, prendas: ['fabrica-remera-blanca'], proporcion: '7:3' });
  assert.equal(pedidos[0].cuerpo.generationConfig.imageConfig, undefined);
});

test('si un modelo no existe prueba el siguiente y después lo recuerda', async () => {
  process.env.GEMINI_MODEL = 'modelo-que-no-existe';
  const pedidos = simularGemini(url => url.includes('modelo-que-no-existe')
    ? { status: 404, json: { error: { message: 'not found' } } }
    : { json: respuestaConImagen });
  const r = await pedir({ foto: FOTO, prendas: ['fabrica-remera-blanca'] });
  assert.equal(r.status, 200);
  assert.equal(pedidos.length, 2);
  assert.ok(r.json.modelo && r.json.modelo !== 'modelo-que-no-existe');
  await pedir({ foto: FOTO, prendas: ['fabrica-remera-blanca'] });
  assert.equal(pedidos.length, 3, 'la segunda vez va directo al modelo que anduvo');
});

test('si la IA bloquea la foto devuelve un mensaje claro', async () => {
  simularGemini(() => ({ json: { candidates: [{ finishReason: 'IMAGE_SAFETY', content: { parts: [] } }] } }));
  const r = await pedir({ foto: FOTO, prendas: ['fabrica-remera-blanca'] });
  assert.equal(r.status, 422);
  assert.match(r.json.error, /no pudo procesar esta foto/);
});

test('traduce los errores de la API', async () => {
  simularGemini(() => ({ status: 429, json: { error: { message: 'quota' } } }));
  assert.equal((await pedir({ foto: FOTO, prendas: ['fabrica-remera-blanca'] })).status, 429);
  simularGemini(() => ({ status: 400, json: { error: { message: 'API key not valid. Please pass a valid API key.' } } }));
  const clave = await pedir({ foto: FOTO, prendas: ['fabrica-remera-blanca'] });
  assert.equal(clave.status, 500);
  assert.match(clave.json.error, /clave/);
});

test('limita la cantidad de pruebas por hora y por IP', async () => {
  process.env.PROBADOR_LIMITE_POR_HORA = '2';
  simularGemini(() => ({ json: respuestaConImagen }));
  const cuerpo = { foto: FOTO, prendas: ['fabrica-remera-blanca'] };
  assert.equal((await pedir(cuerpo, { ip: '9.9.9.9' })).status, 200);
  assert.equal((await pedir(cuerpo, { ip: '9.9.9.9' })).status, 200);
  assert.equal((await pedir(cuerpo, { ip: '9.9.9.9' })).status, 429);
  assert.equal((await pedir(cuerpo, { ip: '8.8.8.8' })).status, 200, 'otra IP no se ve afectada');
});
