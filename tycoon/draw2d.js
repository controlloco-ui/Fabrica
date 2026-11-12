'use strict';
// Utilidades de dibujo 2D reutilizadas: texturas de suelos y muros, textos y joystick.
let HQ = true;
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))) : c.rect(x, y, w, h); }
function text(t, x, y, size, color = '#fff', align = 'center', weight = 800, c = ctx) {
  c.font = `${weight} ${size}px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`;
  c.textAlign = align; c.textBaseline = 'middle';
  c.lineWidth = Math.max(3, size / 5); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineJoin = 'round';
  c.strokeText(t, x, y); c.fillStyle = color; c.fillText(t, x, y);
}
const findIn = (arr, id) => arr.find(i => i.id === id) || arr[0];
const BGM = 200;
const bgCanvas = document.createElement('canvas'), wallCanvas = document.createElement('canvas');
let bgDirty = true, bgKey = '', BGQ = 1.2, wallDirty = true, wallKey = '';
function seeded(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
function drawFloor(c, fl, x0, y0, x1, y1, R) {
  const w = x1 - x0, h = y1 - y0;
  c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
  c.fillStyle = fl.a; c.fillRect(x0, y0, w, h);
  const P = fl.pat;
  if (P === 'grid') { c.strokeStyle = 'rgba(0,0,0,.07)'; c.lineWidth = 2; for (let x = x0; x < x1; x += 80) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); } for (let y = y0; y < y1; y += 80) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); } for (let i = 0; i < 80; i++) { c.fillStyle = 'rgba(0,0,0,.04)'; c.beginPath(); c.ellipse(x0 + R() * w, y0 + R() * h, 10 + R() * 30, 6 + R() * 15, R() * 3, 0, 7); c.fill(); } }
  if (P === 'tiles') { c.fillStyle = fl.b; for (let y = y0; y < y1; y += 50) for (let x = x0; x < x1; x += 50) { c.fillRect(x, y, 50, 1.5); c.fillRect(x, y, 1.5, 50); } c.fillStyle = 'rgba(255,255,255,.08)'; for (let y = y0, r = 0; y < y1; y += 50, r++) for (let x = x0 + (r % 2) * 50; x < x1; x += 100) c.fillRect(x, y, 50, 50); }
  if (P === 'polished') { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, fl.a); g.addColorStop(0.5, fl.b); g.addColorStop(1, fl.a); c.fillStyle = g; c.fillRect(x0, y0, w, h); c.globalAlpha = 0.12; c.fillStyle = '#fff'; for (let i = 0; i < 12; i++) { c.beginPath(); c.ellipse(x0 + R() * w, y0 + R() * h, 60 + R() * 120, 10 + R() * 25, -0.4, 0, 7); c.fill(); } c.globalAlpha = 1; c.strokeStyle = 'rgba(0,0,0,.06)'; for (let x = x0; x < x1; x += 160) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); } }
  if (P === 'planks') { for (let y = y0, r = 0; y < y1; y += 22, r++) { c.fillStyle = r % 2 ? fl.b : fl.a; c.fillRect(x0, y, w, 22); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x0, y, w, 1.2); for (let x = x0 + (r * 67) % 160; x < x1; x += 160) c.fillRect(x, y, 1.2, 22); c.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 0; k < 6; k++) c.fillRect(x0 + R() * w, y + 4 + R() * 14, 30 + R() * 50, 1); } }
  if (P === 'herring') { for (let y = y0 - 40, r = 0; y < y1 + 40; y += 20, r++) for (let x = x0 - 80; x < x1 + 80; x += 80) { const o = (r % 2) * 40, col = Math.floor((x + o) / 40); c.fillStyle = (col + r) % 2 ? fl.a : fl.b; c.save(); c.translate(x + o, y); c.rotate((col % 2 ? 1 : -1) * Math.PI / 4); c.fillRect(-28, -7, 56, 14); c.strokeStyle = 'rgba(0,0,0,.15)'; c.strokeRect(-28, -7, 56, 14); c.restore(); } }
  if (P === 'checker') { c.fillStyle = fl.b; for (let y = y0, r = 0; y < y1; y += 50, r++) for (let x = x0 + (r % 2) * 50; x < x1; x += 100) c.fillRect(x, y, 50, 50); }
  if (P === 'marble') { c.strokeStyle = 'rgba(120,110,100,.2)'; c.lineWidth = 1.5; for (let i = 0; i < 120; i++) { c.beginPath(); let x = x0 + R() * w, y = y0 + R() * h; c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - 0.5) * 80; y += R() * 40; c.lineTo(x, y); } c.stroke(); } c.fillStyle = 'rgba(0,0,0,.05)'; for (let y = y0; y < y1; y += 80) c.fillRect(x0, y, w, 1); for (let x = x0; x < x1; x += 80) c.fillRect(x, y0, 1, h); }
  if (P === 'terrazzo') { const cols = [fl.b, '#4a6a8a', '#e8b84a', '#7a7a7a', '#2a2a2a']; for (let i = 0; i < w * h / 180; i++) { c.fillStyle = cols[Math.floor(R() * cols.length)]; c.beginPath(); c.ellipse(x0 + R() * w, y0 + R() * h, 1 + R() * 4, 1 + R() * 3, R() * 3, 0, 7); c.fill(); } }
  if (P === 'hex') { c.strokeStyle = fl.b; c.lineWidth = 2; const s = 26; for (let y = y0, r = 0; y < y1 + s; y += s * 1.5, r++) for (let x = x0 + (r % 2) * s * 0.866; x < x1 + s; x += s * 1.732) { c.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); } c.closePath(); c.stroke(); if (R() < 0.15) { c.fillStyle = 'rgba(255,255,255,.06)'; c.fill(); } } }
  if (P === 'carpet') { for (let i = 0; i < w * h / 40; i++) { c.fillStyle = R() < 0.5 ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.05)'; c.fillRect(x0 + R() * w, y0 + R() * h, 2, 2); } c.strokeStyle = fl.b; c.lineWidth = 6; c.globalAlpha = 0.3; for (let x = x0 + 60; x < x1; x += 120) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); } c.globalAlpha = 1; }
  if (P === 'neongrid') { c.strokeStyle = fl.b; c.globalAlpha = 0.4; c.lineWidth = 1.5; c.shadowColor = fl.b; c.shadowBlur = 6; for (let x = x0; x < x1; x += 50) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); } for (let y = y0; y < y1; y += 50) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); } c.shadowBlur = 0; c.globalAlpha = 1; }
  // grano general para que no parezca plástico
  if (HQ) for (let i = 0; i < w * h / 260; i++) { c.fillStyle = R() < 0.5 ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.035)'; c.fillRect(x0 + R() * w, y0 + R() * h, 1.5, 1.5); }
  c.restore();
}
function buildWall() {
  const key = [S.cur, S.style.pared, HQ].join('|');
  if (!wallDirty && key === wallKey) return;
  wallDirty = false; wallKey = key;
  const q = HQ ? 1.5 : 1, fac = FACS[S.cur], wl = findIn(WALLS, S.style.pared);
  wallCanvas.width = Math.round(W * q); wallCanvas.height = Math.round((WALL_H + 20) * q);
  const c = wallCanvas.getContext('2d'); c.setTransform(q, 0, 0, q, 0, 0);
  const R = seeded(31 + S.cur);
  c.fillStyle = darken(wl.c, 0.15); c.fillRect(0, 0, W, 20);
  c.fillStyle = wl.c; c.fillRect(0, 20, W, WALL_H);
  const y0 = 20, y1 = 20 + WALL_H;
  if (wl.pat === 'brick') { c.fillStyle = 'rgba(0,0,0,.16)'; for (let y = y0, r = 0; y < y1; y += 12, r++) { c.fillRect(0, y, W, 1.5); for (let x = (r % 2) * 14; x < W; x += 28) c.fillRect(x, y, 1.5, 12); } for (let i = 0; i < 300; i++) { c.fillStyle = R() < 0.5 ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.06)'; c.fillRect(Math.floor(R() * 36) * 28 + (R() < .5 ? 14 : 0), y0 + Math.floor(R() * 11) * 12 + 1.5, 26.5, 10.5); } }
  if (wl.pat === 'concrete') { c.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < W; x += 120) c.fillRect(x, y0, 1.5, WALL_H); c.fillRect(0, y0 + WALL_H / 2, W, 1.5); c.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 30; x < W; x += 60) for (let y = y0 + 20; y < y1; y += 60) { c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill(); } }
  if (wl.pat === 'planks') { c.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < W; x += 26) c.fillRect(x, y0, 1.5, WALL_H); }
  if (wl.pat === 'tiles') { c.fillStyle = 'rgba(0,0,0,.12)'; for (let x = 0; x < W; x += 20) c.fillRect(x, y0, 1, WALL_H); for (let y = y0; y < y1; y += 20) c.fillRect(0, y, W, 1); }
  if (wl.pat === 'stripes') { c.fillStyle = wl.c2; for (let x = 0; x < W; x += 30) c.fillRect(x, y0, 12, WALL_H); }
  if (wl.pat === 'corrugated') { for (let x = 0; x < W; x += 12) { const g = c.createLinearGradient(x, 0, x + 12, 0); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(0.5, 'rgba(0,0,0,.15)'); g.addColorStop(1, 'rgba(255,255,255,.18)'); c.fillStyle = g; c.fillRect(x, y0, 12, WALL_H); } }
  if (wl.pat === 'floral') { for (let i = 0; i < 260; i++) { const x = R() * W, y = y0 + R() * WALL_H; c.fillStyle = wl.c2; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x + Math.cos(k * 1.256) * 3, y + Math.sin(k * 1.256) * 3, 2.2, 0, 7); c.fill(); } c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(x, y, 1.4, 0, 7); c.fill(); } }
  if (wl.pat === 'marble') { c.strokeStyle = 'rgba(120,110,100,.25)'; for (let i = 0; i < 60; i++) { c.beginPath(); let x = R() * W, y = y0 + R() * WALL_H; c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 60; y += R() * 30; c.lineTo(x, y); } c.stroke(); } }
  if (wl.pat === 'neon') { c.strokeStyle = '#ff3df0'; c.lineWidth = 3; c.shadowColor = '#ff3df0'; c.shadowBlur = 14; c.strokeRect(6, y0 + 6, W - 12, WALL_H - 12); c.strokeStyle = '#3dd7ff'; c.shadowColor = '#3dd7ff'; c.beginPath(); c.moveTo(0, y1 - 26); c.lineTo(W, y1 - 26); c.stroke(); c.shadowBlur = 0; }
  // ventanas
  const glass = wl.pat === 'glass', nWin = glass ? 9 : 5;
  for (let i = 0; i < nWin; i++) {
    if (!glass && i === 2) continue;   // hueco para el cartel
    const ww = glass ? 96 : 110, wx = glass ? 18 + i * 108 : 130 + i * 185 - ww / 2, wy = y0 + 18, wh = WALL_H - 52;
    const g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, fac.sky[0]); g.addColorStop(1, fac.sky[1]);
    c.fillStyle = '#2a3038'; c.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
    c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(wx + ww * 0.15, wy); c.lineTo(wx + ww * 0.4, wy); c.lineTo(wx + ww * 0.1, wy + wh); c.lineTo(wx, wy + wh); c.closePath(); c.fill();
    c.fillStyle = '#2a3038'; c.fillRect(wx + ww / 2 - 2, wy, 4, wh); c.fillRect(wx, wy + wh / 2 - 2, ww, 4);
  }
  if (!glass) {
    c.fillStyle = '#1b1f26'; rr(c, W / 2 - 150, y0 + 26, 300, 50, 10); c.fill();
    c.strokeStyle = '#ffd84a'; c.lineWidth = 3; rr(c, W / 2 - 146, y0 + 30, 292, 42, 8); c.stroke();
  }
  text(`${fac.icon} ${fac.name.toUpperCase()}`, W / 2, y0 + 51, 22, '#ffd84a', 'center', 900, c);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, y1 - 10, W, 10);
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(0,0,0,.15)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.12)'); c.fillStyle = g; c.fillRect(0, y0, W, WALL_H);
}

