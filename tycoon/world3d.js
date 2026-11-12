'use strict';
// =====================================================================
// Motor 3D (three.js): escena de la fábrica, cámara, personajes y capa de textos
// Mundo: x = x del juego, z = y del juego, y = altura.
// =====================================================================
let R3 = null, scene = null, camera = null, sun = null, hemi = null, cssW = 0, cssH = 0, dpr = 1;
const cam = { x: SPAWN.x, z: SPAWN.y, yaw: 0, yawT: 0, pitch: 0.7, dist: 900 };
const TILTS = { alto: 1.08, medio: 0.86, bajo: 0.66 };
const CH = 60;                         // escala del personaje (unidades del mundo por metro)
const W3 = { pads: {}, furn: new Map(), ores: [], oreMats: null, smoke: [], bags: [], labels: [] };
const _v = new THREE.Vector3(), _ray = new THREE.Raycaster(), _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let PC = null, glOK = true;

const _lam = {};
function lam(color, extra) {
  const k = color + (extra ? JSON.stringify(extra) : '');
  if (!_lam[k]) _lam[k] = new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}));
  return _lam[k];
}
function sh(m) { m.castShadow = true; m.receiveShadow = true; return m; }
// caja apoyada en el suelo (x, z = centro; y = base)
function bx(parent, w, h, d, color, x = 0, y = 0, z = 0, mat) { const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || lam(color))); m.position.set(x, y + h / 2, z); parent.add(m); return m; }
function cyl(parent, rt, rb, h, color, x = 0, y = 0, z = 0, seg = 16, mat) { const m = sh(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat || lam(color))); m.position.set(x, y + h / 2, z); parent.add(m); return m; }
function ctex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t; }
function disposeTree(g) { g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.userData && o.material.userData.own) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); if (g.parent) g.parent.remove(g); }
function ownMat(m) { m.userData.own = true; return m; }

function init3D() {
  try {
    R3 = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, powerPreference: 'high-performance' });
  } catch (e) { glOK = false; document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:30px;text-align:center;z-index:99;background:#16202a">Tu dispositivo no puede mostrar gráficos 3D (WebGL).</div>'); return; }
  if (THREE.SRGBColorSpace) R3.outputColorSpace = THREE.SRGBColorSpace;
  R3.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 10, 9000);
  hemi = new THREE.HemisphereLight(0xffffff, 0x556655, 2.2); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xfff2dd, 2.3); sun.castShadow = true; scene.add(sun); scene.add(sun.target);
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -750; sc.right = 750; sc.top = 750; sc.bottom = -750; sc.near = 100; sc.far = 3000; sun.shadow.bias = -0.0015;
  W3.env = new THREE.Group(); W3.room = new THREE.Group(); W3.fx = new THREE.Group(); W3.dyn = new THREE.Group();
  scene.add(W3.env, W3.room, W3.dyn, W3.fx);
  buildStatic();
  PC = new Char3D(); scene.add(PC.root);
  // marcador de destino, flecha guía y selección de mueble
  W3.target = new THREE.Mesh(new THREE.RingGeometry(10, 13, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); W3.target.rotation.x = -Math.PI / 2; W3.fx.add(W3.target);
  W3.guide = new THREE.Mesh(new THREE.ConeGeometry(10, 26, 4), new THREE.MeshBasicMaterial({ color: 0x7fff8a })); W3.guide.scale.set(1, 1, 0.35); W3.guideP = new THREE.Group(); W3.guideP.add(W3.guide); W3.guide.rotation.x = Math.PI / 2; W3.guide.position.z = 52; W3.fx.add(W3.guideP);
  W3.sel = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 4, 1), new THREE.MeshBasicMaterial({ color: 0x7fffa0, transparent: true, opacity: 0.9, side: THREE.DoubleSide })); W3.sel.rotation.x = -Math.PI / 2; W3.sel.rotation.z = Math.PI / 4; W3.fx.add(W3.sel);
  initPreview();
}
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, OPT.quality === 'alta' ? 2 : 1.25);
  cssW = innerWidth; cssH = innerHeight;
  cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
  if (R3) { R3.setPixelRatio(dpr); R3.setSize(cssW, cssH, false); camera.aspect = cssW / cssH; camera.updateProjectionMatrix(); }
}
addEventListener('resize', resize);

// ----- cámara -----
function camDist() {
  const a = cssW / Math.max(1, cssH), t = Math.tan(camera.fov * Math.PI / 360);
  return clamp(420 / (2 * t * a), 480, 1100) / (S ? S.zoom : 1);
}
function camSnap() { cam.x = P.x; cam.z = P.y; cam.yaw = cam.yawT = 0; }
function panBy(dx, dy) {
  const wpp = 2 * cam.dist * Math.tan(camera.fov * Math.PI / 360) / cssH, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), f = dy * wpp / Math.sin(cam.pitch);
  camOff.x += -dx * wpp * cy - f * sy; camOff.y += dx * wpp * sy - f * cy;
  camOff.x = clamp(camOff.x, -W, W); camOff.y = clamp(camOff.y, -H, H);
}
function screenToWorld(sx, sy) {
  _ray.setFromCamera({ x: sx / cssW * 2 - 1, y: -(sy / cssH * 2 - 1) }, camera);
  const p = _ray.ray.intersectPlane(_plane, _v);
  return p ? { x: p.x, y: p.z } : { x: cam.x, y: cam.z };
}
function proj(x, h, z) { _v.set(x, h, z).project(camera); return { x: (_v.x + 1) / 2 * cssW, y: (1 - _v.y) / 2 * cssH, ok: _v.z < 1 && _v.z > -1 }; }
function furnAt(sx, sy) {
  _ray.setFromCamera({ x: sx / cssW * 2 - 1, y: -(sy / cssH * 2 - 1) }, camera);
  const hits = _ray.intersectObjects([...W3.furn.values()].map(e => e.g), true);
  for (const h of hits) { let o = h.object; while (o && o.userData.furn === undefined) o = o.parent; if (o) { const i = S.furn.indexOf(o.userData.furn); if (i >= 0) return i; } }
  return -1;
}

