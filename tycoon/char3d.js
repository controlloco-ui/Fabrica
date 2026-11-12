'use strict';
// =====================================================================
// Personaje 3D estilo anime: datos de vestuario, modelo y animación
// =====================================================================
const SKINS = ['#ffe3cc', '#f6c9a3', '#e8b08a', '#c98a5e', '#9a6440', '#6a4028', '#f3d9e6', '#cfe0f5'];
const HAIRC = ['#1d1410', '#4a2c1a', '#8b5a2b', '#c98a3a', '#f1d38a', '#b8322f', '#ff6fae', '#7a5cff', '#3dd7ff', '#e9e9f0', '#3fbf7a', '#ff8a3a', '#b48cff', '#2b3a8a'];
const EYEC = ['#6a3a1a', '#2f6fd6', '#2f9e57', '#7a4fd0', '#8a8a8a', '#c9831e', '#e8365d', '#ff6fae', '#1fb5a8', '#f1c232'];
const LIPC = ['#d4576b', '#b8324a', '#ff7f9a', '#8c3b2c', '#c2737a', '#9a3fd0'];
// los 18 primeros colores no cambian de sitio: los usan los muebles y las cintas guardadas
const CLOTHC = ['#e8365d', '#ff7a2f', '#ffd84a', '#2fbf4a', '#1fb5a8', '#2f7bd6', '#2b3a8a', '#7a4fd0', '#e94fd0', '#ffffff', '#c9ced6', '#555d68', '#1a1a1f', '#8a5a32', '#c4a77d', '#b0102a', '#ff9ec7', '#9be7ff',
  '#7fe0b0', '#d8b4ff', '#ffe9a8', '#4a1f5a', '#0f4a3a', '#ff5a5a'];
const PATTERNS = ['Liso', 'Rayas', 'Lunares', 'Cuadros', 'Degradado', 'Corazones'];