const TIER = [['#7d8a99', '#5a6573'], ['#4f8fd6', '#346aa6'], ['#a65ad6', '#7c3ca8'], ['#e0533d', '#a83a28']];
function furnColors(f) {
  const main = CLOTHC[f.c] || '#8a5a32';
  return { main, light: darken(main, 0.3), dark: '#3a3028', metal: '#b8c0c8', white: '#f2f4f6', black: '#16181c', glass: 'rgba(160,220,255,.35)', leaf: '#3a8a3a', trunk: '#8a6a3a' };
}
function rotPart(p, r) {
  let dx = p.dx, dy = p.dy, w = p.w, d = p.d;
  for (let i = 0; i < r; i++) { const t = dx; dx = -dy; dy = t; const tw = w; w = d; d = tw; }
  return { dx, dy, w, d };
}
function faceDeco(kind, b, p, x) {
  const X = b.X, w = p.w, fy = b.front, fh = b.bottom - b.front;
  if (kind === 'screen') {
    ctx.fillStyle = '#0a0c10'; rr(ctx, X + 3, fy + 2, w - 6, fh - 6, 3); ctx.fill();
    const g = ctx.createLinearGradient(X, fy, X + w, fy + fh), h = (T * 30) % 360;
    g.addColorStop(0, `hsl(${h},70%,45%)`); g.addColorStop(1, `hsl(${(h + 80) % 360},70%,30%)`);
    ctx.fillStyle = g; rr(ctx, X + 5, fy + 4, w - 10, fh - 10, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 3; k++) ctx.fillRect(X + 12 + ((T * 20 + k * 25) % (w - 30)), fy + 10 + k * 9, 14, 3);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(X + 5, fy + 4); ctx.lineTo(X + w * 0.4, fy + 4); ctx.lineTo(X + 5, fy + fh * 0.7); ctx.fill();
  } else if (kind === 'books') {
    for (let s = 0; s < 4; s++) {
      const sy = fy + 4 + s * (fh - 6) / 4, sh = (fh - 6) / 4 - 3;
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(X + 4, sy, w - 8, sh);
      let bx = X + 6; const R = seeded(s * 7 + Math.round(x) + 3);
      while (bx < X + w - 10) { const bw = 3 + R() * 4, bh = sh * (0.6 + R() * 0.35); ctx.fillStyle = CLOTHC[Math.floor(R() * CLOTHC.length)]; ctx.fillRect(bx, sy + sh - bh, bw, bh); bx += bw + 0.8; }
    }
  } else if (kind === 'fridge') {
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(X + 2, fy + fh * 0.35, w - 4, 1.5);
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(X + w - 8, fy + 8, 3, fh * 0.22); ctx.fillRect(X + w - 8, fy + fh * 0.42, 3, fh * 0.35);
  } else if (kind === 'vend') {
    ctx.fillStyle = 'rgba(180,230,255,.85)'; rr(ctx, X + 5, fy + 5, w * 0.62, fh * 0.7, 3); ctx.fill();
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { ctx.fillStyle = CLOTHC[(r * 3 + c * 5) % CLOTHC.length]; ctx.fillRect(X + 9 + c * (w * 0.18), fy + 10 + r * fh * 0.16, w * 0.12, fh * 0.1); }
    ctx.fillStyle = '#222'; ctx.fillRect(X + w * 0.72, fy + 10, w * 0.2, fh * 0.3); ctx.fillStyle = '#111'; ctx.fillRect(X + 6, fy + fh * 0.8, w * 0.6, fh * 0.12);
    if (HQ) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(120,200,255,.12)'; ctx.fillRect(X - 10, fy - 10, w + 20, fh + 20); ctx.globalCompositeOperation = 'source-over'; }
  } else if (kind === 'arcade') {
    ctx.fillStyle = '#0a0a14'; rr(ctx, X + 6, fy + 6, w - 12, fh * 0.4, 3); ctx.fill();
    const a = Math.sin(T * 3); ctx.fillStyle = '#3dff8a'; ctx.fillRect(X + w / 2 + a * 10 - 3, fy + 12, 6, 6); ctx.fillStyle = '#ff3df0'; ctx.fillRect(X + 10, fy + fh * 0.3, w - 20, 2);
    ctx.fillStyle = '#222'; ctx.fillRect(X + 4, fy + fh * 0.52, w - 8, fh * 0.12);
    ctx.fillStyle = '#e8365d'; ctx.beginPath(); ctx.arc(X + 12, fy + fh * 0.56, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(X + w - 12, fy + fh * 0.58, 2.5, 0, 7); ctx.arc(X + w - 20, fy + fh * 0.58, 2.5, 0, 7); ctx.fill();
  } else if (kind === 'juke') {
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(ctx, X + 6, fy + 6, w - 12, fh * 0.5, w / 3); ctx.fill();
    for (let k = 0; k < 5; k++) { ctx.fillStyle = `hsl(${(T * 120 + k * 60) % 360},90%,60%)`; ctx.fillRect(X + 8 + k * (w - 16) / 5, fy + fh * 0.62, (w - 16) / 5 - 2, 5); }
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, fy + fh * 0.32, 7, 0, 7); ctx.fill();
  } else if (kind === 'fish') {
    ctx.fillStyle = 'rgba(40,140,220,.45)'; ctx.fillRect(X + 2, fy + 4, w - 4, fh - 6);
    for (let k = 0; k < 4; k++) { const fx = X + 10 + ((T * (14 + k * 5) + k * 30) % Math.max(10, w - 20)), fyy = fy + 10 + k * (fh - 20) / 4 + Math.sin(T * 2 + k) * 3; ctx.fillStyle = ['#ff8a2a', '#ffd84a', '#ff4f8a', '#3dd7ff'][k]; ctx.beginPath(); ctx.ellipse(fx, fyy, 5, 3, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx - 4, fyy); ctx.lineTo(fx - 8, fyy - 3); ctx.lineTo(fx - 8, fyy + 3); ctx.fill(); }
    ctx.fillStyle = '#2a8a3a'; for (let k = 0; k < 4; k++) ctx.fillRect(X + 8 + k * (w - 16) / 4, fy + fh - 14 - (k % 2) * 6, 3, 12 + (k % 2) * 6);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(X + 4, fy + 4, 6, fh - 8);
  } else if (kind === 'keys') {
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(X + 6, fy + fh * 0.3, w - 12, fh * 0.22);
    ctx.fillStyle = '#111'; for (let k = 0; k < 14; k++) if (k % 7 !== 2 && k % 7 !== 6) ctx.fillRect(X + 9 + k * (w - 18) / 14, fy + fh * 0.3, 2.5, fh * 0.13);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(X + 4, fy + 3, w - 8, 2);
  } else if (kind === 'bar') {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; for (let k = 1; k < 5; k++) ctx.fillRect(X + k * w / 5, fy + 2, 2, fh - 4);
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(X, fy + fh - 8, w, 3);
  } else if (kind === 'pool') {
    ctx.fillStyle = '#1f7a4a'; rr(ctx, X + 6, b.top + 3, w - 12, b.front - b.top - 6, 4); ctx.fill();
    ['#fff', '#ffd84a', '#e8365d', '#2f7bd6', '#1a1a1f', '#ff7a2f'].forEach((bc, k) => { ctx.fillStyle = bc; ctx.beginPath(); ctx.arc(X + 24 + k * 13 + (k % 2) * 4, b.top + 8 + (k % 3) * 6, 3, 0, 7); ctx.fill(); });
  } else if (kind === 'back') {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(X + 4, fy + 4, w - 8, fh - 8);
  }
}