// =====================================================================
// Escena fija: suelo, muros, cintas, hornos y máquinas
// =====================================================================
function buildFloorTex() {
  const key = [S.cur, S.style.suelo, S.style.suelo2, HQ].join('|');
  if (!bgDirty && key === bgKey) return;
  bgDirty = false; bgKey = key;
  const q = HQ ? 1 : 0.6;
  bgCanvas.width = Math.round(W * q); bgCanvas.height = Math.round((H - WALL_Y) * q);
  const c = bgCanvas.getContext('2d'); c.setTransform(q, 0, 0, q, 0, -WALL_Y * q);
  const R = seeded(7 + S.cur * 13);
  drawFloor(c, findIn(FLOORS, S.style.suelo), 0, WALL_Y, W, LOUNGE.y0 - 20, R);
  drawFloor(c, findIn(FLOORS, S.style.suelo2), 0, LOUNGE.y0 - 20, W, H, R);
  c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, LOUNGE.y0 - 23, W, 5);
  c.fillStyle = 'rgba(255,216,74,.12)'; c.fillRect(30, UTIL_Y - 60, W - 60, 120); c.fillRect(30, KIOSK_Y - 55, W - 60, 110); c.fillRect(30, MACH_Y - 70, W - 60, 200);
  c.strokeStyle = 'rgba(255,216,74,.45)'; c.setLineDash([16, 10]); c.lineWidth = 3;
  c.strokeRect(30, UTIL_Y - 60, W - 60, 120); c.strokeRect(30, KIOSK_Y - 55, W - 60, 110); c.strokeRect(30, MACH_Y - 70, W - 60, 200); c.setLineDash([]);
  if (!W3.floorTex) { W3.floorTex = new THREE.CanvasTexture(bgCanvas); if (THREE.SRGBColorSpace) W3.floorTex.colorSpace = THREE.SRGBColorSpace; W3.floorTex.anisotropy = R3.capabilities.getMaxAnisotropy(); W3.floor.material.map = W3.floorTex; W3.floor.material.needsUpdate = true; }
  else { W3.floorTex.dispose(); W3.floorTex.needsUpdate = true; }
}
const WALL3 = 210;
function buildStatic() {
  const room = W3.room;
  // suelo
  W3.floor = new THREE.Mesh(new THREE.PlaneGeometry(W, H - WALL_Y), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  W3.floor.rotation.x = -Math.PI / 2; W3.floor.position.set(W / 2, 0, (H + WALL_Y) / 2); W3.floor.receiveShadow = true; room.add(W3.floor);
  // muros (el del fondo lleva la textura con ventanas)
  W3.wallMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  W3.wallSide = new THREE.MeshLambertMaterial({ color: 0x8d96a0 });
  W3.back = sh(new THREE.Mesh(new THREE.BoxGeometry(W + 40, WALL3, 20), [W3.wallSide, W3.wallSide, W3.wallSide, W3.wallSide, W3.wallMat, W3.wallSide])); W3.back.position.set(W / 2, WALL3 / 2, WALL_Y - 10); room.add(W3.back);
  [[-10, 70], [W + 10, 70]].forEach(([x, hh]) => { const m = sh(new THREE.Mesh(new THREE.BoxGeometry(20, hh, H - WALL_Y), W3.wallSide)); m.position.set(x, hh / 2, (H + WALL_Y) / 2); room.add(m); });
  const fr = sh(new THREE.Mesh(new THREE.BoxGeometry(W + 40, 26, 20), W3.wallSide)); fr.position.set(W / 2, 13, H + 10); room.add(fr);
  [[-10, WALL_Y - 10], [W + 10, WALL_Y - 10]].forEach(([x, z]) => bx(room, 26, WALL3 + 10, 26, '#4a4f58', x, 0, z));
  // cintas
  W3.belts = [];
  for (let l = 0; l < 3; l++) {
    const g = new THREE.Group(); g.position.set(0, 0, LANE_Y[l]); room.add(g);
    const len = CONV_X1 + 30 - CONV_X0, cx = (CONV_X0 + CONV_X1 + 30) / 2;
    const body = bx(g, len, 10, 46, '#555d68', cx, 6, 0);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(len, 40), new THREE.MeshLambertMaterial({ color: 0xffffff })); top.rotation.x = -Math.PI / 2; top.position.set(cx, 16.3, 0); top.receiveShadow = true; g.add(top);
    const r1 = bx(g, len, 5, 4, '#555d68', cx, 15, -22), r2 = bx(g, len, 5, 4, '#555d68', cx, 15, 22);
    for (let x = CONV_X0 + 30; x < CONV_X1; x += 130) { bx(g, 6, 8, 6, '#3a3f48', x, 0, -18); bx(g, 6, 8, 6, '#3a3f48', x, 0, 18); }
    const roll = cyl(g, 9, 9, 44, '#3a3f48', CONV_X0, 7, 0, 12); roll.rotation.x = Math.PI / 2; roll.position.y = 9;
    W3.belts.push({ g, top, rails: [body, r1, r2] });
  }
  // dispensadores
  W3.drop = {};
  ITEMS[0].forEach(it => {
    if (it.type !== 'dropper') return;
    const g = new THREE.Group(); g.position.set(it.x, 0, LANE_Y[it.lane] - 56); room.add(g);
    const [a, b] = TIER[it.k];
    [[-22, -12], [22, -12], [-22, 14], [22, 14]].forEach(([x, z]) => bx(g, 5, 34, 5, '#3a3f48', x, 0, z));
    bx(g, 56, 44, 38, a, 0, 32, 0);
    const hop = cyl(g, 30, 20, 16, b, 0, 76, 0, 4); hop.rotation.y = Math.PI / 4; hop.scale.z = 0.72;
    bx(g, 16, 10, 34, '#2a2e35', 0, 34, 36);                         // tobogán hacia la cinta
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 8), ownMat(new THREE.MeshBasicMaterial({ color: 0xffffb0 }))); lamp.position.set(-17, 62, 19.5); g.add(lamp);
    bx(g, 30, 14, 1, '#1a1e24', 6, 54, 19.2);
    W3.drop[it.id] = { g, lamp, it };
  });
  // mejoradores
  W3.ups = {};
  for (let l = 0; l < 3; l++) UX.forEach((x, k) => {
    const g = new THREE.Group(); g.position.set(x, 0, LANE_Y[l]); room.add(g); const e = { g, k };
    const col = UP_KIND[k].col;
    if (k === 0) {
      bx(g, 10, 70, 10, '#59616b', 0, 0, -32); bx(g, 10, 70, 10, '#59616b', 0, 0, 32); bx(g, 14, 10, 78, '#6a737d', 0, 66, 0);
      e.beam = new THREE.Mesh(new THREE.BoxGeometry(3, 50, 46), ownMat(new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }))); e.beam.position.y = 41; g.add(e.beam);
      const led = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 6), new THREE.MeshBasicMaterial({ color: col })); led.position.set(0, 60, 37.5); g.add(led);
    } else if (k === 1) {
      bx(g, 64, 40, 10, '#3f7d4a', 0, 0, -30); bx(g, 64, 40, 10, '#3f7d4a', 0, 0, 30); bx(g, 64, 14, 70, '#3f7d4a', 0, 40, 0);
      bx(g, 60, 22, 48, '#121418', 0, 17, 0).castShadow = false;
      e.leds = [-18, 18].map(dx => { const m = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 6), ownMat(new THREE.MeshBasicMaterial({ color: col }))); m.position.set(dx, 47, 35.5); g.add(m); return m; });
    } else {
      bx(g, 12, 86, 12, '#6a4a7a', 0, 0, -34); bx(g, 12, 86, 12, '#6a4a7a', 0, 0, 34); bx(g, 50, 14, 82, '#7a5a8a', 0, 80, 0);
      e.rod = cyl(g, 4, 4, 60, '#c0c7d0', 0, 30, 0, 8); e.head = bx(g, 40, 12, 40, '#d0d6dd', 0, 30, 0);
    }
    W3.ups[`u${l}_${k}`] = e;
  });
  // hornos
  W3.furn3 = [];
  for (let l = 0; l < 3; l++) {
    const g = new THREE.Group(); g.position.set(FURN_X, 0, LANE_Y[l] - 6); room.add(g);
    const body = bx(g, 104, 96, 80, '#6a4f45', 0, 0, 0), chim = cyl(g, 11, 13, 46, '#4a352e', 24, 96, -20, 10);
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(64, 44), ownMat(new THREE.MeshBasicMaterial({ color: 0xffaa33 }))); mouth.position.set(0, 40, 40.4); g.add(mouth);
    bx(g, 72, 6, 2, '#1c1210', 0, 62, 40); bx(g, 4, 50, 2, '#1c1210', -34, 16, 40); bx(g, 4, 50, 2, '#1c1210', 34, 16, 40);
    const inlet = bx(g, 40, 26, 30, '#140c0a', -52, 14, 6); inlet.castShadow = false;
    const glow = new THREE.Mesh(new THREE.CircleGeometry(80, 20), ownMat(new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }))); glow.rotation.x = -Math.PI / 2; glow.position.set(0, 0.6, 70); g.add(glow);
    W3.furn3.push({ g, body, chim, mouth, glow });
  }
  buildMachines();
  // estatua
  { const g = W3.statue = new THREE.Group(); g.position.set(STATUE.x, 0, STATUE.y); room.add(g);
    bx(g, 110, 26, 50, '#e8e2d8'); bx(g, 80, 14, 36, '#d9b23c', 0, 26, 0);
    const gold = new THREE.MeshPhongMaterial({ color: 0xffd84a, specular: 0xffffff, shininess: 80, emissive: 0x5a4200 });
    const cup = sh(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [16, 0], [16, 4], [5, 8], [4, 26], [12, 32], [26, 56], [28, 76], [25, 76], [22, 58], [0, 36]].map(p => new THREE.Vector2(p[0], p[1])), 20), gold)); cup.position.y = 40; g.add(cup); gold.side = THREE.DoubleSide;
    [-1, 1].forEach(s => { const t = sh(new THREE.Mesh(new THREE.TorusGeometry(12, 3, 6, 12, Math.PI), gold)); t.position.set(s * 27, 98, 0); t.rotation.z = -s * Math.PI / 2; g.add(t); });
    W3.statueGlow = new THREE.Mesh(new THREE.CircleGeometry(130, 24), new THREE.MeshBasicMaterial({ color: 0xffe070, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })); W3.statueGlow.rotation.x = -Math.PI / 2; W3.statueGlow.position.y = 0.8; g.add(W3.statueGlow); }
  // carteles de los puestos
  KIOSKS.forEach(k => { const g = new THREE.Group(); g.position.set(k.x, 0, KIOSK_Y - 48); room.add(g); cyl(g, 2.5, 2.5, 40, '#4a4f58', 0, 0, 0, 8);
    const t = ctex(256, 80, (c, w, h) => { c.fillStyle = k.col; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, 0, w, h * 0.45); text(k.icon + ' ' + k.name.toUpperCase(), w / 2, h / 2, 32, '#fff', 'center', 900, c); });
    const m = sh(new THREE.Mesh(new THREE.BoxGeometry(92, 28, 6), [lam(k.col), lam(k.col), lam(k.col), lam(k.col), new THREE.MeshLambertMaterial({ map: t }), new THREE.MeshLambertMaterial({ map: t })])); m.position.y = 50; g.add(m); });
  // bloques sobre las cintas (reserva de mallas reutilizables)
  for (let i = 0; i < 250; i++) { const m = sh(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lam('#ffffff'))); m.visible = false; W3.dyn.add(m); W3.ores.push(m); }
  for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.3, depthWrite: false })); m.visible = false; W3.fx.add(m); W3.smoke.push(m); }
  const bagTex = ctex(96, 96, (c) => { c.font = '72px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('💰', 48, 52); });
  for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bagTex, transparent: true })); s.scale.set(46, 46, 1); s.visible = false; W3.fx.add(s); W3.bags.push(s); }
}
function buildMachines() {
  W3.mach = [];
  MACH.forEach((m, i) => {
    const g = new THREE.Group(); g.position.set(MACH_X[i], 0, MACH_Y); W3.room.add(g); const e = { g };
    if (m.id === 'mina') {
      bx(g, 120, 16, 70, '#7a6a5a'); const pile = sh(new THREE.Mesh(new THREE.DodecahedronGeometry(22), lam('#8a6a4a'))); pile.position.set(-36, 22, 6); pile.scale.y = 0.6; g.add(pile); e.pile = pile;
      [[-22, -18], [34, -18], [-22, 22], [34, 22]].forEach(([x, z]) => { const p = cyl(g, 2.5, 2.5, 112, '#c99a2a', 0, 16, 0, 6); p.position.set((x + 6) / 2, 70, (z + 2) / 2); p.rotation.z = -(x - 6) / 112; p.rotation.x = (z - 2) / 112; });
      bx(g, 30, 4, 30, '#c99a2a', 6, 62, 2); e.drill = sh(new THREE.Mesh(new THREE.ConeGeometry(9, 36, 8), lam('#e0e4ea'))); e.drill.rotation.x = Math.PI; e.drill.position.set(6, 36, 2); g.add(e.drill);
      e.rod = cyl(g, 3, 3, 70, '#9aa3ad', 6, 52, 2, 6);
    } else if (m.id === 'imprenta') {
      bx(g, 120, 54, 64, '#5a7a6a'); bx(g, 84, 16, 2, '#1a2a20', 0, 20, 32.5);
      e.rolls = [-24, 24].map(dx => { const r = cyl(g, 15, 15, 10, '#c9ced6', dx, 54, -6, 14); bx(r, 26, 11, 3, '#8a929c', 0, -5.5, 0).castShadow = false; return r; });
      e.bills = [0, 1, 2].map(() => { const b = new THREE.Mesh(new THREE.BoxGeometry(18, 1, 9), lam('#7fd67f')); g.add(b); return b; });
    } else if (m.id === 'servidores') {
      e.tex = []; [-40, 0, 40].forEach((dx, n) => { const cvs = document.createElement('canvas'); cvs.width = 32; cvs.height = 96; const t = new THREE.CanvasTexture(cvs); e.tex.push({ c: cvs.getContext('2d'), t, n }); const mt = new THREE.MeshBasicMaterial({ map: t });
        const b = sh(new THREE.Mesh(new THREE.BoxGeometry(36, 100, 56), [lam('#2a3040'), lam('#2a3040'), lam('#353c50'), lam('#2a3040'), mt, lam('#2a3040')])); b.position.set(dx, 50, 0); g.add(b); });
    } else if (m.id === 'solar') {
      e.panels = [[-30, -16], [30, -16], [-30, 20], [30, 20]].map(([dx, dz]) => { cyl(g, 2, 2, 34, '#5a6068', dx, 0, dz, 6); const p = sh(new THREE.Mesh(new THREE.BoxGeometry(54, 2, 30), [lam('#444'), lam('#444'), new THREE.MeshPhongMaterial({ color: 0x1f3a8a, specular: 0xaaccff, shininess: 90 }), lam('#444'), lam('#444'), lam('#444')])); p.position.set(dx, 36, dz); p.rotation.x = 0.5; g.add(p); return p; });
    } else {
      bx(g, 30, 14, 30, '#8a6a3a', -42, 0, 12); bx(g, 30, 14, 30, '#8a6a3a', 42, 0, 12); cyl(g, 20, 22, 16, '#e0a800', 0, 0, 0, 14);
      e.a1 = new THREE.Group(); e.a1.position.y = 16; g.add(e.a1); bx(e.a1, 9, 44, 9, '#ffcc1a'); const j = new THREE.Mesh(new THREE.SphereGeometry(7, 10, 8), lam('#555')); j.position.y = 44; e.a1.add(j);
      e.a2 = new THREE.Group(); e.a2.position.y = 44; e.a1.add(e.a2); bx(e.a2, 7, 34, 7, '#ffcc1a'); e.box = bx(e.a2, 14, 12, 14, '#c4a77d', 0, 34, 0);
    }
    W3.mach.push(e);
  });
}
// texturas animadas de la cinta
function beltTexture() {
  const B = S.belt, key = [B.pat, B.c, B.r, B.glow].join('|');
  if (W3.beltKey === key) return; W3.beltKey = key;
  const belt = CLOTHC[B.c] || '#1a1a1f', rail = CLOTHC[B.r] || '#555d68', stripe = darken(belt === '#1a1a1f' ? '#3d434c' : belt, 0.25), pat = B.pat;
  if (W3.beltTex) W3.beltTex.dispose();
  W3.beltTex = ctex(128, 64, (c, w, h) => {
    c.fillStyle = belt; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) { const x = k * 32; c.fillStyle = pat === 'arcoiris' ? `hsl(${k * 90},90%,55%)` : pat === 'neon' ? (k % 2 ? '#ff3df0' : '#3dd7ff') : stripe;
      if (pat === 'rayas' || pat === 'arcoiris') c.fillRect(x, 0, pat === 'arcoiris' ? 32 : 13, h);
      else if (pat === 'chevron') { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 12, h / 2); c.lineTo(x, h); c.lineTo(x + 8, h); c.lineTo(x + 20, h / 2); c.lineTo(x + 8, 0); c.fill(); }
      else if (pat === 'puntos') { c.beginPath(); c.arc(x + 8, h * 0.3, 4, 0, 7); c.arc(x + 24, h * 0.7, 4, 0, 7); c.fill(); }
      else if (pat === 'rejilla') { c.fillRect(x, 0, 2, h); for (let y = 0; y < h; y += 10) c.fillRect(x, y, 32, 2); }
      else if (pat === 'flechas') { c.beginPath(); c.moveTo(x + 4, h * 0.2); c.lineTo(x + 22, h / 2); c.lineTo(x + 4, h * 0.8); c.fill(); }
      else if (pat === 'neon') c.fillRect(x + 4, h / 2 - 3, 22, 6); }
  });
  W3.beltTex.wrapS = THREE.RepeatWrapping; W3.beltTex.repeat.set(6, 1);
  W3.belts.forEach(b => { b.top.material.map = W3.beltTex; b.top.material.needsUpdate = true; b.rails.forEach(r => { r.material = lam(rail, B.glow ? { emissive: darken(rail, -0.5) } : undefined); }); });
}
// entorno exterior según la fábrica
function buildEnv() {
  const key = S.cur + '|' + HQ; if (W3.envKey === key) return; W3.envKey = key;
  while (W3.env.children.length) disposeTree(W3.env.children[0]);
  const fac = FACS[S.cur], env = W3.env, R = seeded(11 + S.cur * 7);
  scene.background = new THREE.Color(fac.sky[1]); scene.fog = new THREE.Fog(fac.sky[1], 1900, 5200);
  hemi.color.set(S.cur >= 3 ? 0xb0b8ff : 0xffffff); hemi.groundColor.set(fac.grass[0]); hemi.intensity = S.cur >= 3 ? 1.9 : 2.2; sun.intensity = S.cur >= 3 ? 1.6 : 2.3;
  const gt = ctex(256, 256, (c, w, h) => { c.fillStyle = fac.grass[0]; c.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { c.fillStyle = R() < 0.5 ? fac.grass[1] : darken(fac.grass[0], -0.12); c.beginPath(); c.ellipse(R() * w, R() * h, 3 + R() * 9, 2 + R() * 5, R() * 3, 0, 7); c.fill(); } });
  gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(24, 24);
  const gm = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), ownMat(new THREE.MeshLambertMaterial({ map: gt }))); gm.rotation.x = -Math.PI / 2; gm.position.set(W / 2, -1.5, H / 2); gm.receiveShadow = true; env.add(gm);
  const n = HQ ? 90 : 40;
  for (let i = 0; i < n; i++) {
    let x = -900 + R() * (W + 1800), z = -700 + R() * (H + 1500);
    if (x > -70 && x < W + 70 && z > WALL_Y - 80 && z < H + 70) { x = x < W / 2 ? -100 - R() * 700 : W + 100 + R() * 700; }
    const s = 0.7 + R() * 0.9, g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); env.add(g);
    if (fac.deco === 'tree') { cyl(g, 7, 9, 50, '#6a4a2a', 0, 0, 0, 7); const a = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(42, 0), lam(R() < 0.5 ? '#2d6b2a' : '#3c8a36'))); a.position.y = 78; g.add(a); const b2 = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(28, 0), lam('#3c8a36'))); b2.position.set(14, 108, 6); g.add(b2); }
    else if (fac.deco === 'crystal') { const m = sh(new THREE.Mesh(new THREE.OctahedronGeometry(30, 0), new THREE.MeshPhongMaterial({ color: R() < 0.5 ? 0x7fe0ff : 0xb48cff, emissive: 0x224466, shininess: 100, transparent: true, opacity: 0.88 }))); m.scale.set(0.6, 2 + R(), 0.6); m.position.y = 40; m.rotation.z = (R() - 0.5) * 0.5; g.add(m); }
    else if (fac.deco === 'rock') { const m = sh(new THREE.Mesh(new THREE.DodecahedronGeometry(40, 0), lam('#2a1714', { emissive: R() < 0.4 ? '#5a1500' : '#000000' }))); m.scale.y = 0.6 + R() * 0.8; m.position.y = 16; g.add(m); }
    else if (fac.deco === 'glow') { const m = new THREE.Mesh(new THREE.SphereGeometry(16, 10, 8), new THREE.MeshBasicMaterial({ color: R() < 0.5 ? 0x3cff8c : 0xff3cf0 })); m.position.y = 20 + R() * 120; g.add(m); cyl(g, 1.5, 1.5, m.position.y, '#333', 0, 0, 0, 5); }
    else { const m = new THREE.Mesh(new THREE.SphereGeometry(5 + R() * 6, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); m.position.y = 150 + R() * 700; g.add(m); if (R() < 0.3) { const p = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(40, 0), lam('#5a5a8a'))); p.position.y = 12; p.scale.y = 0.5; g.add(p); } }
  }
}
function syncStyle() {
  buildEnv(); buildFloorTex(); beltTexture();
  const wk = [S.cur, S.style.pared, HQ].join('|');
  if (W3.wallK !== wk) { W3.wallK = wk; wallDirty = true; buildWall(); if (W3.wallTex) W3.wallTex.dispose(); W3.wallTex = new THREE.CanvasTexture(wallCanvas); if (THREE.SRGBColorSpace) W3.wallTex.colorSpace = THREE.SRGBColorSpace; W3.wallMat.map = W3.wallTex; W3.wallMat.needsUpdate = true; W3.wallSide.color.set(darken(findIn(WALLS, S.style.pared).c, -0.12)); }
  const hk = S.style.horno; if (W3.hornoK !== hk) { W3.hornoK = hk; const hi = findIn(FURNACES, hk); W3.furn3.forEach(f => { f.body.material = lam(hi.top); f.chim.material = lam(hi.side); const [r, g, b] = hi.glow.split(',').map(Number); f.col = new THREE.Color(r / 255, g / 255, b / 255); f.glow.material.color.copy(f.col); }); }
  const ok = S.cur; if (W3.oreK !== ok) { W3.oreK = ok; const fac = FACS[S.cur]; const geo = { cube: new THREE.BoxGeometry(2, 1.7, 2), gem: new THREE.OctahedronGeometry(1.3, 0), rock: new THREE.DodecahedronGeometry(1.2, 0), orb: new THREE.SphereGeometry(1.2, 12, 10), star: new THREE.IcosahedronGeometry(1.25, 0) }[fac.shape];
    W3.oreMats = fac.ores.map(c => [0, 1, 2, 3].map(l => new THREE.MeshPhongMaterial({ color: c, shininess: fac.shape === 'cube' ? 20 : 90, emissive: l === 0 ? (fac.shape === 'orb' ? c : '#000000') : l === 1 ? '#0a5a66' : l === 2 ? '#66105a' : '#6a5a00', emissiveIntensity: l ? 0.9 : 0.5 })));
    W3.ores.forEach(m => { m.geometry = geo; }); }
}