// alturas del torso en coordenada v (0 = entrepierna, 1 = cuello)
const V_HIP = 0.22, V_WAIST = 0.40, V_UNDER = 0.56, V_OVER = 0.80;
// lo/hi: zona cubierta · neck: escote · straps: 0 hombros cubiertos, 1 tirante fino, 2 ancho, 'halter'
// sleeve: 0 / .5 / 1 · cup: cuánto pecho cubre · skirt: largo de falda (vestidos) · leo: body de una pieza
const TOPS = {
  camiseta: { name: 'Camiseta', icon: '👕', lo: .24, hi: 1, neck: 'crew', sleeve: .5 },
  oversize: { name: 'Camiseta oversize', icon: '👕', lo: .08, hi: 1, neck: 'crew', sleeve: .5 },
  cuellov: { name: 'Cuello en V', icon: '👕', lo: .24, hi: 1, neck: 'v', sleeve: .5 },
  tirantes: { name: 'Tirantes', icon: '🎽', lo: .24, hi: .8, neck: 'scoop', straps: 1, cup: .88 },
  escotada: { name: 'Camiseta escotada', icon: '🎽', lo: .26, hi: .8, neck: 'deep', straps: 1, cup: .72 },
  crop: { name: 'Top corto', icon: '👚', lo: .53, hi: .8, neck: 'scoop', straps: 1, cup: .85 },
  deportivo: { name: 'Top deportivo', icon: '🏃', lo: .52, hi: .82, neck: 'scoop', straps: 2, cup: .92 },
  bandeau: { name: 'Palabra de honor', icon: '🎀', lo: .56, hi: .76, neck: 'none', straps: 'none', cup: .62 },
  halter: { name: 'Top halter', icon: '👚', lo: .46, hi: .8, neck: 'v', straps: 'halter', cup: .8, back: 'open' },
  bikini: { name: 'Bikini', icon: '👙', lo: .6, hi: .74, neck: 'none', straps: 'halter', cup: .58, back: 'string', tri: 1 },
  microbikini: { name: 'Microbikini', icon: '👙', lo: .63, hi: .72, neck: 'none', straps: 'halter', cup: .45, back: 'string', tri: 1 },
  camisa: { name: 'Camisa', icon: '👔', lo: .2, hi: 1, neck: 'v', sleeve: 1, buttons: 1, collar: 1 },
  anudada: { name: 'Camisa anudada', icon: '👔', lo: .5, hi: 1, neck: 'deep', sleeve: .5, buttons: 1, collar: 1, cup: .8 },
  hombros: { name: 'Hombros al aire', icon: '👚', lo: .3, hi: .78, neck: 'none', straps: 'none', sleeve: 1, cup: .7, offsh: 1 },
  sudadera: { name: 'Sudadera', icon: '🧥', lo: .14, hi: 1, neck: 'crew', sleeve: 1, pocket: 1 },
  sudaderacorta: { name: 'Sudadera corta', icon: '🧥', lo: .5, hi: 1, neck: 'crew', sleeve: 1 },
  jersey: { name: 'Jersey cuello alto', icon: '🧶', lo: .2, hi: 1, neck: 'high', sleeve: 1 },
  corse: { name: 'Corsé', icon: '🎀', lo: .3, hi: .76, neck: 'none', straps: 'none', cup: .64, lace: 1 },
  cuero: { name: 'Chaqueta de cuero', icon: '🧥', lo: .3, hi: 1, neck: 'open', sleeve: 1, collar: 1, cup: .7 },
  traje: { name: 'Traje de jefa', icon: '🤵', lo: .14, hi: 1, neck: 'suit', sleeve: 1 },
  animadora: { name: 'Animadora', icon: '📣', lo: .52, hi: 1, neck: 'crew', sleeve: 0, stripe: 1 },
  marinera: { name: 'Marinera', icon: '⚓', lo: .44, hi: 1, neck: 'v', sleeve: .5, sailor: 1 },
  armadura: { name: 'Armadura ligera', icon: '🛡️', lo: .56, hi: .8, neck: 'none', straps: 2, cup: .75, metal: 1, pauldron: 1 },
  brillos: { name: 'Top de lentejuelas', icon: '✨', lo: .54, hi: .76, neck: 'none', straps: 'none', cup: .64, sparkle: 1 },
  mono: { name: 'Mono de obra', icon: '🦺', lo: 0, hi: 1, neck: 'crew', sleeve: .5, pants: 1, pocket: 1 },
  banador: { name: 'Bañador', icon: '🩱', lo: 0, hi: .8, neck: 'scoop', straps: 1, cup: .86, leo: 1, back: 'open' },
  banadorv: { name: 'Bañador escotado', icon: '🩱', lo: 0, hi: .8, neck: 'deep', straps: 'halter', cup: .7, leo: 1, back: 'open' },
  conejita: { name: 'Body de conejita', icon: '🐰', lo: 0, hi: .74, neck: 'none', straps: 'none', cup: .62, leo: 1 },
  minivestido: { name: 'Minivestido', icon: '👗', lo: .2, hi: .8, neck: 'v', straps: 1, cup: .82, skirt: .14, flare: 1.08 },
  ajustado: { name: 'Vestido ajustado', icon: '👗', lo: .2, hi: .8, neck: 'scoop', straps: 1, cup: .85, skirt: .32, flare: 1.02 },
  verano: { name: 'Vestido de verano', icon: '👗', lo: .2, hi: .8, neck: 'scoop', straps: 1, cup: .88, skirt: .36, flare: 1.55 },
  noche: { name: 'Vestido de noche', icon: '💃', lo: .2, hi: .8, neck: 'deep', straps: 'halter', cup: .7, skirt: .9, flare: 1.25, back: 'open' },
  coctel: { name: 'Vestido palabra de honor', icon: '👗', lo: .2, hi: .76, neck: 'none', straps: 'none', cup: .64, skirt: .24, flare: 1.3 },
  maid: { name: 'Sirvienta', icon: '🧹', lo: .2, hi: 1, neck: 'square', sleeve: .5, skirt: .3, flare: 1.6, apron: 1 },
  qipao: { name: 'Qipao', icon: '🏮', lo: .2, hi: 1, neck: 'high', sleeve: 0, skirt: .42, flare: 1.0, trim: 1 },
  enfermera: { name: 'Enfermera', icon: '💉', lo: .2, hi: 1, neck: 'v', sleeve: .5, skirt: .2, flare: 1.1, buttons: 1 },
  kimono: { name: 'Yukata', icon: '🎎', lo: .2, hi: 1, neck: 'v', sleeve: 1, skirt: .8, flare: 1.05, sash: 1 },
  princesa: { name: 'Vestido de princesa', icon: '👸', lo: .2, hi: .78, neck: 'none', straps: 'none', cup: .66, sleeve: 0, skirt: .85, flare: 1.9, lace: 1 },
};
// legs: cuánta pierna cubre (0..1) · skirt: largo de falda · rise: altura de la cintura · loose: holgura
const BOTS = {
  vaqueros: { name: 'Vaqueros', icon: '👖', legs: 1, rise: .3 },
  pitillo: { name: 'Pitillo', icon: '👖', legs: 1, rise: .34 },
  ancho: { name: 'Pantalón ancho', icon: '👖', legs: 1, rise: .3, loose: 1.35 },
  campana: { name: 'Campana', icon: '👖', legs: 1, rise: .3, bell: 1.7 },
  cargo: { name: 'Cargo', icon: '👖', legs: 1, rise: .28, loose: 1.2 },
  chandal: { name: 'Chándal', icon: '🏃', legs: 1, rise: .3, loose: 1.15, stripe: 1 },
  leggings: { name: 'Leggings', icon: '🦵', legs: 1, rise: .38 },
  cuero: { name: 'Pantalón de cuero', icon: '🖤', legs: 1, rise: .3 },
  pirata: { name: 'Pirata', icon: '👖', legs: .7, rise: .3 },
  shorts: { name: 'Shorts', icon: '🩳', legs: .32, rise: .3, loose: 1.12 },
  ciclista: { name: 'Ciclista', icon: '🚴', legs: .3, rise: .36 },
  minishort: { name: 'Minishorts', icon: '🩳', legs: .1, rise: .26 },
  microshort: { name: 'Microshorts', icon: '🩳', legs: .03, rise: .2 },
  bikini: { name: 'Bikini', icon: '👙', legs: 0, rise: .18, cut: 1 },
  bikinialto: { name: 'Bikini de talle alto', icon: '👙', legs: 0, rise: .34, cut: 1 },
  faldalarga: { name: 'Falda larga', icon: '👗', skirt: .86, rise: .34, flare: 1.4 },
  midi: { name: 'Falda midi', icon: '👗', skirt: .56, rise: .34, flare: 1.3 },
  tubo: { name: 'Falda tubo', icon: '👗', skirt: .44, rise: .38, flare: 1.0 },
  vuelo: { name: 'Falda de vuelo', icon: '👗', skirt: .28, rise: .34, flare: 1.7 },
  plisada: { name: 'Falda plisada', icon: '👗', skirt: .2, rise: .3, flare: 1.45, pleats: 1 },
  minifalda: { name: 'Minifalda', icon: '👗', skirt: .16, rise: .28, flare: 1.15 },
  microfalda: { name: 'Microfalda', icon: '👗', skirt: .09, rise: .24, flare: 1.2 },
  tutu: { name: 'Tutú', icon: '🩰', skirt: .1, rise: .3, flare: 2.2, pleats: 1 },
  pareo: { name: 'Pareo', icon: '🏝️', skirt: .4, rise: .24, flare: 1.12 },
};
const SHOES = {
  zapatillas: { name: 'Zapatillas', icon: '👟' }, descalzo: { name: 'Descalza', icon: '🦶' }, bailarinas: { name: 'Bailarinas', icon: '🥿' },
  sandalias: { name: 'Sandalias', icon: '🩴' }, tacones: { name: 'Tacones', icon: '👠', heel: .05 }, plataformas: { name: 'Plataformas', icon: '👡', heel: .07, plat: 1 },
  botas: { name: 'Botas', icon: '🥾', boot: .45 }, botasaltas: { name: 'Botas altas', icon: '👢', boot: 1, heel: .04 }, botasmuslo: { name: 'Botas hasta el muslo', icon: '👢', boot: 1.5, heel: .05 },
};
const SOCKS = {
  ninguna: { name: 'Sin medias', icon: '➖', h: 0 }, tobilleros: { name: 'Calcetines', icon: '🧦', h: .25 }, altos: { name: 'Calcetines altos', icon: '🧦', h: .95 },
  muslo: { name: 'Medias al muslo', icon: '🦵', h: 1.6 }, pantis: { name: 'Pantis', icon: '🦵', h: 2, sheer: 1 }, rejilla: { name: 'Medias de rejilla', icon: '🕸️', h: 2, net: 1 },
  calentadores: { name: 'Calentadores', icon: '🧶', h: .7, warm: 1 }, rayas: { name: 'Medias de rayas', icon: '🦓', h: 1.6, striped: 1 },
};
const GLOVES = { ninguno: { name: 'Sin guantes', icon: '➖', h: 0 }, cortos: { name: 'Guantes cortos', icon: '🧤', h: .3 }, largos: { name: 'Guantes largos', icon: '🧤', h: 1.5 }, munequeras: { name: 'Muñequeras', icon: '⌚', h: .35, band: 1 } };
const ACCS = {
  ninguno: { name: 'Nada', icon: '➖' }, casco: { name: 'Casco de obra', icon: '⛑️' }, gorra: { name: 'Gorra', icon: '🧢' }, boina: { name: 'Boina', icon: '🎨' },
  lazo: { name: 'Lazo', icon: '🎀' }, diadema: { name: 'Diadema', icon: '👧' }, flor: { name: 'Flor', icon: '🌸' }, cofia: { name: 'Cofia', icon: '🧹' },
  gato: { name: 'Orejas de gato', icon: '🐱' }, conejo: { name: 'Orejas de conejo', icon: '🐰' }, zorro: { name: 'Orejas de zorro', icon: '🦊' }, cuernos: { name: 'Cuernos', icon: '😈' },
  halo: { name: 'Halo', icon: '😇' }, corona: { name: 'Corona', icon: '👑' }, tiara: { name: 'Tiara', icon: '💎' }, bruja: { name: 'Sombrero de bruja', icon: '🧙' },
  gafas: { name: 'Gafas', icon: '👓' }, gafasol: { name: 'Gafas de sol', icon: '🕶️' }, auriculares: { name: 'Auriculares', icon: '🎧' }, pajita: { name: 'Sombrero de paja', icon: '👒' },
};
const NECKW = { ninguno: { name: 'Nada', icon: '➖' }, gargantilla: { name: 'Gargantilla', icon: '🖤' }, perlas: { name: 'Collar de perlas', icon: '📿' }, bufanda: { name: 'Bufanda', icon: '🧣' }, pajarita: { name: 'Lazo al cuello', icon: '🎀' }, cascabel: { name: 'Cascabel', icon: '🔔' } };
const BACKS = {
  ninguno: { name: 'Nada', icon: '➖' }, angel: { name: 'Alas de ángel', icon: '🪽' }, demonio: { name: 'Alas de demonio', icon: '🦇' }, hada: { name: 'Alas de hada', icon: '🧚' },
  colagato: { name: 'Cola de gato', icon: '🐈' }, colazorro: { name: 'Cola de zorro', icon: '🦊' }, pompon: { name: 'Cola de conejo', icon: '🐇' }, coladiablo: { name: 'Cola de diablilla', icon: '😈' },
  capa: { name: 'Capa', icon: '🦸' }, mochila: { name: 'Mochila', icon: '🎒' },
};
const HAIRS = [
  { id: 'largo', name: 'Largo' }, { id: 'hime', name: 'Princesa' }, { id: 'ondulado', name: 'Ondulado' }, { id: 'melena', name: 'Melena' },
  { id: 'coleta', name: 'Coleta' }, { id: 'coletas', name: 'Dos coletas' }, { id: 'mono', name: 'Moño' }, { id: 'monos', name: 'Dos moños' },
  { id: 'trenzas', name: 'Trenzas' }, { id: 'lateral', name: 'Coleta lateral' }, { id: 'rizado', name: 'Rizado' }, { id: 'corto', name: 'Corto' }, { id: 'pixie', name: 'Pixie' },
];
const asList = o => Object.keys(o).map(id => Object.assign({ id }, o[id]));
const CLOTHES = { top: asList(TOPS), bottom: asList(BOTS), shoes: asList(SHOES), socks: asList(SOCKS), gloves: asList(GLOVES), acc: asList(ACCS), neckw: asList(NECKW), back: asList(BACKS) };
const BODY_SLIDERS = [
  ['height', 'Altura'], ['weight', 'Corpulencia'], ['shoulders', 'Hombros'], ['bust', 'Pecho'], ['waist', 'Cintura'],
  ['hips', 'Caderas'], ['glutes', 'Glúteos'], ['arms', 'Brazos'], ['legs', 'Muslos'], ['legLen', 'Largo piernas'], ['head', 'Cabeza'], ['eyeSize', 'Tamaño de ojos'],
];
function defLook(g) {
  const b = { topP: 0, botP: 0, socks: 'ninguna', sockC: 12, gloves: 'ninguno', gloveC: 12, neckw: 'ninguno', neckC: 12, back: 'ninguno', backC: 9, eyeSize: .6 };
  if (g === 'm') return Object.assign(b, { gender: 'm', height: .6, weight: .6, shoulders: .7, bust: .4, waist: .55, hips: .35, glutes: .45, arms: .65, legs: .55, legLen: .5, head: .45, eyeSize: .35,
    skin: 2, hair: 'corto', hairC: 1, eyes: 0, lips: 3, top: 'camiseta', topC: 12, bottom: 'vaqueros', botC: 6, shoes: 'zapatillas', shoeC: 9, acc: 'casco', accC: 2 });
  return Object.assign(b, { gender: 'f', height: .5, weight: .62, shoulders: .42, bust: .72, waist: .34, hips: .78, glutes: .78, arms: .45, legs: .68, legLen: .6, head: .55,
    skin: 0, hair: 'coletas', hairC: 6, eyes: 1, lips: 2, top: 'crop', topC: 0, bottom: 'plisada', botC: 12, shoes: 'tacones', shoeC: 12, acc: 'gato', accC: 12, socks: 'muslo', sockC: 12, neckw: 'gargantilla' });
}
function fixLook(L) {
  const d = defLook(L.gender === 'm' ? 'm' : 'f');
  if (!TOPS[L.top]) L.top = { vestido: 'ajustado', mono: 'mono' }[L.top] || d.top;
  if (!BOTS[L.bottom]) L.bottom = d.bottom;
  if (!SHOES[L.shoes]) L.shoes = d.shoes;
  if (!SOCKS[L.socks]) L.socks = 'ninguna';
  if (!GLOVES[L.gloves]) L.gloves = 'ninguno';
  if (!ACCS[L.acc]) L.acc = L.acc === 'gafas' ? 'gafasol' : 'ninguno';
  if (!NECKW[L.neckw]) L.neckw = 'ninguno';
  if (!BACKS[L.back]) L.back = 'ninguno';
  if (!HAIRS.find(h => h.id === L.hair)) L.hair = L.hair === 'rapado' ? 'pixie' : d.hair;
  BODY_SLIDERS.forEach(([k]) => { if (typeof L[k] !== 'number') L[k] = d[k]; });
  return L;
}
const OUTFITS = [
  { name: 'Jefa de fábrica', icon: '👷', set: { top: 'crop', topC: 1, bottom: 'minishort', botC: 6, shoes: 'botas', shoeC: 13, socks: 'ninguna', acc: 'casco', gloves: 'cortos', gloveC: 2, neckw: 'ninguno', back: 'ninguno' } },
  { name: 'Colegiala', icon: '🎒', set: { top: 'marinera', topC: 9, bottom: 'plisada', botC: 6, shoes: 'bailarinas', shoeC: 12, socks: 'muslo', sockC: 9, acc: 'lazo', accC: 0, neckw: 'ninguno', back: 'mochila', backC: 0, gloves: 'ninguno' } },
  { name: 'Sirvienta', icon: '🧹', set: { top: 'maid', topC: 12, shoes: 'bailarinas', shoeC: 12, socks: 'muslo', sockC: 9, acc: 'cofia', accC: 9, neckw: 'pajarita', neckC: 0, back: 'ninguno', gloves: 'cortos', gloveC: 9 } },
  { name: 'Playa', icon: '🏖️', set: { top: 'bikini', topC: 0, bottom: 'bikini', botC: 0, shoes: 'sandalias', shoeC: 2, socks: 'ninguna', acc: 'pajita', accC: 14, neckw: 'ninguno', back: 'ninguno', gloves: 'ninguno' } },
  { name: 'Conejita', icon: '🐰', set: { top: 'conejita', topC: 12, shoes: 'tacones', shoeC: 12, socks: 'rejilla', sockC: 12, acc: 'conejo', accC: 12, neckw: 'pajarita', neckC: 12, back: 'pompon', backC: 9, gloves: 'munequeras', gloveC: 9 } },
  { name: 'Gatita', icon: '🐱', set: { top: 'bandeau', topC: 12, bottom: 'microshort', botC: 12, shoes: 'botasaltas', shoeC: 12, socks: 'muslo', sockC: 12, acc: 'gato', accC: 12, neckw: 'cascabel', neckC: 0, back: 'colagato', backC: 12, gloves: 'largos', gloveC: 12 } },
  { name: 'Diablilla', icon: '😈', set: { top: 'corse', topC: 15, bottom: 'microfalda', botC: 12, shoes: 'botasmuslo', shoeC: 12, socks: 'ninguna', acc: 'cuernos', accC: 15, neckw: 'gargantilla', neckC: 12, back: 'demonio', backC: 21, gloves: 'largos', gloveC: 12 } },
  { name: 'Ángel', icon: '😇', set: { top: 'coctel', topC: 9, shoes: 'sandalias', shoeC: 2, socks: 'ninguna', acc: 'halo', accC: 2, neckw: 'perlas', neckC: 9, back: 'angel', backC: 9, gloves: 'ninguno' } },
  { name: 'Guerrera', icon: '⚔️', set: { top: 'armadura', topC: 10, bottom: 'minifalda', botC: 15, shoes: 'botasaltas', shoeC: 13, socks: 'ninguna', acc: 'tiara', accC: 2, neckw: 'ninguno', back: 'capa', backC: 15, gloves: 'largos', gloveC: 13 } },
  { name: 'Hechicera', icon: '🧙', set: { top: 'noche', topC: 21, shoes: 'botasaltas', shoeC: 12, socks: 'ninguna', acc: 'bruja', accC: 21, neckw: 'gargantilla', neckC: 7, back: 'ninguno', gloves: 'largos', gloveC: 21 } },
  { name: 'Zorrita kitsune', icon: '🦊', set: { top: 'kimono', topC: 9, shoes: 'sandalias', shoeC: 15, socks: 'tobilleros', sockC: 9, acc: 'zorro', accC: 1, neckw: 'ninguno', back: 'colazorro', backC: 1, gloves: 'ninguno' } },
  { name: 'Deportista', icon: '🏃', set: { top: 'deportivo', topC: 16, bottom: 'ciclista', botC: 12, shoes: 'zapatillas', shoeC: 9, socks: 'tobilleros', sockC: 9, acc: 'auriculares', accC: 16, neckw: 'ninguno', back: 'ninguno', gloves: 'munequeras', gloveC: 16 } },
  { name: 'Gala', icon: '💃', set: { top: 'noche', topC: 15, shoes: 'tacones', shoeC: 2, socks: 'ninguna', acc: 'tiara', accC: 2, neckw: 'perlas', neckC: 9, back: 'ninguno', gloves: 'largos', gloveC: 15 } },
  { name: 'Princesa', icon: '👸', set: { top: 'princesa', topC: 16, shoes: 'tacones', shoeC: 9, socks: 'ninguna', acc: 'corona', accC: 2, neckw: 'perlas', neckC: 9, back: 'ninguno', gloves: 'largos', gloveC: 9 } },
  { name: 'Animadora', icon: '📣', set: { top: 'animadora', topC: 5, bottom: 'plisada', botC: 9, shoes: 'zapatillas', shoeC: 9, socks: 'altos', sockC: 9, acc: 'lazo', accC: 5, neckw: 'ninguno', back: 'ninguno', gloves: 'ninguno' } },
  { name: 'Ejecutiva', icon: '💼', set: { top: 'traje', topC: 12, bottom: 'tubo', botC: 12, shoes: 'tacones', shoeC: 12, socks: 'pantis', sockC: 12, acc: 'gafas', accC: 12, neckw: 'ninguno', back: 'ninguno', gloves: 'ninguno' } },
];
function applyOutfit(i) { const o = OUTFITS[i]; if (o) Object.assign(S.look, { topP: 0, botP: 0 }, o.set); }
function randomOutfit() {
  const L = S.look, rc = () => Math.floor(Math.random() * CLOTHC.length);
  ['top', 'bottom', 'shoes', 'socks', 'acc', 'back', 'neckw', 'gloves'].forEach(cat => { L[cat] = pick(CLOTHES[cat]).id; });
  L.topC = rc(); L.botC = rc(); L.shoeC = rc(); L.sockC = rc(); L.accC = rc(); L.backC = rc(); L.neckC = rc(); L.gloveC = rc();
  L.topP = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * PATTERNS.length); L.botP = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * PATTERNS.length);
  if (L.gender === 'm') { L.back = 'ninguno'; L.socks = 'ninguna'; }
}

