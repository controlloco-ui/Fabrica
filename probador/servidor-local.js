#!/usr/bin/env node
'use strict';
// Servidor local para usar el probador en tu compu (sin Vercel).
// Sirve la web del repo y la función /api/probar.
//
//   GEMINI_API_KEY=tu-clave node probador/servidor-local.js
//   (o guardá la clave en un archivo .env y corré: node --env-file=.env probador/servidor-local.js)
//
// Después abrí http://localhost:3000/probador/

const http = require('http');
const fs = require('fs');
const path = require('path');
const probar = require('../api/probar.js');

const RAIZ = path.join(__dirname, '..');
const PUERTO = Number(process.env.PORT) || 3000;
const MAX_CUERPO = 12 * 1024 * 1024;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

function leerJson(req) {
  return new Promise((resolver, rechazar) => {
    const partes = [];
    let total = 0;
    req.on('data', parte => {
      total += parte.length;
      if (total > MAX_CUERPO) { rechazar(Object.assign(new Error('La foto es demasiado pesada.'), { status: 413 })); req.destroy(); return; }
      partes.push(parte);
    });
    req.on('end', () => {
      try { resolver(JSON.parse(Buffer.concat(partes).toString('utf8'))); }
      catch { rechazar(Object.assign(new Error('El pedido no es válido.'), { status: 400 })); }
    });
    req.on('error', rechazar);
  });
}

function servirArchivo(ruta, res) {
  let relativa;
  try { relativa = decodeURIComponent(ruta); } catch { res.writeHead(400); return res.end(); }
  // Nunca servir archivos ocultos (.env, .git, ...)
  if (relativa.split('/').some(s => s.startsWith('.'))) { res.writeHead(404); return res.end('No encontrado'); }
  let archivo = path.join(RAIZ, relativa);
  if (archivo !== RAIZ && !archivo.startsWith(RAIZ + path.sep)) { res.writeHead(404); return res.end('No encontrado'); }
  fs.stat(archivo, (err, info) => {
    if (!err && info.isDirectory()) {
      if (!ruta.endsWith('/')) { res.writeHead(301, { Location: ruta + '/' }); return res.end(); }
      archivo = path.join(archivo, 'index.html');
    }
    fs.readFile(archivo, (error, datos) => {
      if (error) { res.writeHead(404); return res.end('No encontrado'); }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream' });
      res.end(datos);
    });
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/probar') {
    if (req.method === 'POST') {
      try { req.body = await leerJson(req); } catch (e) {
        res.writeHead(e.status || 400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    }
    return probar(req, res);
  }
  if (url.pathname === '/') { res.writeHead(302, { Location: '/probador/' }); return res.end(); }
  servirArchivo(url.pathname, res);
}).listen(PUERTO, () => {
  console.log(`Probador virtual en http://localhost:${PUERTO}/probador/`);
  if (!process.env.GEMINI_API_KEY) console.log('Ojo: falta GEMINI_API_KEY, el botón "Probármelo" va a avisar que no está configurado.');
});