// ----- muebles -----
function buildFurn(f) {
  const D = FURN[f.t], C = furnColors(f), g = new THREE.Group(); g.userData.furn = f;
  D.parts.forEach(p => {
    const col = C[p.c] && C[p.c][0] === '#' ? C[p.c] : (p.c === 'glass' ? '#a0d8ff' : C.main), e = p.e || 0;
    if (p.k === 'rug') { const t = ctex(260, 172, (c, w, h) => { c.fillStyle = col; rr(c, 0, 0, w, h, 14); c.fill(); c.strokeStyle = C.light; c.lineWidth = 10; rr(c, 16, 16, w - 32, h - 32, 8); c.stroke(); c.fillStyle = C.light; c.beginPath(); c.ellipse(w / 2, h / 2, w * 0.18, h * 0.18, 0, 0, 7); c.fill(); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.d), ownMat(new THREE.MeshLambertMaterial({ map: t, transparent: true }))); m.rotation.x = -Math.PI / 2; m.position.set(p.dx, 0.7, p.dy); m.receiveShadow = true; g.add(m); return; }
    if (p.k === 'leaves') { for (let k = 0; k < 7; k++) { const a = k * 0.9; const m = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(11, 0), lam(k % 2 ? '#3f9a44' : '#2d7a34'))); m.position.set(p.dx + Math.cos(a) * 11, e + 14 + (k % 3) * 9, p.dy + Math.sin(a) * 11); m.scale.y = 1.3; g.add(m); } return; }
    if (p.k === 'palm') { for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; const m = sh(new THREE.Mesh(new THREE.SphereGeometry(9, 8, 6), lam(k % 2 ? '#3f9a44' : '#2d7a34'))); m.scale.set(3.4, 0.25, 1); m.position.set(p.dx + Math.cos(a) * 26, e - 6, p.dy + Math.sin(a) * 26); m.rotation.y = -a; m.rotation.z = -0.45; g.add(m); } return; }
    if (p.k === 'shade') { const m = sh(new THREE.Mesh(new THREE.CylinderGeometry(p.w * 0.3, p.w * 0.5, p.h, 14, 1, true), ownMat(new THREE.MeshBasicMaterial({ color: mixHex(col, '#ffffff', 0.45), side: THREE.DoubleSide })))); m.position.set(p.dx, e + p.h / 2, p.dy); g.add(m);
      const gl = new THREE.Mesh(new THREE.CircleGeometry(70, 20), ownMat(new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }))); gl.rotation.x = -Math.PI / 2; gl.position.set(p.dx, 1, p.dy); g.add(gl); return; }
    if (p.k === 'cyl') { cyl(g, p.w / 2, p.w / 2, p.h, col, p.dx, e, p.dy, 18);
      if (p.f === 'water') { const w = new THREE.Mesh(new THREE.CircleGeometry(p.w * 0.43, 20), new THREE.MeshPhongMaterial({ color: 0x4aa8e8, shininess: 100, transparent: true, opacity: 0.85 })); w.rotation.x = -Math.PI / 2; w.position.set(p.dx, e + p.h + 0.5, p.dy); g.add(w); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const j = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 6), new THREE.MeshBasicMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.8 })); j.scale.set(1, 6, 1); j.position.set(p.dx + Math.cos(a) * 14, e + p.h + 22, p.dy + Math.sin(a) * 14); j.rotation.z = -Math.cos(a) * 0.5; j.rotation.x = Math.sin(a) * 0.5; g.add(j); } }
      return; }
    const glass = p.c === 'glass';
    const m = bx(g, p.w, p.h, p.d, col, p.dx, e, p.dy, glass ? ownMat(new THREE.MeshPhongMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.45, shininess: 100 })) : undefined);
    if (p.f) {
      const top = p.f === 'pool', pw = p.w, ph = top ? p.d : p.h, q = 3;
      const tex = furnFace(p.f, pw, ph, q, col, glass);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), ownMat(new THREE.MeshLambertMaterial({ map: tex, transparent: glass })));
      if (top) { pl.rotation.x = -Math.PI / 2; pl.position.set(p.dx, e + p.h + 0.4, p.dy); } else pl.position.set(p.dx, e + p.h / 2, p.dy + p.d / 2 + 0.4);
      if (p.f === 'screen' || p.f === 'arcade' || p.f === 'juke' || p.f === 'fish' || p.f === 'vend') pl.material = ownMat(new THREE.MeshBasicMaterial({ map: tex, transparent: glass }));
      g.add(pl);
    }
  });
  return g;
}
// caras decoradas (pantallas, libros, teclas…): se pintan con el dibujo 2D y algunas se animan
const _faces = {};
function furnFace(kind, w, h, q, col, glass) {
  const k = [kind, w, h, col].join('|');
  if (_faces[k]) return _faces[k].t;
  const c = document.createElement('canvas'); c.width = w * q; c.height = h * q;
  const e = _faces[k] = { c, x: c.getContext('2d'), t: new THREE.CanvasTexture(c), kind, w, h, q, col, glass, anim: ['screen', 'arcade', 'juke', 'fish'].includes(kind) };
  if (THREE.SRGBColorSpace) e.t.colorSpace = THREE.SRGBColorSpace;
  paintFace(e); return e.t;
}
function paintFace(e) {
  const x = e.x, old = ctx;
  x.setTransform(e.q, 0, 0, e.q, 0, 0); x.clearRect(0, 0, e.w, e.h);
  if (!e.glass) { x.fillStyle = e.kind === 'screen' ? '#16181c' : e.col; x.fillRect(0, 0, e.w, e.h); }
  ctx = x;
  try { faceDeco(e.kind, e.kind === 'pool' ? { X: 0, top: 0, front: e.h, bottom: e.h } : { X: 0, top: 0, front: 0, bottom: e.h }, { w: e.w }, e.w / 2); } finally { ctx = old; }
  e.t.needsUpdate = true;
}
let faceT = 0;
function syncFurn(dt) {
  const seen = new Set();
  S.furn.forEach((f, i) => {
    let e = W3.furn.get(f); const key = f.t + '|' + f.c;
    if (!e || e.key !== key) { if (e) disposeTree(e.g); e = { g: buildFurn(f), key }; W3.furn.set(f, e); W3.dyn.add(e.g); }
    e.g.position.set(f.x, decor.on && decor.sel === i && decor.drag ? 8 : 0, f.y); e.g.rotation.y = -f.r * Math.PI / 2; seen.add(f);
  });
  W3.furn.forEach((e, f) => { if (!seen.has(f)) { disposeTree(e.g); W3.furn.delete(f); } });
  faceT -= dt; if (faceT <= 0) { faceT = 0.16; for (const k in _faces) if (_faces[k].anim) paintFace(_faces[k]); }
  const f = decor.on && decor.sel >= 0 ? S.furn[decor.sel] : null;
  W3.sel.visible = !!f;
  if (f) { const D = FURN[f.t], rw = f.r % 2 ? D.d : D.w, rd = f.r % 2 ? D.w : D.d; W3.sel.position.set(f.x, 1.2, f.y); W3.sel.scale.set((rw / 2 + 10) * 1.414, (rd / 2 + 10) * 1.414, 1); W3.sel.material.opacity = 0.6 + 0.4 * Math.sin(T * 6); }
}