const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function drawJoystick() {
  const R = joyR();
  let bx, by, kx, ky, show = false;
  if (joy.active) { bx = joy.bx; by = joy.by; const dx = joy.x - bx, dy = joy.y - by, d = Math.hypot(dx, dy), k = Math.min(d, R) / (d || 1); kx = bx + dx * k; ky = by + dy * k; show = true; }
  else if (OPT.joy === 'fijo') { const fb = fixedBase(); bx = kx = fb.x; by = ky = fb.y; show = true; }
  if (!show) return;
  const sp = joy.sprint;
  ctx.save();
  ctx.globalAlpha = joy.active ? 1 : 0.55;
  const g = ctx.createRadialGradient(bx, by, R * 0.3, bx, by, R * 1.15);
  g.addColorStop(0, 'rgba(255,255,255,.05)'); g.addColorStop(1, sp ? 'rgba(255,170,0,.35)' : 'rgba(255,255,255,.22)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, R * 1.15, 0, 7); ctx.fill();
  ctx.strokeStyle = sp ? 'rgba(255,190,40,.9)' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, R * 1.15, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; ctx.save(); ctx.translate(bx + Math.cos(a) * R * 0.92, by + Math.sin(a) * R * 0.92); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-3, -6); ctx.lineTo(-3, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
  if (joy.active && joy.mag > 0.15) {
    const a = Math.atan2(ky - by, kx - bx);
    ctx.strokeStyle = sp ? 'rgba(255,170,0,.9)' : 'rgba(120,220,255,.9)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(bx, by, R * 1.15, a - 0.45, a + 0.45); ctx.stroke();
  }
  const kg = ctx.createRadialGradient(kx - R * 0.15, ky - R * 0.15, 2, kx, ky, R * 0.48);
  kg.addColorStop(0, sp ? '#ffe9a8' : '#ffffff'); kg.addColorStop(1, sp ? '#ff9500' : '#9fb4c8');
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(kx + 2, ky + 4, R * 0.44, 0, 7); ctx.fill();
  ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(kx, ky, R * 0.44, 0, 7); ctx.fill();
  if (sp) text('¡CORRE!', bx, by - R * 1.15 - 14, 13, '#ffcf4a', 'center', 900);
  ctx.restore();
}