// ----- física: muelles amortiguados para pecho, glúteos, pelo y falda -----
function jigStep(j, dt, moving, phase, vx, kick) {
  if (!OPT.phys) { j.b = j.g = j.h = j.s = 0; j.bv = j.gv = j.hv = j.sv = 0; return; }
  const step = Math.floor(phase / Math.PI);
  if (moving && step !== j.step) { j.bv += 15; j.gv += 12; j.sv += (step % 2 ? 6 : -6); j.hv += (step % 2 ? 5 : -5); }
  j.step = step;
  if (kick) { j.bv += kick; j.gv += kick * 0.8; }
  const sub = Math.min(dt, 0.05);
  j.bv += (-190 * j.b - 8 * j.bv) * sub; j.b = clamp(j.b + j.bv * sub, -2.5, 2.5);
  j.gv += (-160 * j.g - 7.5 * j.gv) * sub; j.g = clamp(j.g + j.gv * sub, -2.5, 2.5);
  j.hv += (-55 * j.h - 6 * j.hv) * sub; j.h = clamp(j.h + j.hv * sub, -6, 6);
  j.sv += (-90 * j.s - 7 * j.sv) * sub; j.s = clamp(j.s + j.sv * sub, -4, 4);
}

// ----- materiales estilo "toon" -----
let _grad = null;
function toonGrad() {
  if (_grad) return _grad;
  const d = new Uint8Array([188, 178, 190, 255, 236, 230, 236, 255, 255, 255, 255, 255]);
  _grad = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); _grad.minFilter = _grad.magFilter = THREE.NearestFilter; _grad.needsUpdate = true;
  return _grad;
}
const _toonCache = {};
function toon(color, extra) {
  const k = color + (extra ? JSON.stringify(extra) : '');
  if (!_toonCache[k]) _toonCache[k] = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: toonGrad() }, extra || {}));
  return _toonCache[k];
}
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = k => Math.round(((pa >> k) & 255) * (1 - t) + ((pb >> k) & 255) * t);
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}
function clothFill(c, color, pat) {
  if (!pat) return color;
  const p = document.createElement('canvas'); p.width = p.height = 32; const x = p.getContext('2d');
  const dk = mixHex(color, '#000000', 0.3), lt = mixHex(color, '#ffffff', 0.55);
  x.fillStyle = color; x.fillRect(0, 0, 32, 32);
  if (pat === 1) { x.fillStyle = lt; x.fillRect(0, 0, 32, 8); x.fillRect(0, 16, 32, 8); }
  else if (pat === 2) { x.fillStyle = lt; [[8, 8], [24, 24]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 4.5, 0, 7); x.fill(); }); }
  else if (pat === 3) { x.fillStyle = dk; x.globalAlpha = 0.5; x.fillRect(0, 0, 32, 8); x.fillRect(0, 0, 8, 32); x.globalAlpha = 1; x.fillStyle = lt; x.fillRect(0, 20, 32, 2); x.fillRect(20, 0, 2, 32); }
  else if (pat === 4) { const g = c.createLinearGradient(0, 0, 0, c.canvas.height); g.addColorStop(0, lt); g.addColorStop(1, dk); return g; }
  else if (pat === 5) { x.fillStyle = lt; x.font = '16px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('♥', 8, 9); x.fillText('♥', 24, 25); }
  return c.createPattern(p, 'repeat');
}
function canvasTex(w, h, fn) {
  const cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; fn(cv2.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv2); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t;
}
// textura de bandas verticales para brazos y piernas: [desde, hasta, color] con v=0 abajo
function bandTex(base, bands, deco) {
  return canvasTex(32, 128, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    bands.forEach(([a, b, col, alpha]) => { if (b <= a) return; c.globalAlpha = alpha || 1; c.fillStyle = col; c.fillRect(0, h * (1 - b), w, h * (b - a)); c.globalAlpha = 1; });
    if (deco) deco(c, w, h);
  });
}

class Char3D {
  constructor() {
    this.root = new THREE.Group(); this.key = ''; this.owned = []; this.amp = 0; this.t = Math.random() * 10;
    this.blinkT = 2 + Math.random() * 3; this.blink = 0;
  }
  dispose() { this.owned.forEach(o => o.dispose && o.dispose()); this.owned = []; while (this.root.children.length) this.root.remove(this.root.children[0]); }
  own(o) { this.owned.push(o); return o; }
  mesh(geo, mat, parent, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(this.own(geo), mat); m.position.set(x, y, z); m.castShadow = true; (parent || this.root).add(m); return m; }
  tmat(tex, extra) { return this.own(new THREE.MeshToonMaterial(Object.assign({ map: this.own(tex), gradientMap: toonGrad() }, extra || {}))); }

  setLook(L) {
    const key = JSON.stringify(L);
    if (key === this.key) return;
    this.key = key; this.dispose(); this.build(L);
  }