// ----- pads (botones del suelo) -----
const _icons = {};
function iconTex(ch) { if (!_icons[ch]) _icons[ch] = ctex(96, 96, c => { c.font = '64px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 48, 52); }); return _icons[ch]; }
function padList() {
  const L = [];
  const add = (key, x, z, size, color, icon, label, sub, subColor, name, glow) => L.push({ key, x, z, size, color, icon, label, sub, subColor, name, glow, pressed: !!inside[key] });
  visibleItems().forEach(it => { const pr = priceOf(it), can = S.cash >= pr, near = Math.hypot(P.x - it.px, P.y - it.py) < 150;
    add(it.id, it.px, it.py, it.type === 'statue' ? 74 : PAD, can ? '#2fbf4a' : '#c84040', it.icon, null, fmt(pr), can ? '#ffd84a' : '#ffaaaa', (near || it.type === 'statue' || it.type === 'conv') ? it.name : null, can); });
  visibleMach().forEach(m => { const i = MACH.indexOf(m), pr = machPrice(m), can = S.cash >= pr, l = mlv(m.id);
    add('m_' + m.id, MACH_X[i], MACH_PAD_Y, PAD, can ? '#2fbf4a' : '#c84040', m.icon, l ? `Nv ${l} → ${l + 1}` : m.name, fmt(pr), can ? '#ffd84a' : '#ffaaaa', null, can); });
  const fs = F(), autoL = perk('auto');
  add('collect', COLLECT.x, COLLECT.y, COLLECT.size, autoL >= 3 ? '#4c6ef5' : '#e6a700', autoL >= 3 ? '🤖' : '💰', 'COBRAR', autoL >= 3 ? 'Automático' : fmt(fs.bank), '#ffe680', null, fs.bank >= 1 && autoL < 3);
  if (own('d0_3')) { const ready = casino.cd <= 0 && casino.spin <= 0; add('casino', CASINO.x, CASINO.y, CASINO.size, ready ? '#9b3cf0' : '#5a4a6e', casino.spin > 0 ? ['🍒', '💎', '⭐', '🔔'][Math.floor(T * 12) % 4] : '🎰', 'Ruleta', ready ? '20%' : casino.spin > 0 ? '...' : Math.ceil(casino.cd) + 's', '#e6c8ff'); }
  const cr = Date.now() >= S.chestAt; add('chest', CHEST.x, CHEST.y, CHEST.size, cr ? '#d98a1a' : '#6a5a4a', cr ? '🎁' : '🔒', 'Cofre', cr ? '¡GRATIS!' : mmss(S.chestAt - Date.now()), cr ? '#7fff8a' : '#ddd', null, cr);
  if (own('statue') && S.cur + 1 < FACS.length && !(S.fac[S.cur + 1] && S.fac[S.cur + 1].bought)) { const nf = S.cur + 1, can = S.cash >= FAC_PRICE(nf); add('nextfac', NEXTFAC.x, NEXTFAC.y, NEXTFAC.size, can ? '#5a3cf0' : '#4a3a6e', '🌀', FACS[nf].name.split(' ')[0] + '…', fmt(FAC_PRICE(nf)), can ? '#ffd84a' : '#ffaaaa', null, can); }
  if (own('statue')) add('rebirth', REBIRTH.x, REBIRTH.y, REBIRTH.size, '#d63cf0', '✨', 'RENACER', '+' + statues() + ' ✨', '#ffb3ff');
  KIOSKS.forEach(k => add('k_' + k.id, k.x, KIOSK_Y, PAD, k.col, k.icon, null, null, null));
  return L;
}
function syncPads() {
  const L = padList(), seen = {};
  L.forEach(p => {
    let e = W3.pads[p.key];
    if (!e) { const g = new THREE.Group(); const base = sh(new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), ownMat(new THREE.MeshLambertMaterial({ color: p.color })))); base.position.y = 4; g.add(base);
      const ic = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), ownMat(new THREE.MeshBasicMaterial({ map: iconTex(p.icon), transparent: true, depthWrite: false }))); ic.rotation.x = -Math.PI / 2; ic.position.y = 8.4; g.add(ic);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.35), ownMat(new THREE.MeshBasicMaterial({ color: 0x78ff8c, transparent: true, opacity: 0.3, depthWrite: false }))); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.5; g.add(glow);
      W3.room.add(g); e = W3.pads[p.key] = { g, base, ic, glow }; }
    seen[p.key] = 1; e.g.visible = true; e.g.position.set(p.x, 0, p.z); e.g.scale.set(p.size, p.pressed ? 0.35 : 1, p.size);
    e.base.material.color.set(p.color); const t = iconTex(p.icon); if (e.ic.material.map !== t) { e.ic.material.map = t; e.ic.material.needsUpdate = true; }
    e.glow.visible = !!p.glow; e.glow.material.opacity = 0.2 + 0.18 * Math.sin(T * 5); e.ic.rotation.z = -cam.yaw;
  });
  for (const k in W3.pads) if (!seen[k]) W3.pads[k].g.visible = false;
  W3.labels = L;
}

