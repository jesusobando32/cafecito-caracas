// Valida data/cafes.js y data/wiki.js sin navegador:  node tests/validate.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
for (const f of ['data/cafes.js', 'data/wiki.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8') + '\n;this.__ok=1', ctx, { filename: f });
}
const cafes = vm.runInContext('CAFES_DATA', ctx);
const wiki = vm.runInContext('WIKI_DATA', ctx);

const errors = [];
const err = (m) => errors.push(m);
const BBOX = { latMin: 10.38, latMax: 10.53, lngMin: -67.0, lngMax: -66.77 };
const TYPES = ['cafeteria', 'especialidad'];

const ids = new Set();
for (const c of cafes) {
  const tag = `#${c.id} ${c.name}`;
  if (ids.has(c.id)) err(`${tag}: id duplicado`);
  ids.add(c.id);
  for (const k of ['name', 'neighborhood', 'address', 'type']) if (!c[k]) err(`${tag}: falta ${k}`);
  if (!TYPES.includes(c.type)) err(`${tag}: tipo inválido ${c.type}`);
  if (!(c.lat >= BBOX.latMin && c.lat <= BBOX.latMax && c.lng >= BBOX.lngMin && c.lng <= BBOX.lngMax)) err(`${tag}: coordenadas fuera de la zona (${c.lat}, ${c.lng})`);
  for (const k of ['methods', 'drinks', 'snacks', 'sources']) if (!Array.isArray(c[k])) err(`${tag}: ${k} debe ser lista`);
  for (const m of c.methods || []) if (!wiki.methods[m]) err(`${tag}: método "${m}" sin entrada en la wiki`);
  if (c.schedule) {
    if (c.schedule.length !== 7) err(`${tag}: horario incompleto`);
    for (const d of c.schedule) if (!d.closed && !(d.open && d.close && d.close > d.open)) err(`${tag}: horario inválido ${JSON.stringify(d)}`);
  }
  if (/[�]/.test(c.name)) err(`${tag}: nombre con caracteres rotos`);
}
const seen = new Map();
for (const c of cafes) {
  const k = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
  if (seen.has(k)) err(`Mismo punto: "${c.name}" y "${seen.get(k)}"`);
  seen.set(k, c.name);
}
for (const a of wiki.articles) if (!a.sections || !a.sections.length) err(`wiki ${a.id}: sin secciones`);

console.log(`${cafes.length} cafeterías · ${new Set(cafes.map(c => c.neighborhood)).size} barrios · ${cafes.filter(c => c.schedule).length} con horario · ${cafes.filter(c => c.type === 'especialidad').length} especialidad`);
if (errors.length) { console.error('\nERRORES:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log('OK');