  build(L) {
    const f = L.gender !== 'm';
    const top = TOPS[L.top] || TOPS.camiseta, hasBot = !(top.skirt || top.leo || top.pants);
    const bot = hasBot ? (BOTS[L.bottom] || BOTS.vaqueros) : null;
    const shoe = SHOES[L.shoes] || SHOES.zapatillas, sock = SOCKS[L.socks] || SOCKS.ninguna, glove = GLOVES[L.gloves] || GLOVES.ninguno;
    const skin = SKINS[L.skin] || SKINS[0], skinM = toon(skin);
    const topC = CLOTHC[L.topC] || '#e8365d', botC = top.pants ? topC : (CLOTHC[L.botC] || '#2b3a8a');
    const shoeC = CLOTHC[L.shoeC] || '#1a1a1f', sockC = CLOTHC[L.sockC] || '#1a1a1f', gloveC = CLOTHC[L.gloveC] || '#1a1a1f';
    const hairC = HAIRC[L.hairC] || HAIRC[1], hairM = toon(hairC), accC = CLOTHC[L.accC] || '#ffd84a';
    const wf = 0.86 + 0.42 * L.weight;
    // --- medidas (metros aprox.) ---
    const legF = 0.9 + 0.22 * L.legLen, hipY = 0.8 * legF, kneeY = hipY * 0.5;
    const TH = 0.6;                                   // altura del torso (entrepierna → base del cuello)
    const y0 = hipY - 0.03, vy = v => y0 + v * TH;
    const hipR = (f ? 0.165 : 0.15) * (0.8 + 0.42 * L.hips) * Math.pow(wf, 0.8);
    const waistR = (f ? 0.1 : 0.135) * (0.78 + 0.5 * L.waist) * wf;
    const chestR = (f ? 0.125 : 0.165) * (0.9 + 0.2 * L.shoulders) * Math.pow(wf, 0.6);
    const shW = (f ? 0.165 : 0.21) * (0.85 + 0.32 * L.shoulders) * Math.pow(wf, 0.35);
    const DZ = 0.74;
    const prof = [[0, hipR * 0.55], [0.08, hipR * 0.9], [V_HIP, hipR], [V_WAIST, waistR], [V_UNDER, chestR * 0.9], [0.7, chestR], [0.86, shW * 0.82], [0.94, shW * 0.5], [1, 0.05]];
    const rAt = v => { for (let i = 1; i < prof.length; i++) if (v <= prof[i][0]) { const [a, ra] = prof[i - 1], [b, rb] = prof[i]; let t = (v - a) / (b - a); t = t * t * (3 - 2 * t); return ra + (rb - ra) * t; } return 0.05; };
    const thighR = (f ? 0.082 : 0.074) * (0.8 + 0.5 * L.legs) * Math.pow(wf, 0.8), kneeR = thighR * 0.62, ankleR = 0.034;
    const armR = (f ? 0.043 : 0.055) * (0.8 + 0.5 * L.arms) * Math.pow(wf, 0.6);
    const headR = 0.15 * (0.9 + 0.25 * L.head);
    const heel = shoe.heel || 0;
    this.d = { hipY, heel, f, bust: L.bust, glutes: L.glutes === undefined ? 0.5 : L.glutes };
    this.scaleH = 0.9 + 0.2 * L.height;

    const body = this.body = new THREE.Group(); this.root.add(body);
    const torso = this.torso = new THREE.Group(); torso.position.y = hipY; body.add(torso);   // pivota en la cadera
    const T = (y) => y - hipY;                        // a coordenadas del grupo torso

    // --- torso: superficie de revolución con la ropa pintada ---
    const pts = []; const N = 26;
    for (let i = 0; i <= N; i++) { const v = i / N; pts.push(new THREE.Vector2(rAt(v), vy(v))); }
    const tg = new THREE.LatheGeometry(pts, 28, Math.PI, Math.PI * 2);
    const tm = this.mesh(tg, this.tmat(this.torsoTex(L, top, bot, skin, topC, botC, f)), torso, 0, -hipY, 0);
    tm.scale.z = DZ;
    // cuello y hombros
    const neckR = f ? 0.036 : 0.052, neckY = vy(1), headY = neckY + 0.025 + headR * 0.9;
    this.mesh(new THREE.CylinderGeometry(neckR, neckR * 1.15, 0.1, 12), top.neck === 'high' ? toon(topC) : skinM, torso, 0, T(neckY + 0.03), 0);
    const shCov = (top.straps === undefined || top.straps === 0) && !top.offsh;
    const shY = vy(0.9);
    [-1, 1].forEach(s => this.mesh(new THREE.SphereGeometry(armR * 1.08, 12, 10), shCov ? toon(topC) : skinM, torso, s * shW * 0.95, T(shY), 0));
    // --- pecho (con física) ---
    this.breasts = [];
    if (f) {
      const br = (0.04 + 0.052 * L.bust) * Math.pow(wf, 0.3), bx = Math.max(br * 0.74, chestR * 0.4), by = vy(0.68) - br * 0.25, bz = chestR * DZ * 0.5 + br * 0.3;
      const cup = top.cup === undefined ? 1 : top.cup;
      const btex = () => canvasTex(64, 64, (c, w, h) => {
        c.fillStyle = skin; c.fillRect(0, 0, w, h);
        c.fillStyle = clothFill(c, top.metal ? '#c9ced6' : topC, L.topP); c.fillRect(0, h * (1 - cup), w, h * cup);
        if (top.tri) { c.fillStyle = skin; c.beginPath(); c.moveTo(0, h * (1 - cup)); c.lineTo(w * 0.25, h * (1 - cup) - 1); c.lineTo(0, h * 0.75); c.fill(); c.beginPath(); c.moveTo(w * 0.5, h * (1 - cup)); c.lineTo(w * 0.25, h * (1 - cup) - 1); c.lineTo(w * 0.5, h * 0.75); c.fill(); c.fillRect(w * 0.5, 0, w * 0.5, h); c.fillStyle = topC; c.fillRect(0, h * 0.5, w, 2); }
        if (cup < 1 && !top.tri) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, h * (1 - cup), w, 2); }
        if (top.lace || top.sparkle) { c.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 14; i++) c.fillRect((i * 37) % w, h * (1 - cup) + ((i * 23) % (h * cup)), 2, 2); }
      });
      [-1, 1].forEach(s => {
        const m = this.mesh(new THREE.SphereGeometry(br, 18, 14), this.tmat(btex()), torso, s * bx, T(by), bz);
        m.scale.set(1, 0.96, 1); m.rotation.x = -0.25; m.userData.y0 = T(by); this.breasts.push(m);
      });
    }
    // --- glúteos ---
    this.glutes = [];
    {
      const gl = this.d.glutes, gR = (f ? 0.074 : 0.062) * (0.72 + 0.62 * gl) * Math.pow(wf, 0.6), gy = vy(0.13), gz = -(hipR * DZ * 0.44);
      const cov = top.leo || top.pants || top.skirt || (bot && true);
      const gcol = top.leo || top.pants || top.skirt ? topC : botC;
      const gtex = () => canvasTex(64, 64, (c, w, h) => {
        c.fillStyle = skin; c.fillRect(0, 0, w, h);
        if (!cov) return;
        const cut = (bot && bot.cut) || top.leo;
        c.fillStyle = clothFill(c, gcol, top.leo || top.pants || top.skirt ? L.topP : L.botP);
        c.fillRect(0, 0, w, h);
        if (cut) { c.fillStyle = skin; c.fillRect(0, h * 0.78, w, h); }
      });
      [-1, 1].forEach(s => {
        const m = this.mesh(new THREE.SphereGeometry(gR, 16, 12), this.tmat(gtex()), torso, s * gR * 0.74, T(gy), gz);
        m.scale.set(1, 1.02, 0.92); m.rotation.y = Math.PI / 2; m.userData.y0 = T(gy); this.glutes.push(m);
      });
    }
    // --- falda / vestido ---
    this.skirt = null;
    const sk = top.skirt ? top : (bot && bot.skirt ? bot : null);
    if (sk) {
      const vT = top.skirt ? V_WAIST - 0.02 : bot.rise, yT = vy(vT), len = Math.max(0.05, sk.skirt * hipY + (yT - hipY));
      const rT = rAt(vT) * 1.04, rB = Math.max(hipR * 1.14, hipR * (sk.flare || 1.1) * (0.8 + 0.5 * Math.min(1, sk.skirt * 2.5)));
      const col = top.skirt ? topC : botC, pat = top.skirt ? L.topP : L.botP;
      const tex = canvasTex(256, 64, (c, w, h) => {
        c.fillStyle = clothFill(c, col, pat); c.fillRect(0, 0, w, h);
        if (sk.pleats) { for (let i = 0; i < 24; i++) { c.fillStyle = i % 2 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.08)'; c.fillRect(i * w / 24, 0, w / 24, h); } }
        c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, h - 4, w, 4);
        if (top.apron) { c.fillStyle = '#fff'; c.fillRect(w * 0.36, 0, w * 0.28, h * 0.8); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(w * 0.36, h * 0.72, w * 0.28, 3); c.fillStyle = '#fff'; c.fillRect(0, h - 7, w, 3); }
        if (sk.trim || sk.lace) { c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(0, h - 8, w, 3); }
        if (sk.sash) { c.fillStyle = mixHex(col, '#000000', 0.35); c.fillRect(0, 0, w, 10); }
      });
      // perfil: cintura → cadera (cubre los glúteos) → bajo
      const dHip = yT - vy(V_HIP - 0.08), rHip = hipR * 1.12, sp = [new THREE.Vector2(rB, -len)];
      if (len > dHip * 1.15) sp.push(new THREE.Vector2(Math.min(rB, rHip + (rB - rHip) * 0.25), -dHip * 1.6 > -len ? -dHip * 1.6 : -len * 0.9), new THREE.Vector2(rHip, -dHip));
      sp.push(new THREE.Vector2(rT + (rHip - rT) * 0.55, -Math.min(len, dHip) * 0.45), new THREE.Vector2(rT, 0));
      const g = new THREE.LatheGeometry(sp, 28, Math.PI, Math.PI * 2);
      const piv = new THREE.Group(); piv.position.y = T(yT); torso.add(piv);
      const m = this.mesh(g, this.tmat(tex, { side: THREE.DoubleSide }), piv, 0, 0, 0); m.scale.z = 0.94;
      this.skirt = piv; this.glutes.forEach(q => { q.visible = sk.skirt < 0.2; q.scale.multiplyScalar(0.9); });
    }
    // --- brazos ---
    const upL = 0.25, foL = 0.23;
    const slv = top.sleeve || 0, gh = glove.h || 0;
    const upB = []; if (gh > 1) upB.push([0, (gh - 1) * 0.9, gloveC]); if (slv > 0) upB.push([top.offsh ? 0 : 1 - Math.min(1, slv * 2), top.offsh ? 0.82 : 1, topC]);
    const upTex = bandTex(skin, upB);
    const foTex = bandTex(skin, [[0, glove.band ? 0 : Math.min(1, gh), gloveC], [glove.band ? 0.02 : 0, glove.band ? 0.3 : 0, gloveC], [slv > 0.5 ? 0 : 1, 1, topC]]);
    const upM = this.tmat(upTex), foM = this.tmat(foTex), handM = gh > 0 && !glove.band ? toon(gloveC) : skinM;
    this.arms = [];
    [-1, 1].forEach(s => {
      const sh = new THREE.Group(); sh.position.set(s * shW * 0.95, T(shY), 0); torso.add(sh);
      this.mesh(new THREE.CylinderGeometry(armR * 1.08, armR * 0.9, upL, 10), upM, sh, 0, -upL / 2, 0);
      const el = new THREE.Group(); el.position.y = -upL; sh.add(el);
      this.mesh(new THREE.SphereGeometry(armR * 0.92, 8, 8), slv > 0.5 ? toon(topC) : gh > 1 ? toon(gloveC) : skinM, el);
      this.mesh(new THREE.CylinderGeometry(armR * 0.9, armR * 0.68, foL, 10), foM, el, 0, -foL / 2, 0);
      const hand = this.mesh(new THREE.SphereGeometry(armR * 0.95, 10, 8), handM, el, 0, -foL - armR * 0.5, 0); hand.scale.set(0.85, 1.25, 1);
      if (top.pauldron) { const p = this.mesh(new THREE.SphereGeometry(armR * 1.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon('#c9ced6'), sh, s * 0.01, 0.005, 0); p.rotation.z = -s * 0.5; }
      this.arms.push({ sh, el, s });
    });
    // --- piernas ---
    const legs = bot ? (bot.legs || 0) : top.pants ? 1 : 0;
    const loose = (bot && bot.loose) || (top.pants ? 1.15 : 1), bell = (bot && bot.bell) || 1;
    const thL = hipY - kneeY, caL = kneeY - 0.07;
    const sH = sock.h || 0, bootH = shoe.boot || 0;
    const sockCol = sock.sheer ? mixHex(skin, sockC, 0.55) : sockC;
    const sockDeco = (c, w, h, a, b) => {
      if (sock.net) { c.strokeStyle = sockC; c.lineWidth = 1.2; for (let i = -h; i < h * 2; i += 9) { c.beginPath(); c.moveTo(0, i); c.lineTo(w, i + w); c.moveTo(w, i); c.lineTo(0, i + w); c.stroke(); } }
      if (sock.striped) { c.fillStyle = '#fff'; for (let y = h * (1 - b); y < h * (1 - a); y += 16) c.fillRect(0, y, w, 8); }
    };
    const legPants = clamp(legs * 2, 0, 1), calfPants = clamp(legs * 2 - 1, 0, 1), pcol = top.pants ? topC : botC;
    const thTex = bandTex(skin, sock.net ? [] : [[0, clamp(sH - 1, 0, 1), sockCol]], (c, w, h) => {
      const a = 0, b = clamp(sH - 1, 0, 1);
      if (sock.net && sH > 1) { c.save(); c.beginPath(); c.rect(0, h * (1 - b), w, h * b); c.clip(); sockDeco(c, w, h, a, b); c.restore(); } else if (sH > 1) sockDeco(c, w, h, a, b);
      if (sH > 1 && sH < 2 && !sock.net) { c.fillStyle = mixHex(sockCol, '#000000', 0.3); c.fillRect(0, h * (1 - b), w, 5); }
      if (bootH > 1) { c.fillStyle = shoeC; c.fillRect(0, h * (1 - (bootH - 1)), w, h); }
      if (legPants > 0) { c.fillStyle = clothFill(c, pcol, top.pants ? L.topP : L.botP); c.fillRect(0, 0, w, h * legPants); if (legPants < 1) { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, h * legPants - 3, w, 3); } }
      if (bot && bot.stripe) { c.fillStyle = '#fff'; c.fillRect(w * 0.72, 0, 3, h * legPants); }
    });
    const caTex = bandTex(skin, sock.net ? [] : [[0, clamp(sH, 0, 1), sockCol]], (c, w, h) => {
      const b = clamp(sH, 0, 1);
      if (sock.net && sH > 0) sockDeco(c, w, h, 0, 1); else if (sH > 0) sockDeco(c, w, h, 0, b);
      if (sock.warm) { c.fillStyle = 'rgba(0,0,0,.15)'; for (let y = h * (1 - b); y < h; y += 8) c.fillRect(0, y, w, 2); }
      if (bootH > 0) { c.fillStyle = shoeC; c.fillRect(0, h * (1 - Math.min(1, bootH)), w, h); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(0, h * (1 - Math.min(1, bootH)), w, 3); }
      if (calfPants > 0) { c.fillStyle = clothFill(c, pcol, top.pants ? L.topP : L.botP); c.fillRect(0, 0, w, h * calfPants); if (bot && bot.stripe) { c.fillStyle = '#fff'; c.fillRect(w * 0.72, 0, 3, h * calfPants); } }
    });
    const thM = this.tmat(thTex), caM = this.tmat(caTex);
    const lz = legPants >= 1 ? loose : 1, cz = calfPants >= 1 ? loose : 1;
    const hipX = Math.max(thighR * 0.95, hipR - thighR * 1.0);
    const jointCol = legPants > 0 ? toon(pcol) : skinM;
    const kneeM = calfPants > 0 ? toon(pcol) : bootH > 1 ? toon(shoeC) : sH > 1 ? toon(sockCol) : skinM;
    this.legs = [];
    [-1, 1].forEach(s => {
      const hip = new THREE.Group(); hip.position.set(s * hipX, hipY, 0); body.add(hip);
      this.mesh(new THREE.SphereGeometry(thighR * lz, 12, 10), jointCol, hip);
      this.mesh(new THREE.CylinderGeometry(thighR * lz, kneeR * 1.05 * lz, thL, 14), thM, hip, 0, -thL / 2, 0);
      const kn = new THREE.Group(); kn.position.y = -thL; hip.add(kn);
      this.mesh(new THREE.SphereGeometry(kneeR * 1.03 * Math.max(lz, cz > 1 ? cz : 1), 10, 8), kneeM, kn);
      const calf = new THREE.LatheGeometry([[kneeR * cz, 0], [kneeR * 1.12 * cz, -caL * 0.3], [kneeR * 0.85 * cz * (bell > 1 ? 1.1 : 1), -caL * 0.65], [ankleR * (calfPants >= 1 ? Math.max(cz * 1.5, bell * 1.6) : 1), -caL]].map(p => new THREE.Vector2(p[0], p[1])).reverse(), 14);
      // el torno recorre de abajo arriba: la textura queda con v=0 en el tobillo
      this.mesh(calf, caM, kn);
      // pie y calzado
      const ft = new THREE.Group(); ft.position.y = -caL; kn.add(ft);
      const bare = L.shoes === 'descalzo', sc = toon(shoeC);
      const footM = bare ? (sH > 0 ? toon(sockCol) : skinM) : sc;
      const foot = this.mesh(new THREE.SphereGeometry(0.045, 12, 8), L.shoes === 'sandalias' ? (sH > 0 ? toon(sockCol) : skinM) : footM, ft, 0, -0.03, 0.04);
      foot.scale.set(0.95, 0.62, 2.1);
      if (heel) { ft.rotation.x = 0.32; this.mesh(new THREE.CylinderGeometry(0.01, 0.007, heel + 0.03, 6), sc, ft, 0, -0.045 - heel * 0.3, -0.035).rotation.x = -0.32; }
      if (shoe.plat) { const pl = this.mesh(new THREE.BoxGeometry(0.075, 0.035, 0.13), sc, ft, 0, -0.07, 0.07); pl.rotation.x = -0.32; }
      if (L.shoes === 'sandalias') { this.mesh(new THREE.BoxGeometry(0.085, 0.012, 0.2), sc, ft, 0, -0.058, 0.04); this.mesh(new THREE.TorusGeometry(0.04, 0.007, 6, 12, Math.PI), sc, ft, 0, -0.04, 0.07); }
      if (L.shoes === 'zapatillas') this.mesh(new THREE.BoxGeometry(0.088, 0.02, 0.205), toon('#f4f4f4'), ft, 0, -0.058, 0.04);
      if (bootH > 0 && bootH <= 0.5) this.mesh(new THREE.CylinderGeometry(ankleR * 1.5, ankleR * 1.4, 0.07, 10), sc, ft, 0, 0.03, 0);
      this.legs.push({ hip, kn, s });
    });
    // --- cabeza ---
    const head = this.head = new THREE.Group(); head.position.y = T(headY); torso.add(head);
    this.faceOpen = this.own(this.faceTex(L, f, skin, false)); this.faceShut = this.own(this.faceTex(L, f, skin, true));
    this.faceM = this.own(new THREE.MeshToonMaterial({ map: this.faceOpen, gradientMap: toonGrad() }));
    const hm = this.mesh(new THREE.SphereGeometry(headR, 28, 20), this.faceM, head); hm.rotation.y = -Math.PI / 2; hm.scale.set(0.98, 1.06, 0.97);
    // orejas
    [-1, 1].forEach(s => { const e = this.mesh(new THREE.SphereGeometry(headR * 0.2, 8, 6), skinM, head, s * headR * 0.95, -headR * 0.08, 0); e.scale.set(0.5, 1, 0.8); });
    this.sway = [];
    this.buildHair(L, head, headR, hairM, hairC, f, accC);
    this.buildAcc(L, head, headR, accC, hairM);
    this.buildExtras(L, torso, T, vy, { neckY, neckR, chestR, hipR, DZ, shW, waistR, rAt }, f);
    this.root.scale.setScalar(1);
  }

  // ----- ropa pintada sobre el torso (u: 0.5 = delante; v: 0 entrepierna, 1 cuello) -----
  torsoTex(L, top, bot, skin, topC, botC, f) {
    return canvasTex(256, 256, (c, w, h) => {
      const Y = v => h * (1 - v), fx = w / 2;
      c.fillStyle = skin; c.fillRect(0, 0, w, h);
      // detalles de la piel
      c.fillStyle = 'rgba(120,60,40,.28)'; c.beginPath(); c.ellipse(fx, Y(0.36), 2.2, 3.4, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(120,60,40,.16)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fx - 30, Y(0.93)); c.quadraticCurveTo(fx - 12, Y(0.9), fx - 3, Y(0.92)); c.moveTo(fx + 30, Y(0.93)); c.quadraticCurveTo(fx + 12, Y(0.9), fx + 3, Y(0.92)); c.stroke();
      if (!f) { c.beginPath(); c.moveTo(fx - 26, Y(0.66)); c.quadraticCurveTo(fx - 12, Y(0.62), fx, Y(0.66)); c.quadraticCurveTo(fx + 12, Y(0.62), fx + 26, Y(0.66)); c.stroke(); }
      c.beginPath(); c.moveTo(0, Y(0.9)); c.lineTo(0, Y(0.42)); c.moveTo(w, Y(0.9)); c.lineTo(w, Y(0.42)); c.stroke();
      const carveSides = (x, lo, hi) => { [w * 0.25, w * 0.75].forEach(sx => { x.beginPath(); x.moveTo(sx - 52, Y(lo)); x.quadraticCurveTo(sx, Y(hi) - 6, sx + 52, Y(lo)); x.closePath(); x.fill(); }); };
      // --- parte de abajo ---
      if (bot) {
        const L2 = document.createElement('canvas'); L2.width = w; L2.height = h; const x = L2.getContext('2d');
        x.fillStyle = clothFill(x, botC, L.botP); x.fillRect(0, Y(bot.rise), w, h);
        x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(0, Y(bot.rise), w, 4);
        if (bot.legs >= 0.3 && !bot.skirt) { x.fillRect(fx - 1, Y(bot.rise), 2, 30); x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(fx, Y(bot.rise) + 8, 2.5, 0, 7); x.fill(); }
        if (bot.cut) { x.globalCompositeOperation = 'destination-out'; carveSides(x, 0, bot.rise - 0.02); x.globalCompositeOperation = 'source-over'; }
        c.drawImage(L2, 0, 0);
      }
      // --- parte de arriba ---
      const L1 = document.createElement('canvas'); L1.width = w; L1.height = h; const x = L1.getContext('2d');
      const fillC = clothFill(x, top.metal ? '#c9ced6' : topC, L.topP), dark = mixHex(topC, '#000000', 0.3), light = mixHex(topC, '#ffffff', 0.5);
      const st = top.straps === undefined ? 0 : top.straps, hi = top.hi, lo = top.lo;
      const bodyHi = st ? Math.min(hi, V_OVER) : hi;
      x.fillStyle = fillC; x.fillRect(0, Y(bodyHi), w, Y(lo) - Y(bodyHi));
      if (st === 1 || st === 2) { const sw = st === 2 ? 16 : 7; [fx - 36, fx + 36, 30, w - 30].forEach(sx => x.fillRect(sx - sw / 2, 0, sw, Y(bodyHi) + 2)); }
      if (st === 'halter') { x.lineWidth = 9; x.strokeStyle = fillC; x.beginPath(); x.moveTo(fx - 34, Y(bodyHi) + 2); x.lineTo(fx - 8, 0); x.moveTo(fx + 34, Y(bodyHi) + 2); x.lineTo(fx + 8, 0); x.stroke(); x.fillRect(0, 0, 40, 5); x.fillRect(w - 40, 0, 40, 5); }
      x.globalCompositeOperation = 'destination-out';
      if (top.neck === 'crew') { x.beginPath(); x.ellipse(fx, 0, 20, 12, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(0, 0, 16, 6, 0, 0, 7); x.ellipse(w, 0, 16, 6, 0, 0, 7); x.fill(); }
      if (top.neck === 'scoop') { x.beginPath(); x.ellipse(fx, Y(bodyHi) - 4, 28, 22, 0, 0, 7); x.fill(); }
      if (top.neck === 'v') { x.beginPath(); x.moveTo(fx - 26, 0); x.lineTo(fx, Y(0.7)); x.lineTo(fx + 26, 0); x.fill(); }
      if (top.neck === 'deep') { x.beginPath(); x.moveTo(fx - 30, 0); x.lineTo(fx - 26, Y(bodyHi)); x.lineTo(fx, Y(Math.max(lo + 0.04, 0.5))); x.lineTo(fx + 26, Y(bodyHi)); x.lineTo(fx + 30, 0); x.fill(); }
      if (top.neck === 'square') { x.fillRect(fx - 26, 0, 52, Y(0.8)); }
      if (top.neck === 'open' || top.neck === 'suit') { x.beginPath(); x.moveTo(fx - 26, 0); x.lineTo(fx - 12, Y(lo)); x.lineTo(fx + 12, Y(lo)); x.lineTo(fx + 26, 0); x.fill(); }
      if (top.back === 'open') { x.fillRect(0, Y(bodyHi) - 2, 50, Y(V_WAIST + 0.04) - Y(bodyHi)); x.fillRect(w - 50, Y(bodyHi) - 2, 50, Y(V_WAIST + 0.04) - Y(bodyHi)); }
      if (top.back === 'string') { x.fillRect(0, Y(bodyHi) - 2, 70, Y(lo) - Y(bodyHi) - 4); x.fillRect(w - 70, Y(bodyHi) - 2, 70, Y(lo) - Y(bodyHi) - 4); }
      if (top.leo) carveSides(x, 0, top.neck === 'none' ? 0.3 : 0.26);
      x.globalCompositeOperation = 'source-over';
      // adornos
      if (top.neck === 'open') { x.fillStyle = '#1a1a1f'; x.globalCompositeOperation = 'destination-over'; x.fillRect(fx - 30, Y(0.78), 60, Y(0.56) - Y(0.78)); x.globalCompositeOperation = 'source-over'; }
      if (top.neck === 'suit') { x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#fff'; x.fillRect(fx - 30, 0, 60, Y(lo)); x.globalCompositeOperation = 'source-over'; x.fillStyle = '#b0102a'; x.beginPath(); x.moveTo(fx - 4, 8); x.lineTo(fx + 4, 8); x.lineTo(fx + 6, Y(0.62)); x.lineTo(fx, Y(0.56)); x.lineTo(fx - 6, Y(0.62)); x.fill(); x.fillStyle = dark; x.beginPath(); x.moveTo(fx - 26, 0); x.lineTo(fx - 34, Y(0.74)); x.lineTo(fx - 12, Y(0.6)); x.fill(); x.beginPath(); x.moveTo(fx + 26, 0); x.lineTo(fx + 34, Y(0.74)); x.lineTo(fx + 12, Y(0.6)); x.fill(); }
      if (top.buttons) { x.fillStyle = 'rgba(255,255,255,.85)'; for (let v = lo + 0.05; v < 0.72; v += 0.08) { x.beginPath(); x.arc(fx, Y(v), 2.4, 0, 7); x.fill(); } x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(fx - 0.5, Y(0.72), 1, Y(lo) - Y(0.72)); }
      if (top.collar) { x.fillStyle = light; [-1, 1].forEach(s => { x.beginPath(); x.moveTo(fx + s * 8, 2); x.lineTo(fx + s * 36, 4); x.lineTo(fx + s * 26, 26); x.closePath(); x.fill(); }); }
      if (top.sailor) { x.fillStyle = '#2b3a8a'; [-1, 1].forEach(s => { x.beginPath(); x.moveTo(fx + s * 4, Y(0.7)); x.lineTo(fx + s * 28, 0); x.lineTo(fx + s * 50, 0); x.lineTo(fx + s * 44, 34); x.closePath(); x.fill(); }); x.fillRect(0, 0, 46, 34); x.fillRect(w - 46, 0, 46, 34); x.fillStyle = '#fff'; x.fillRect(0, 28, 46, 3); x.fillRect(w - 46, 28, 46, 3); x.fillStyle = '#e8365d'; x.beginPath(); x.moveTo(fx, Y(0.7) - 4); x.lineTo(fx - 12, Y(0.6)); x.lineTo(fx + 12, Y(0.6)); x.fill(); }
      if (top.pocket) { x.fillStyle = 'rgba(0,0,0,.16)'; rr(x, fx - 34, Y(0.34), 68, 26, 6); x.fill(); }
      if (top.stripe) { x.fillStyle = '#fff'; x.fillRect(0, Y(lo) - 10, w, 5); x.fillRect(0, Y(0.74), w, 4); }
      if (top.lace) { x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.5; for (let v = lo + 0.03; v < 0.56; v += 0.06) { x.beginPath(); x.moveTo(fx - 7, Y(v)); x.lineTo(fx + 7, Y(v + 0.05)); x.moveTo(fx + 7, Y(v)); x.lineTo(fx - 7, Y(v + 0.05)); x.stroke(); } }
      if (top.apron) { x.fillStyle = '#fff'; rr(x, fx - 34, Y(0.62), 68, Y(lo) - Y(0.62) + 4, 8); x.fill(); x.fillRect(0, Y(V_WAIST) - 4, w, 8); }
      if (top.sash) { x.fillStyle = dark; x.fillRect(0, Y(V_WAIST + 0.08), w, Y(V_WAIST - 0.04) - Y(V_WAIST + 0.08)); x.strokeStyle = light; x.lineWidth = 4; x.beginPath(); x.moveTo(fx - 28, 0); x.lineTo(fx + 6, Y(0.5)); x.stroke(); }
      if (top.trim) { x.strokeStyle = '#ffd84a'; x.lineWidth = 3; x.beginPath(); x.moveTo(fx - 6, 4); x.quadraticCurveTo(fx + 30, Y(0.8), fx + 60, Y(0.62)); x.stroke(); for (let k = 0; k < 3; k++) { x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(fx + 14 + k * 14, Y(0.84 - k * 0.06), 3, 0, 7); x.fill(); } }
      if (top.sparkle) { x.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 90; i++) x.fillRect((i * 53) % w, Y(bodyHi) + ((i * 29) % Math.max(1, Y(lo) - Y(bodyHi))), 2, 2); }
      if (top.metal) { x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(0, Y(bodyHi), w, 3); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, Y(lo) - 3, w, 3); x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(fx, Y((lo + bodyHi) / 2), 5, 0, 7); x.fill(); }
      if (lo > 0.02 && !top.skirt) { x.fillStyle = 'rgba(0,0,0,.16)'; x.fillRect(0, Y(lo) - 3, w, 3); }
      if (top.pants) { x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(0, Y(V_WAIST) - 3, w, 6); x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(fx, Y(V_WAIST), 4, 0, 7); x.fill(); }
      c.drawImage(L1, 0, 0);
    });
  }

  // ----- cara anime pintada sobre la esfera de la cabeza (u = 0.5 delante) -----
  faceTex(L, f, skin, shut) {
    return canvasTex(512, 256, (c, w, h) => {
      c.fillStyle = skin; c.fillRect(0, 0, w, h);
      const cx = w / 2, ey = h * 0.535, es = (f ? 0.8 : 0.62) + 0.5 * (L.eyeSize === undefined ? 0.5 : L.eyeSize) * (f ? 1 : 0.6);
      const ew = 17 * es, eh = (f ? 25 : 16) * es, dx = 37;
      const ec = EYEC[L.eyes] || EYEC[0], lash = '#2a1a1a', hairC = HAIRC[L.hairC] || '#4a2c1a';
      // sombra suave bajo el flequillo y rubor
      const g0 = c.createLinearGradient(0, h * 0.2, 0, h * 0.42); g0.addColorStop(0, 'rgba(120,60,60,.22)'); g0.addColorStop(1, 'rgba(120,60,60,0)'); c.fillStyle = g0; c.fillRect(cx - 110, h * 0.2, 220, h * 0.22);
      if (f) [-1, 1].forEach(s => { const g = c.createRadialGradient(cx + s * 56, ey + 30, 2, cx + s * 56, ey + 30, 24); g.addColorStop(0, 'rgba(255,90,120,.42)'); g.addColorStop(1, 'rgba(255,90,120,0)'); c.fillStyle = g; c.fillRect(cx + s * 56 - 26, ey + 4, 52, 52); });
      [-1, 1].forEach(s => {
        const x = cx + s * dx;
        if (shut) { c.strokeStyle = lash; c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); c.arc(x, ey - 2, ew * 0.9, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); return; }
        // blanco, iris con degradado, pupila y brillos
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, ey, ew, eh, 0, 0, 7); c.fill();
        c.save(); c.beginPath(); c.ellipse(x, ey, ew, eh, 0, 0, 7); c.clip();
        const g = c.createLinearGradient(0, ey - eh, 0, ey + eh); g.addColorStop(0, mixHex(ec, '#000000', 0.6)); g.addColorStop(0.45, ec); g.addColorStop(1, mixHex(ec, '#ffffff', 0.55));
        c.fillStyle = g; c.beginPath(); c.ellipse(x - s * 1.5, ey + eh * 0.08, ew * 0.82, eh * 0.95, 0, 0, 7); c.fill();
        c.fillStyle = mixHex(ec, '#000000', 0.75); c.beginPath(); c.ellipse(x - s * 1.5, ey + eh * 0.05, ew * 0.38, eh * 0.5, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x - ew, ey - eh, ew * 2, eh * 0.38);
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x - ew * 0.32, ey - eh * 0.38, ew * 0.3, eh * 0.2, -0.4, 0, 7); c.fill();
        c.beginPath(); c.arc(x + ew * 0.32, ey + eh * 0.42, ew * 0.14, 0, 7); c.fill();
        c.fillStyle = mixHex(ec, '#ffffff', 0.7); c.globalAlpha = 0.7; c.beginPath(); c.ellipse(x, ey + eh * 0.62, ew * 0.5, eh * 0.16, 0, 0, 7); c.fill(); c.globalAlpha = 1;
        c.restore();
        // pestañas
        c.strokeStyle = lash; c.lineCap = 'round'; c.lineWidth = f ? 4.2 : 2.6;
        c.beginPath(); c.ellipse(x, ey, ew * 1.04, eh * 1.03, 0, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
        if (f) {
          c.lineWidth = 3; c.beginPath(); c.moveTo(x + s * ew * 0.98, ey - eh * 0.28); c.lineTo(x + s * ew * 1.45, ey - eh * 0.62); c.stroke();
          c.lineWidth = 1.8; c.beginPath(); c.moveTo(x + s * ew * 0.9, ey - eh * 0.05); c.lineTo(x + s * ew * 1.32, ey - eh * 0.2); c.stroke();
          c.lineWidth = 1.4; c.beginPath(); c.ellipse(x, ey, ew * 0.95, eh, 0, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
          c.strokeStyle = 'rgba(120,60,60,.4)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, ey - 3, ew * 1.1, eh * 1.22, 0, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
        }
      });
      // cejas
      c.strokeStyle = mixHex(hairC, '#000000', 0.25); c.lineWidth = f ? 2.6 : 5; c.lineCap = 'round';
      [-1, 1].forEach(s => { const x = cx + s * dx, by = ey - eh - (f ? 13 : 9); c.beginPath(); c.moveTo(x - s * ew * 0.9, by + 3); c.quadraticCurveTo(x, by - (f ? 5 : 2), x + s * ew * 1.05, by + (f ? 1 : 3)); c.stroke(); });
      // nariz y boca
      c.fillStyle = 'rgba(150,80,60,.4)'; c.beginPath(); c.ellipse(cx, ey + 33, 2, 1.6, 0, 0, 7); c.fill();
      const my = ey + 50;
      if (f) {
        c.fillStyle = LIPC[L.lips] || LIPC[0]; c.beginPath(); c.moveTo(cx - 9, my); c.quadraticCurveTo(cx - 4, my - 4, cx, my - 2); c.quadraticCurveTo(cx + 4, my - 4, cx + 9, my); c.quadraticCurveTo(cx, my + 8, cx - 9, my); c.fill();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(cx + 2, my + 2.4, 2.4, 1, 0, 0, 7); c.fill();
        c.strokeStyle = 'rgba(90,30,30,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 8, my); c.quadraticCurveTo(cx, my + 2, cx + 8, my); c.stroke();
      } else { c.strokeStyle = '#7a3a2a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(cx - 10, my); c.quadraticCurveTo(cx, my + 5, cx + 10, my); c.stroke(); }
    });
  }

  // ----- pelo -----
  buildHair(L, head, R, hairM, hairC, f, accC) {
    const add = (geo, x, y, z, sx = 1, sy = 1, sz = 1, parent = head) => { const m = this.mesh(geo, hairM, parent, x, y, z); m.scale.set(sx, sy, sz); return m; };
    const sph = (r) => new THREE.SphereGeometry(r, 14, 10);
    const st = L.hair, short = st === 'corto' || st === 'pixie';
    // casquete inclinado hacia atrás: deja la cara libre y baja hasta la nuca
    const cap = add(new THREE.SphereGeometry(R * 1.08, 24, 14, 0, Math.PI * 2, 0, Math.PI * (st === 'pixie' ? 0.5 : 0.56)), 0, R * 0.02, -R * 0.02); cap.rotation.x = st === 'pixie' ? -0.62 : -0.78; cap.scale.set(1, 1.06, 1.02);
    // flequillo de mechones
    const nb = st === 'hime' ? 7 : 5;
    for (let i = 0; i < nb; i++) {
      const a = (i / (nb - 1) - 0.5) * (st === 'hime' ? 1.5 : 1.7), len = R * (st === 'hime' ? 0.62 : short ? 0.5 : 0.58 - Math.abs(a) * 0.08);
      const m = add(new THREE.ConeGeometry(R * (st === 'hime' ? 0.2 : 0.24), len, 5), Math.sin(a) * R * 0.96, R * 0.5 - len * 0.2, Math.cos(a) * R * 0.94, 1, 1, 0.42);
      m.rotation.set(0.2, a, Math.PI + (st === 'hime' ? 0 : (i % 2 ? 0.16 : -0.14)));
    }
    // mechones laterales delante de las orejas
    if (!short) [-1, 1].forEach(s => { const m = add(sph(R * 0.2), s * R * 0.98, -R * (st === 'hime' ? 0.55 : 0.35), R * 0.32, 0.7, st === 'hime' ? 4.2 : 3.2, 0.9); m.rotation.z = s * 0.06; });
    const curtain = (r, th0, thLen, gap) => new THREE.SphereGeometry(r, 20, 8, Math.PI / 2 + gap, Math.PI * 2 - gap * 2, th0, thLen);
    const tail = (x, y, z, len, r, rest) => { const g = new THREE.Group(); g.position.set(x, y, z); head.add(g); const m = add(sph(r), 0, -len * 0.5, 0, 1, len / (2 * r), 0.85, g); this.sway.push({ g, rx: rest ? rest[0] : 0, rz: rest ? rest[1] : 0, k: 1 }); return g; };
    if (st === 'largo' || st === 'hime' || st === 'ondulado') {
      add(curtain(R * 1.1, 1.3, 1.1, 1.15), 0, 0, 0);
      const g = tail(0, -R * 0.3, -R * 0.62, R * 4.6, R * 0.9, [0.06, 0]); g.children[0].scale.z = 0.36;
      if (st === 'ondulado') for (let i = 0; i < 9; i++) add(sph(R * 0.3), ((i % 3) - 1) * R * 0.62, -R * (1.2 + Math.floor(i / 3) * 1.25), -R * 0.1 + (i % 2) * R * 0.12, 1.2, 1, 0.8, g);
    } else if (st === 'melena') {
      add(curtain(R * 1.14, 1.25, 1.2, 1.0), 0, -R * 0.02, 0, 1, 1.25, 1);
    } else if (st === 'coleta' || st === 'lateral') {
      const sx = st === 'lateral' ? R * 0.85 : 0;
      add(sph(R * 0.3), sx, R * 0.75, st === 'lateral' ? -R * 0.3 : -R * 0.85);
      tail(sx * 1.1, R * 0.72, st === 'lateral' ? -R * 0.35 : -R * 0.95, R * 3.2, R * 0.34, st === 'lateral' ? [0, -0.25] : [0.5, 0]);
      this.mesh(new THREE.TorusGeometry(R * 0.2, R * 0.07, 6, 12), toon(accC), head, sx, R * 0.75, st === 'lateral' ? -R * 0.3 : -R * 0.85).rotation.x = Math.PI / 2;
    } else if (st === 'coletas') {
      [-1, 1].forEach(s => {
        add(sph(R * 0.26), s * R * 0.98, R * 0.55, -R * 0.15);
        const g = tail(s * R * 1.08, R * 0.55, -R * 0.15, R * 3.6, R * 0.36, [0.08, s * -0.2]); g.children[0].scale.z = 0.8;
        this.mesh(new THREE.SphereGeometry(R * 0.16, 8, 6), toon(accC), head, s * R * 1.05, R * 0.56, -R * 0.15);
      });
    } else if (st === 'mono') { add(sph(R * 0.42), 0, R * 1.02, -R * 0.45); add(curtain(R * 1.08, 1.3, 0.6, 1.2), 0, 0, 0); }
    else if (st === 'monos') { [-1, 1].forEach(s => add(sph(R * 0.36), s * R * 0.72, R * 0.92, -R * 0.2)); add(curtain(R * 1.08, 1.3, 0.6, 1.2), 0, 0, 0); }
    else if (st === 'trenzas') {
      add(curtain(R * 1.08, 1.3, 0.5, 1.2), 0, 0, 0);
      [-1, 1].forEach(s => { const g = new THREE.Group(); g.position.set(s * R * 0.9, -R * 0.5, R * 0.1); head.add(g); for (let k = 0; k < 7; k++) add(sph(R * (0.2 - k * 0.012)), 0, -k * R * 0.3, k * R * 0.03, 1, 1.05, 1, g); this.mesh(new THREE.SphereGeometry(R * 0.13, 8, 6), toon(accC), g, 0, -7 * R * 0.3, 0.2 * R); this.sway.push({ g, rx: -0.12, rz: 0, k: 0.6 }); });
    } else if (st === 'rizado') {
      for (let i = 0; i < 22; i++) { const a = i * 2.4, e = 0.25 + (i % 5) * 0.28; const cx = Math.sin(a) * Math.sin(e + 0.6), cz = Math.cos(a) * Math.sin(e + 0.6); if (cz > 0.55 && e > 0.7) continue; add(sph(R * 0.36), cx * R * 1.05, Math.cos(e + 0.3) * R * 1.0, cz * R * 1.05 - R * 0.1); }
    } else if (st === 'corto') { add(curtain(R * 1.07, 1.3, 0.75, 1.3), 0, 0, 0); }
  }

  // ----- accesorios de cabeza -----
  buildAcc(L, head, R, accC, hairM) {
    const A = L.acc, m = toon(accC), add = (geo, mat, x, y, z) => this.mesh(geo, mat, head, x, y, z);
    if (A === 'casco') { const c = add(new THREE.SphereGeometry(R * 1.16, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), toon('#ffcc1a'), 0, R * 0.22, 0); c.scale.set(1, 0.9, 1.05); add(new THREE.CylinderGeometry(R * 1.34, R * 1.34, R * 0.07, 20), toon('#e0a800'), 0, R * 0.24, R * 0.08); add(new THREE.BoxGeometry(R * 0.22, R * 0.14, R * 2.1), toon('#e0a800'), 0, R * 1.2, 0); }
    else if (A === 'gorra') { const c = add(new THREE.SphereGeometry(R * 1.13, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), m, 0, R * 0.25, 0); c.scale.y = 0.85; const v = add(new THREE.CylinderGeometry(R * 0.8, R * 0.8, R * 0.06, 16, 1, false, -Math.PI / 2, Math.PI), toon(mixHex(accC, '#000000', 0.25)), 0, R * 0.28, R * 0.7); v.scale.z = 1.3; }
    else if (A === 'boina') { const c = add(new THREE.SphereGeometry(R * 1.05, 16, 10), m, R * 0.2, R * 0.85, -R * 0.1); c.scale.set(1.15, 0.38, 1.1); c.rotation.z = -0.25; add(new THREE.SphereGeometry(R * 0.08, 6, 6), m, R * 0.25, R * 1.25, -R * 0.1); }
    else if (A === 'pajita') { const c = add(new THREE.CylinderGeometry(R * 0.85, R * 1.0, R * 0.6, 18), toon('#e8cf8a'), 0, R * 0.85, 0); add(new THREE.CylinderGeometry(R * 1.9, R * 1.9, R * 0.05, 24), toon('#e8cf8a'), 0, R * 0.55, 0); add(new THREE.CylinderGeometry(R * 1.02, R * 1.02, R * 0.16, 18), m, 0, R * 0.66, 0); }
    else if (A === 'bruja') { add(new THREE.CylinderGeometry(R * 1.8, R * 1.8, R * 0.06, 24), m, 0, R * 0.55, 0); const c = add(new THREE.ConeGeometry(R * 0.95, R * 2.1, 16), m, 0, R * 1.6, -R * 0.05); c.rotation.x = -0.18; add(new THREE.CylinderGeometry(R * 0.97, R * 0.97, R * 0.16, 16), toon('#ffd84a'), 0, R * 0.66, 0); }
    else if (A === 'lazo') { [-1, 1].forEach(s => { const c = add(new THREE.ConeGeometry(R * 0.36, R * 0.62, 4), m, s * R * 0.34, R * 1.05, -R * 0.1); c.rotation.z = s * Math.PI / 2; c.scale.z = 0.45; }); add(new THREE.SphereGeometry(R * 0.14, 8, 6), m, 0, R * 1.05, -R * 0.1); }
    else if (A === 'diadema' || A === 'cofia') { const t = add(new THREE.TorusGeometry(R * 1.1, R * (A === 'cofia' ? 0.1 : 0.06), 6, 20, Math.PI), A === 'cofia' ? toon('#ffffff') : m, 0, R * 0.05, R * 0.05); t.rotation.x = -0.15; if (A === 'cofia') for (let i = 0; i < 7; i++) { const a = (i / 6) * Math.PI; add(new THREE.SphereGeometry(R * 0.16, 6, 6), toon('#ffffff'), Math.cos(a) * R * 1.12, R * 0.08 + Math.sin(a) * R * 1.12, R * 0.02); } }
    else if (A === 'flor') { for (let i = 0; i < 5; i++) { const a = i * 1.256; add(new THREE.SphereGeometry(R * 0.15, 6, 6), m, R * 0.85 + Math.cos(a) * R * 0.17, R * 0.6 + Math.sin(a) * R * 0.17, R * 0.5); } add(new THREE.SphereGeometry(R * 0.11, 6, 6), toon('#ffd84a'), R * 0.87, R * 0.6, R * 0.56); }
    else if (A === 'gato' || A === 'zorro') { [-1, 1].forEach(s => { const big = A === 'zorro' ? 1.35 : 1; const c = add(new THREE.ConeGeometry(R * 0.36 * big, R * 0.62 * big, 4), A === 'zorro' ? m : hairM, s * R * 0.6, R * 1.12, -R * 0.02); c.rotation.set(-0.1, s * 0.5, -s * 0.28); c.scale.z = 0.5; const i2 = add(new THREE.ConeGeometry(R * 0.2 * big, R * 0.38 * big, 4), toon(A === 'zorro' ? '#ffffff' : '#ff9ec7'), s * R * 0.6, R * 1.1, R * 0.05); i2.rotation.set(-0.1, s * 0.5, -s * 0.28); i2.scale.z = 0.4; }); }
    else if (A === 'conejo') { [-1, 1].forEach(s => { const e = add(new THREE.SphereGeometry(R * 0.2, 8, 8), m, s * R * 0.36, R * 1.75, -R * 0.1); e.scale.set(1, 4.2, 0.5); e.rotation.z = -s * 0.14; const i2 = add(new THREE.SphereGeometry(R * 0.11, 8, 8), toon('#ff9ec7'), s * R * 0.36, R * 1.78, -R * 0.02); i2.scale.set(1, 5.5, 0.4); i2.rotation.z = -s * 0.14; }); const b = add(new THREE.TorusGeometry(R * 1.08, R * 0.06, 6, 20, Math.PI), m, 0, R * 0.05, -R * 0.1); }
    else if (A === 'cuernos') { [-1, 1].forEach(s => { const c = add(new THREE.ConeGeometry(R * 0.2, R * 0.75, 8), m, s * R * 0.62, R * 1.15, R * 0.1); c.rotation.z = -s * 0.5; c.rotation.x = 0.2; }); }
    else if (A === 'halo') { const t = add(new THREE.TorusGeometry(R * 0.72, R * 0.07, 8, 24), this.own(new THREE.MeshBasicMaterial({ color: '#fff3a0' })), 0, R * 1.62, 0); t.rotation.x = Math.PI / 2 - 0.15; this.halo = t; }
    else if (A === 'corona' || A === 'tiara') { const gold = toon('#ffd84a'); if (A === 'corona') { add(new THREE.CylinderGeometry(R * 0.5, R * 0.46, R * 0.26, 12, 1, true), this.own(new THREE.MeshToonMaterial({ color: '#ffd84a', gradientMap: toonGrad(), side: THREE.DoubleSide })), 0, R * 1.12, 0); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; add(new THREE.ConeGeometry(R * 0.11, R * 0.3, 4), gold, Math.sin(a) * R * 0.48, R * 1.38, Math.cos(a) * R * 0.48); } add(new THREE.SphereGeometry(R * 0.09, 6, 6), toon('#e8365d'), 0, R * 1.14, R * 0.5); } else { const t = add(new THREE.TorusGeometry(R * 1.02, R * 0.05, 6, 20, Math.PI), gold, 0, R * 0.42, R * 0.1); t.rotation.x = -0.5; add(new THREE.ConeGeometry(R * 0.13, R * 0.34, 4), gold, 0, R * 1.2, R * 0.62); add(new THREE.SphereGeometry(R * 0.08, 6, 6), m, 0, R * 1.08, R * 0.72); } }
    else if (A === 'gafas' || A === 'gafasol') { const fm = toon(A === 'gafasol' ? '#111111' : accC); [-1, 1].forEach(s => { const t = add(new THREE.TorusGeometry(R * 0.25, R * 0.035, 6, 16), fm, s * R * 0.37, R * 0.08, R * 0.93); if (A === 'gafasol') { const l = add(new THREE.CircleGeometry(R * 0.25, 16), this.own(new THREE.MeshBasicMaterial({ color: '#15151c' })), s * R * 0.37, R * 0.08, R * 0.935); l.rotation.y = s * 0.3; } t.rotation.y = s * 0.3; const p = add(new THREE.BoxGeometry(R * 0.03, R * 0.03, R * 0.9), fm, s * R * 0.7, R * 0.1, R * 0.45); }); add(new THREE.BoxGeometry(R * 0.26, R * 0.035, R * 0.03), fm, 0, R * 0.1, R * 0.99); }
    else if (A === 'auriculares') { const t = add(new THREE.TorusGeometry(R * 1.12, R * 0.07, 6, 20, Math.PI), toon('#222222'), 0, R * 0.05, 0); [-1, 1].forEach(s => { const c = add(new THREE.CylinderGeometry(R * 0.32, R * 0.32, R * 0.2, 14), m, s * R * 1.08, -R * 0.02, 0); c.rotation.z = Math.PI / 2; }); }
  }

  // ----- cuello, espalda (alas, colas, capa) -----
  buildExtras(L, torso, T, vy, D, f) {
    const nC = CLOTHC[L.neckC] || '#1a1a1f', bC = CLOTHC[L.backC] || '#ffffff', nm = toon(nC), bm = toon(bC);
    const N = L.neckw, ny = T(D.neckY + 0.035);
    if (N === 'gargantilla' || N === 'cascabel') { this.mesh(new THREE.CylinderGeometry(D.neckR * 1.12, D.neckR * 1.16, 0.022, 14), toon(N === 'cascabel' ? '#b0102a' : nC), torso, 0, ny, 0); if (N === 'cascabel') this.mesh(new THREE.SphereGeometry(0.018, 8, 8), toon('#ffd84a'), torso, 0, ny - 0.02, D.neckR * 1.2); }
    else if (N === 'perlas') { for (let i = 0; i < 13; i++) { const a = (i / 12 - 0.5) * 2.6; this.mesh(new THREE.SphereGeometry(0.011, 6, 6), nm, torso, Math.sin(a) * 0.075, T(D.neckY - 0.01) - Math.cos(a) * 0.035, 0.045 + Math.cos(a) * 0.035); } }
    else if (N === 'bufanda') { const t = this.mesh(new THREE.TorusGeometry(D.neckR * 1.5, 0.03, 8, 16), nm, torso, 0, ny - 0.01, 0); t.rotation.x = Math.PI / 2; const e = this.mesh(new THREE.BoxGeometry(0.06, 0.2, 0.02), nm, torso, 0.04, ny - 0.12, D.neckR * 1.6); e.rotation.z = 0.12; }
    else if (N === 'pajarita') { [-1, 1].forEach(s => { const c = this.mesh(new THREE.ConeGeometry(0.03, 0.05, 4), nm, torso, s * 0.028, ny - 0.01, D.neckR * 1.25); c.rotation.z = s * Math.PI / 2; c.scale.z = 0.5; }); this.mesh(new THREE.SphereGeometry(0.012, 6, 6), nm, torso, 0, ny - 0.01, D.neckR * 1.3); this.mesh(new THREE.CylinderGeometry(D.neckR * 1.1, D.neckR * 1.14, 0.018, 12), nm, torso, 0, ny, 0); }
    const B = L.back, bz = -(D.chestR * D.DZ + 0.01), by = T(vy(0.72));
    this.wings = [];
    const wing = (shape, mat, s, sc) => { const g = new THREE.Group(); g.position.set(s * 0.03, by, bz); torso.add(g); const m = this.mesh(new THREE.ShapeGeometry(shape), mat, g); m.scale.set(s * sc, sc, 1); this.wings.push({ g, s }); };
    if (B === 'angel' || B === 'demonio' || B === 'hada') {
      const sh = new THREE.Shape();
      if (B === 'angel') { sh.moveTo(0, 0); sh.bezierCurveTo(0.1, 0.3, 0.42, 0.42, 0.52, 0.3); sh.bezierCurveTo(0.5, 0.12, 0.46, 0, 0.42, -0.1); sh.lineTo(0.36, -0.02); sh.lineTo(0.32, -0.18); sh.lineTo(0.25, -0.06); sh.lineTo(0.2, -0.24); sh.lineTo(0.13, -0.1); sh.lineTo(0.08, -0.24); sh.closePath(); }
      else if (B === 'demonio') { sh.moveTo(0, 0); sh.lineTo(0.18, 0.3); sh.lineTo(0.5, 0.36); sh.quadraticCurveTo(0.42, 0.2, 0.46, 0.02); sh.quadraticCurveTo(0.36, 0.08, 0.32, -0.08); sh.quadraticCurveTo(0.24, 0.02, 0.18, -0.14); sh.quadraticCurveTo(0.1, -0.02, 0, -0.12); sh.closePath(); }
      else { sh.moveTo(0, 0); sh.bezierCurveTo(0.1, 0.34, 0.4, 0.4, 0.4, 0.2); sh.bezierCurveTo(0.4, 0.06, 0.16, 0.02, 0, 0); sh.bezierCurveTo(0.2, -0.04, 0.3, -0.2, 0.2, -0.26); sh.bezierCurveTo(0.1, -0.28, 0.02, -0.12, 0, 0); }
      const mat = this.own(new THREE.MeshToonMaterial({ color: bC, gradientMap: toonGrad(), side: THREE.DoubleSide, transparent: B === 'hada', opacity: B === 'hada' ? 0.6 : 1 }));
      [-1, 1].forEach(s => wing(sh, mat, s, B === 'hada' ? 0.9 : 1.05));
    } else if (B === 'capa') {
      const g = new THREE.Group(); g.position.set(0, T(vy(0.94)), bz); torso.add(g);
      const m = this.mesh(new THREE.PlaneGeometry(0.42, 0.78, 4, 6), this.own(new THREE.MeshToonMaterial({ color: bC, gradientMap: toonGrad(), side: THREE.DoubleSide })), g, 0, -0.39, -0.02); this.sway.push({ g, rx: 0.14, rz: 0, k: 0.8 });
    } else if (B === 'mochila') { this.mesh(new THREE.BoxGeometry(0.2, 0.24, 0.1), bm, torso, 0, T(vy(0.62)), bz - 0.05); this.mesh(new THREE.BoxGeometry(0.14, 0.09, 0.03), toon(mixHex(bC, '#000000', 0.25)), torso, 0, T(vy(0.52)), bz - 0.11); }
    const tz = -(D.hipR * D.DZ), ty = T(vy(0.2));
    if (B === 'colagato' || B === 'coladiablo') { const g = new THREE.Group(); g.position.set(0, ty, tz); torso.add(g); for (let k = 0; k < 9; k++) { const a = k / 8; this.mesh(new THREE.SphereGeometry(B === 'coladiablo' ? 0.014 : 0.022, 8, 6), bm, g, Math.sin(a * 2.5) * 0.04, -0.02 + Math.sin(a * 2.2) * 0.2 - a * 0.1, -a * 0.28); } if (B === 'coladiablo') { const c = this.mesh(new THREE.ConeGeometry(0.04, 0.07, 4), bm, g, Math.sin(2.5) * 0.04, 0.07, -0.3); c.scale.z = 0.4; } this.sway.push({ g, rx: 0, rz: 0, k: 1.4, tail: 1 }); }
    else if (B === 'colazorro') { const g = new THREE.Group(); g.position.set(0, ty, tz); torso.add(g); const m = this.mesh(new THREE.SphereGeometry(0.09, 12, 10), bm, g, 0, 0.08, -0.2); m.scale.set(1, 1, 2.6); m.rotation.x = -0.5; const tip = this.mesh(new THREE.SphereGeometry(0.06, 10, 8), toon('#ffffff'), g, 0, 0.19, -0.39); tip.scale.set(1, 1, 1.5); tip.rotation.x = -0.5; this.sway.push({ g, rx: 0, rz: 0, k: 1.2, tail: 1 }); }
    else if (B === 'pompon') this.mesh(new THREE.SphereGeometry(0.055, 10, 8), bm, torso, 0, ty - 0.02, tz - 0.05);
  }

  // st: { moving, run, speed, jig, t }
  update(dt, st) {
    if (!this.body) return;
    this.t += dt; const t = this.t, j = st.jig || { b: 0, g: 0, h: 0, s: 0 };
    const target = st.moving ? (st.run ? 1 : 0.62) : 0; this.amp += (target - this.amp) * Math.min(1, dt * 10);
    const a = this.amp, ph = st.phase || 0, sn = Math.sin(ph), d = this.d;
    this.legs.forEach(l => { const p = sn * l.s; l.hip.rotation.x = -p * a * 0.85; l.kn.rotation.x = Math.max(0, Math.sin(ph * 1 + (l.s > 0 ? -1.1 : Math.PI - 1.1))) * a * 1.3; l.hip.rotation.z = 0; });
    this.arms.forEach(r => { const p = sn * r.s; r.sh.rotation.x = p * a * 0.75; r.sh.rotation.z = r.s * (0.16 + (d.f ? 0.06 : 0)) + r.s * Math.sin(t * 1.3) * 0.012; r.el.rotation.x = -(0.12 + a * 0.55 + Math.max(0, p) * a * 0.4); });
    this.body.position.y = d.heel + Math.abs(sn) * 0.022 * a + Math.sin(t * 2) * 0.003;
    this.torso.rotation.y = sn * 0.1 * a; this.torso.rotation.z = Math.cos(ph) * 0.035 * a * (d.f ? 1.4 : 0.6); this.torso.rotation.x = st.run ? 0.16 * a : 0.03 * a;
    const breathe = 1 + Math.sin(t * 2) * 0.012;
    this.breasts.forEach((m, i) => { m.position.y = m.userData.y0 + j.b * 0.006 * (0.3 + d.bust) + Math.sin(t * 2) * 0.002; m.scale.set(breathe, 0.96 - j.b * 0.02, 1 + j.b * 0.015); });
    this.glutes.forEach((m, i) => { m.position.y = m.userData.y0 + j.g * 0.005 * (0.3 + d.glutes) * (i ? 1 : -1) * (a > 0.1 ? 1 : 0) + j.g * 0.002; });
    this.head.rotation.y = Math.sin(t * 0.7) * 0.06 * (1 - a) - this.torso.rotation.y * 0.6; this.head.rotation.x = Math.sin(t * 0.9) * 0.025;
    this.sway.forEach(s => { s.g.rotation.x = s.rx + (s.tail ? Math.sin(t * 2.2) * 0.12 : 0) + j.h * 0.035 * s.k + a * 0.22 * s.k * (s.tail ? 0.3 : 1); s.g.rotation.z = s.rz + j.s * 0.02 * s.k + (s.tail ? Math.sin(t * 1.6) * 0.3 : Math.sin(t * 1.1 + s.rz) * 0.015); });
    if (this.skirt) { this.skirt.rotation.x = j.s * 0.018 + a * 0.05; this.skirt.rotation.z = j.s * 0.03; }
    if (this.wings) this.wings.forEach(w => { w.g.rotation.y = w.s * (-0.5 + Math.sin(t * 3) * 0.18); });
    if (this.halo) this.halo.position.y += Math.sin(t * 2) * 0.0004;
    this.blinkT -= dt; if (this.blinkT < 0) { this.blink = 0.12; this.blinkT = 2 + Math.random() * 4; }
    if (this.blink > 0) { this.blink -= dt; this.faceM.map = this.faceShut; } else this.faceM.map = this.faceOpen;
  }
}