// =====================================================================
// Dibujo por fotograma
// =====================================================================
function syncWorld(dt) {
  syncStyle();
  const fs = F();
  for (let l = 0; l < 3; l++) { const have = l === 0 || !!fs.owned['conv' + l]; W3.belts[l].g.visible = have; const f = W3.furn3[l]; f.g.visible = have; const fl = 0.7 + 0.3 * Math.sin(T * 10 + l); if (f.col) { f.mouth.material.color.copy(f.col).multiplyScalar(0.7 + fl * 0.6); f.glow.material.opacity = 0.14 + fl * 0.12; } }
  if (W3.beltTex) W3.beltTex.offset.x = -(T * 80 * rateMult() / ((CONV_X1 + 30 - CONV_X0) / 6)) % 1;
  for (const id in W3.drop) { const d = W3.drop[id], on = !!fs.owned[id]; d.g.visible = on; if (on) { const pulse = Math.max(0, 1 - (dropTimers[id] || 0) / LANE_INT[d.it.lane] * 4); d.lamp.material.color.setRGB(1, 1, 0.3 + pulse * 0.7); d.lamp.scale.setScalar(0.8 + pulse * 0.6); } }
  for (const id in W3.ups) { const u = W3.ups[id], on = !!fs.owned[id]; u.g.visible = on; if (!on) continue;
    if (u.k === 0) u.beam.material.opacity = 0.3 + 0.3 * Math.sin(T * 14);
    else if (u.k === 1) u.leds.forEach((m, i) => m.scale.setScalar(0.7 + 0.5 * Math.abs(Math.sin(T * 5 + i))));
    else { const hit = Math.pow(Math.max(0, Math.sin(T * 4)), 6), y = 22 + (1 - hit) * 40; u.head.position.y = y + 6; u.rod.scale.y = Math.max(0.05, (80 - y - 12) / 60); u.rod.position.y = (80 + y + 12) / 2; } }
  // bloques
  const mats = W3.oreMats, spin = FACS[S.cur].shape === 'star' || FACS[S.cur].shape === 'gem';
  for (let i = 0; i < W3.ores.length; i++) {
    const m = W3.ores[i], o = ores[i]; if (!o) { m.visible = false; continue; }
    const s = 6 + o.k * 1.3 + Math.min(o.lvl, 3) * 1.4 + Math.min(o.w - 1, 4), fall = o.t < 0.3 ? 1 - o.t / 0.3 : 0;
    m.visible = true; m.material = mats[o.lane][Math.min(3, o.lvl)]; m.scale.setScalar(s);
    m.position.set(o.x, 17 + s * 0.9 + fall * 30, LANE_Y[o.lane] + fall * -20); if (spin) m.rotation.y = T * 2 + i;
  }
  // máquinas independientes
  MACH.forEach((mm, i) => { const e = W3.mach[i], l = mlv(mm.id); e.g.visible = l > 0; if (!l) return; const a = T * (1 + l * 0.15);
    if (mm.id === 'mina') { e.drill.rotation.y = a * 9; e.drill.position.y = 36 + Math.sin(a * 3) * 5; e.pile.material = lam(FACS[S.cur].ores[0]); if (Math.random() < 0.25) parts.push({ x: MACH_X[i] + 6 + rnd(-8, 8), z: MACH_Y + 2, h: 18, vx: rnd(-50, 50), vz: rnd(-50, 50), vh: rnd(80, 200), t: 0, life: 0.5, color: FACS[S.cur].ores[0] }); }
    else if (mm.id === 'imprenta') { e.rolls.forEach(r => { r.rotation.y = a * 6; }); e.bills.forEach((b, k) => { const t = (a * 0.8 + k / 3) % 1; b.position.set(40 + t * 46, 22 + Math.sin(t * Math.PI) * 40, 36 + t * 10); b.rotation.set(t * 5, t * 3, 0); }); }
    else if (mm.id === 'servidores') { if (!e.nt || T > e.nt) { e.nt = T + 0.25; e.tex.forEach(s => { s.c.fillStyle = '#1a1f2a'; s.c.fillRect(0, 0, 32, 96); for (let r = 0; r < 9; r++) for (let c2 = 0; c2 < 3; c2++) { s.c.fillStyle = Math.random() < 0.6 ? ['#3dff8a', '#3dd7ff', '#ffcf3a'][c2] : '#222'; s.c.fillRect(5 + c2 * 8, 6 + r * 10, 5, 4); } s.t.needsUpdate = true; }); } }
    else if (mm.id === 'solar') e.panels.forEach((p, k) => { p.rotation.x = 0.5 + Math.sin(T * 0.5 + k) * 0.12; });
    else { e.a1.rotation.z = Math.sin(a * 1.2) * 0.8; e.a1.rotation.y = Math.sin(a * 0.6) * 0.6; e.a2.rotation.z = -1.1 + Math.sin(a * 1.2 + 1) * 0.6; }
  });
  W3.statue.visible = !!fs.owned.statue; if (W3.statue.visible) W3.statueGlow.material.opacity = 0.22 + 0.1 * Math.sin(T * 3);
  syncPads(); syncFurn(dt);
  W3.smoke.forEach((m, i) => { const s = smoke[i]; m.visible = !!s; if (s) { m.position.set(s.x, s.h, s.z); m.scale.setScalar(s.s + s.t * 9); m.material.opacity = 0.3 * (1 - s.t / s.life); } });
  W3.bags.forEach((m, i) => { const b = bags[i]; m.visible = !!b && !(b.t > 22 && Math.floor(b.t * 6) % 2); if (b) m.position.set(b.x, 26 + Math.sin(b.t * 5) * 5, b.y); });
  // personajes
  const inPlay = mode === 'play';
  PC.root.visible = inPlay;
  if (inPlay) {
    PC.setLook(S.look);
    let da = (P.ang || 0) - PC.root.rotation.y; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    PC.root.rotation.y += da * Math.min(1, dt * 14);
    PC.root.position.set(P.x, 0, P.y); PC.root.scale.setScalar(CH * PC.scaleH);
    PC.update(dt, { moving: P.moving, run: P.sprint || P.dash > 0, phase: P.phase, jig: P.jig });
  }
  workers.forEach(w => {
    if (!w.c3) { w.c3 = new Char3D(); scene.add(w.c3.root); w.c3.root.rotation.y = w.ang || 0; }
    w.c3.setLook(w.look); let da = (w.ang || 0) - w.c3.root.rotation.y; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    w.c3.root.rotation.y += da * Math.min(1, dt * 10); w.c3.root.position.set(w.x, 0, w.y); w.c3.root.scale.setScalar(CH * 0.92 * w.c3.scaleH); w.c3.used = T;
    w.c3.update(dt, { moving: w.moving, phase: w.phase, jig: w.jig });
  });
  if (!W3.wk) W3.wk = new Set(); workers.forEach(w => W3.wk.add(w.c3));
  W3.wk.forEach(c => { if (c.used !== T) { c.dispose(); scene.remove(c.root); W3.wk.delete(c); } });
  // marcadores
  W3.target.visible = inPlay && !!P.target; if (P.target) { W3.target.position.set(P.target.x, 1.4, P.target.y); W3.target.scale.setScalar(1 + Math.sin(T * 8) * 0.12); }
  let best = null, bd = 1e9;
  if (inPlay && !decor.on) {
    visibleItems().forEach(it => { if (S.cash >= priceOf(it)) { const d = Math.hypot(it.px - P.x, it.py - P.y); if (d < bd) { bd = d; best = [it.px, it.py]; } } });
    visibleMach().forEach(m => { if (S.cash >= machPrice(m)) { const i = MACH.indexOf(m), d = Math.hypot(MACH_X[i] - P.x, MACH_PAD_Y - P.y); if (d < bd) { bd = d; best = [MACH_X[i], MACH_PAD_Y]; } } });
    if (!best && perk('auto') < 3 && fs.bank > 0 && visibleItems().some(it => S.cash + fs.bank >= priceOf(it))) { best = [COLLECT.x, COLLECT.y]; bd = Math.hypot(COLLECT.x - P.x, COLLECT.y - P.y); }
  }
  W3.guideP.visible = !!best && bd > 90;
  if (W3.guideP.visible) { W3.guideP.position.set(P.x, 3, P.y); W3.guideP.rotation.y = Math.atan2(best[0] - P.x, best[1] - P.y); W3.guide.position.z = 50 + Math.sin(T * 6) * 5; }
}
function updateCamera(dt) {
  cam.pitch += ((TILTS[OPT.tilt] || 0.66) - cam.pitch) * 0.1;
  cam.yaw += (cam.yawT - cam.yaw) * Math.min(1, dt * 8);
  cam.dist += (camDist() - cam.dist) * 0.15;
  let tx, tz;
  if (mode === 'title') { cam.yawT = cam.yaw = T * 0.12; tx = 500; tz = 900 + Math.sin(T * 0.1) * 300; cam.dist = 1500; }
  else {
    if (OPT.cam === 'seguir' && T - lastPan > 2.5 && !pinch && !decor.on) { camOff.x *= 0.95; camOff.y *= 0.95; }
    tx = clamp(P.x + P.vx * 0.15 + camOff.x, 0, W); tz = clamp(P.y + P.vy * 0.15 + camOff.y, WALL_Y, H + 60);
  }
  cam.x += (tx - cam.x) * 0.14; cam.z += (tz - cam.z) * 0.14;
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  camera.position.set(cam.x + Math.sin(cam.yaw) * cam.dist * cp, cam.dist * sp + 40, cam.z + Math.cos(cam.yaw) * cam.dist * cp);
  camera.lookAt(cam.x, 44, cam.z);
  sun.target.position.set(cam.x, 0, cam.z); sun.position.set(cam.x - 420, 1100, cam.z + 520);
  // el muro del fondo se aparta si la cámara se pone detrás
  W3.back.visible = camera.position.z > WALL_Y + 40;
}
function drawOverlay() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cssW, cssH);
  if (mode === 'play') {
    const far = cam.dist * 1.25;
    const lab = (t, x, h, z, size, col, dy = 0) => { const p = proj(x, h, z); if (p.ok && p.x > -80 && p.x < cssW + 80 && p.y > -40 && p.y < cssH + 40) text(t, p.x, p.y + dy, size, col); };
    W3.labels.forEach(p => {
      if (Math.hypot(p.x - cam.x, p.z - cam.z) > far) return;
      const q = proj(p.x, 0, p.z); if (!q.ok) return;
      const k = clamp(820 / Math.max(1, camera.position.distanceTo(_v.set(p.x, 0, p.z))), 0.6, 1.2), off = p.size * 0.5 * k + 6;
      if (p.label) text(p.label, q.x, q.y + off + 4, 12 * k, '#fff');
      if (p.sub) text(p.sub, q.x, q.y + off + (p.label ? 19 * k : 6), 14 * k, p.subColor || '#ffd84a');
      if (p.name) text(p.name, q.x, q.y - off - 6, 12 * k, '#fff');
    });
    const fs = F();
    if (fs.bank >= 1 && perk('auto') < 3) lab('⬇', COLLECT.x, 60 + Math.sin(T * 6) * 6, COLLECT.y, 22, '#ffd84a');
    MACH.forEach((m, i) => { const l = mlv(m.id); if (l > 0) lab(`${m.icon} Nv ${l}`, MACH_X[i], 130, MACH_Y, 12, '#fff'); });
    for (const id in W3.drop) { const d = W3.drop[id]; if (fs.owned[id] && Math.hypot(d.it.x - P.x, LANE_Y[d.it.lane] - P.y) < 260) lab(fmt(d.it.val), d.it.x, 110, LANE_Y[d.it.lane] - 56, 11, '#fff'); }
    if (OPT.names) lab(`${S.name} · Nv ${S.level}`, P.x, CH * PC.scaleH * 1.84 + 8, P.y, 12, '#fff');
    parts.forEach(p => { const q = proj(p.x, p.h, p.z); if (!q.ok) return; ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.color; ctx.fillRect(q.x - 2.5, q.y - 2.5, 5, 5); });
    ctx.globalAlpha = 1;
    floats.forEach(f => { const q = proj(f.x, f.h, f.z); if (!q.ok) return; ctx.globalAlpha = Math.max(0, Math.min(1, (f.life - f.t) * 2)); text(f.text, q.x, q.y, f.size, f.color); });
    ctx.globalAlpha = 1;
  }
  if (HQ) { const g = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.45, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, golden > 0 ? `rgba(255,190,0,${0.3 + 0.1 * Math.sin(T * 4)})` : 'rgba(0,0,0,.22)'); ctx.fillStyle = g; ctx.fillRect(0, 0, cssW, cssH); }
  if (mode === 'play' && !panel && !decor.on) drawJoystick();
}
let lastDt = 0.016, lastDraw = 0, qKey = '';
function draw() {
  if (!glOK) return;
  const now = performance.now(); lastDt = Math.min(0.1, (now - lastDraw) / 1000 || 0.016); lastDraw = now;
  HQ = OPT.quality === 'alta';
  if (qKey !== OPT.quality) { qKey = OPT.quality; R3.shadowMap.enabled = HQ; sun.castShadow = HQ; resize(); scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); }); }
  syncWorld(lastDt);
  updateCamera(lastDt);
  R3.render(scene, camera);
  drawOverlay();
}

// =====================================================================
// Vista previa del vestidor y miniaturas de muebles (segundo render)
// =====================================================================
const prevState = { ang: 0.4, angT: 0.4, moving: false, phase: 0, jig: newJig(), drag: null, zoom: 1 };
let PV = null;
function initPreview() {
  const c = document.createElement('canvas'); c.id = 'prev';
  const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true }); if (THREE.SRGBColorSpace) r.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene(), cm = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  sc.add(new THREE.HemisphereLight(0xffffff, 0xb8a8c8, 2.4)); const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(-2, 4, 5); sc.add(d);
  const ch = new Char3D(); sc.add(ch.root);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 })); disc.rotation.x = -Math.PI / 2; sc.add(disc);
  const ts = new THREE.Scene(); ts.add(new THREE.HemisphereLight(0xffffff, 0x777788, 2.4)); const d2 = new THREE.DirectionalLight(0xffffff, 2); d2.position.set(-200, 400, 300); ts.add(d2);
  PV = { c, r, sc, cm, ch, ts, w: 0, h: 0 };
  c.addEventListener('pointerdown', e => { prevState.drag = { x: e.clientX, a: prevState.angT, moved: false }; try { c.setPointerCapture(e.pointerId); } catch (er) { } });
  c.addEventListener('pointermove', e => { const d = prevState.drag; if (!d) return; if (Math.abs(e.clientX - d.x) > 4) d.moved = true; prevState.angT = d.a + (e.clientX - d.x) * 0.012; });
  const up = () => { const d = prevState.drag; if (d && !d.moved) { prevState.jig.bv += 25; prevState.jig.gv += 20; } prevState.drag = null; };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  c.addEventListener('wheel', e => { e.preventDefault(); prevState.zoom = clamp(prevState.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.8, 2.4); }, { passive: false });
}
function attachPreview() { const s = $('prevSlot'); if (s && PV) { s.appendChild(PV.c); PV.w = 0; } }
function drawPreview(dt) {
  if (!PV || panel !== 'char' || !PV.c.isConnected) return;
  const rc = PV.c.getBoundingClientRect(), w = Math.round(rc.width), h = Math.round(rc.height); if (!w || !h) return;
  if (w !== PV.w || h !== PV.h) { PV.w = w; PV.h = h; PV.r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); PV.r.setSize(w, h, false); PV.cm.aspect = w / h; PV.cm.updateProjectionMatrix(); }
  if (prevState.moving) prevState.phase += dt * 9;
  jigStep(prevState.jig, dt, prevState.moving, prevState.phase, 0, 0);
  prevState.ang += (prevState.angT - prevState.ang) * Math.min(1, dt * 10);
  const ch = PV.ch; ch.setLook(S.look); ch.root.rotation.y = prevState.ang; ch.root.scale.setScalar(ch.scaleH); ch.update(dt, { moving: prevState.moving, phase: prevState.phase, jig: prevState.jig });
  const z = prevState.zoom, hgt = 1.75 * ch.scaleH; PV.cm.position.set(0, hgt * (0.5 + (z - 1) * 0.22), 4.3 / z); PV.cm.lookAt(0, hgt * (0.5 + (z - 1) * 0.25), 0);
  PV.r.render(PV.sc, PV.cm);
}
const _thumbs = {};
function furnThumb(id) {
  if (_thumbs[id]) return _thumbs[id];
  if (!PV) return '';
  const D = FURN[id], g = buildFurn({ t: id, x: 0, y: 0, r: 0, c: D.c }); PV.ts.add(g);
  const cm = new THREE.PerspectiveCamera(28, 84 / 64, 1, 5000), s = Math.max(D.w, D.h * 1.15, D.d, 40);
  cm.position.set(s * 0.9, D.h * 0.5 + s * 1.0, s * 2.1); cm.lookAt(0, D.h * 0.42, 0);
  PV.r.setPixelRatio(1); PV.r.setSize(168, 128, false); PV.r.render(PV.ts, cm);
  _thumbs[id] = PV.c.toDataURL('image/png');
  PV.ts.remove(g); disposeTree(g); PV.w = 0;
  return _thumbs[id];
}

// ----- panel del vestidor -----
function charPanelBody() {
  const L = S.look, f = L.gender !== 'm';
  const g = `<div class="seg" style="margin:10px 0"><button class="${f ? 'on' : ''}" data-gender="f">♀ Mujer</button><button class="${!f ? 'on' : ''}" data-gender="m">♂ Hombre</button></div>`;
  const grid = (cat, title, ck, pk) => `<h3>${title} <span style="color:#889;font-weight:600;text-transform:none">(${CLOTHES[cat].length})</span></h3><div class="grid">${CLOTHES[cat].map(it => `<button class="chip ${L[cat] === it.id ? 'sel' : ''}" data-cloth="${cat}:${it.id}"><span class="ic">${it.icon}</span>${it.name}</button>`).join('')}</div>` +
    (ck ? `<div style="margin-top:8px">${swatches(CLOTHC, L[ck], 'cc-' + ck)}</div>` : '') +
    (pk ? `<div class="seg" style="margin-top:8px">${PATTERNS.map((p, i) => `<button class="${(L[pk] || 0) === i ? 'on' : ''}" data-pat="${pk}:${i}" style="min-width:60px;padding:7px 4px;font-size:12px">${p}</button>`).join('')}</div>` : '');
  if (panelTab === 'cuerpo') {
    return g + `<input class="nameIn" maxlength="14" id="nameIn" value="${esc(S.name)}" placeholder="Nombre">` +
      `<h3>Físico</h3>` + BODY_SLIDERS.map(([k, n]) => `<div class="slider"><span>${n}</span><input type="range" min="0" max="100" value="${Math.round((L[k] === undefined ? 0.5 : L[k]) * 100)}" data-look="${k}"><span id="sv_${k}">${Math.round((L[k] === undefined ? 0.5 : L[k]) * 100)}</span></div>`).join('') +
      `<h3>Piel</h3>` + swatches(SKINS, L.skin, 'skin') +
      `<div class="row" style="margin-top:10px"><span>Física del cuerpo (rebote)</span><div class="seg"><button class="${OPT.phys ? 'on' : ''}" data-opt="phys:true">Sí</button><button class="${!OPT.phys ? 'on' : ''}" data-opt="phys:false">No</button></div></div>` +
      `<p class="p" style="font-size:12.5px;color:#aab;margin:6px 0">Arrastra el personaje para girarlo, pulsa 🚶 para verlo caminar y tócalo para que rebote.</p>` +
      `<div style="display:flex;gap:8px;margin-top:10px"><button class="btn ghost" data-act="randBody" style="flex:1">🎲 Aleatorio</button><button class="btn ghost" data-act="resetBody" style="flex:1">↺ Por defecto</button></div>`;
  }
  if (panelTab === 'cara') return g + `<h3>Peinado</h3><div class="grid">${HAIRS.map(h => `<button class="chip ${L.hair === h.id ? 'sel' : ''}" data-hair="${h.id}"><span class="ic">💇</span>${h.name}</button>`).join('')}</div>` +
    `<h3>Color de pelo</h3>` + swatches(HAIRC, L.hairC, 'hairc') + `<h3>Ojos</h3>` + swatches(EYEC, L.eyes, 'eyes') + `<h3>Labios</h3>` + swatches(LIPC, L.lips, 'lips');
  if (panelTab === 'arriba') return grid('top', 'Tops, vestidos y trajes', 'topC', 'topP') + '<p class="p" style="font-size:12.5px;color:#aab">Los vestidos, bodys, bañadores y el mono ya incluyen la parte de abajo.</p>';
  if (panelTab === 'abajo') return grid('bottom', 'Pantalones, shorts, faldas y bikinis', 'botC', 'botP');
  if (panelTab === 'piernas') return grid('socks', 'Medias y calcetines', 'sockC') + grid('shoes', 'Calzado', 'shoeC') + grid('gloves', 'Guantes', 'gloveC');
  if (panelTab === 'extras') return grid('acc', 'Cabeza', 'accC') + grid('neckw', 'Cuello', 'neckC') + grid('back', 'Alas, colas y espalda', 'backC');
  return `<p class="p">Conjuntos completos listos para poner. Luego puedes cambiar cada prenda y color.</p><button class="btn pink" data-act="randOutfit" style="width:100%;margin-bottom:8px">🎲 Conjunto aleatorio</button><div class="grid">` +
    OUTFITS.map((o, i) => `<button class="chip" data-outfit="${i}"><span class="ic" style="font-size:28px">${o.icon}</span>${o.name}</button>`).join('') + '</div>';
}
