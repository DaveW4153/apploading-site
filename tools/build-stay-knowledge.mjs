/* Builds the plain-text knowledge file the guest assistant answers from.
   Run from the project root after changing a lodge's content file:

     node tools/build-stay-knowledge.mjs            (every lodge in stay/property)
     node tools/build-stay-knowledge.mjs sample     (one lodge)

   It reads stay/property/<id>.js and writes stay/property/<id>.knowledge.json. The text is English: the assistant
   answers in the guest's own language from it. The output is deterministic (no dates or random values), so the
   assistant's prompt stays byte-identical between requests and can be cached. */
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = join(process.cwd(), 'stay', 'property');
const ids = process.argv[2] ? [process.argv[2]] : readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js').map((f) => f.replace(/\.js$/, ''));

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LIKELY = { daily: 'seen daily', often: 'often seen', sometimes: 'sometimes seen', rare: 'rarely seen' };
const INFO = { checkin: 'Check-in time', checkout: 'Check-out time', wifi: 'Wi-Fi name and password', gate: 'Gate access', braai: 'Braai and firewood', pool: 'Pool times and rules' };

for (const id of ids) {
  const { PACK: p } = await import(pathToFileURL(join(dir, `${id}.js`)).href);
  const host = p.lodge.host;
  /* English text of a translated value, with the host's name filled in. */
  const en = (v) => String(v && typeof v === 'object' ? v.en || '' : v || '').replace(/\{host\}/g, host).replace(/\s+/g, ' ').trim();
  const out = [];
  const h = (title) => out.push('', `## ${title}`);
  const line = (s) => { if (s) out.push(s); };

  h('The lodge');
  line(`Name: ${p.brand.name}.`);
  line(`Host: ${host}. Guests reach the host fastest on WhatsApp. Messages to the host are written in English.`);
  line(`Address: ${p.lodge.address}.`);
  line(`Time zone: ${p.lodge.tz}.`);

  h('Rooms and what is included');
  for (const u of Object.values(p.lodges)) line(`- ${u.name} (${en(u.sleeps).toLowerCase()}): ${en(u.includes)}`);

  h('Details the host provides');
  for (const i of p.info) line(`- ${INFO[i.id] || i.id}: ${i.value ? en(i.value) : 'not provided in the app yet. The guest should ask the host.'}`);

  h('Getting to the lodge');
  for (const r of Object.values(p.routes)) {
    line(`- ${en(r.title)}: ${en(r.summary)} Allow about ${r.drive} minutes of driving${r.buffer ? `, plus ${r.buffer} minutes at the airport for bags and car hire` : ''}.`);
    for (const tip of r.tips ? (Array.isArray(r.tips) ? r.tips : r.tips.en || []) : []) line(`  - ${en(tip)}`);
  }
  line('Guests should aim to arrive before sunset. Driving after dark is risky because of animals on the road.');

  const byCat = {};
  for (const pl of p.places) (byCat[pl.cat] = byCat[pl.cat] || []).push(pl);
  for (const [cat, list] of Object.entries(byCat)) {
    h(cat === 'air' ? 'Airports' : `Nearby: ${en(p.cats[cat] && p.cats[cat].label) || cat}`);
    for (const pl of list) {
      const bits = [`${pl.min} min by road, ${pl.km} km`];
      if (pl.phone) bits.push(`phone ${pl.phone}`);
      line(`- ${pl.name} (${bits.join('; ')}). ${[en(pl.note), en(pl.hoursText)].filter(Boolean).join(' ')}`.trim());
    }
  }
  line('Opening hours come from public data and can change, so guests should call ahead.');

  if (Array.isArray(p.gates)) {
    h('Park gate times by month');
    p.gates.forEach((g, i) => line(`- ${MONTHS[i]}: gates open ${g[0]}, close ${g[1]}.`));
    line('Times change with the season. Guests should check with the park before they go.');
  }

  if (p.climate) {
    h('Typical weather by month');
    for (const [m, c] of Object.entries(p.climate)) line(`- ${MONTHS[m - 1]}: about ${Math.round(c.hi)} degrees C by day and ${Math.round(c.lo)} at night, around ${Math.round(c.rain)} mm of rain over ${Math.round(c.days)} rainy days.`);
    line('The app shows the live forecast for the lodge. These are long-term averages.');
  }

  h('Emergency numbers');
  for (const g of p.emergency) for (const it of g.items) line(`- ${en(g.group)}: ${en(it.name)}, ${it.tel}${it.note ? ` (${en(it.note)})` : ''}.`);
  line('In a life-threatening emergency, call 112 from any mobile phone. The app has an SOS screen with these numbers.');

  h('Good to know before travelling');
  for (const k of p.know) line(`- ${en(k.title)}: ${en(k.body)}`);

  h('Checklists');
  for (const c of p.checklist) line(`- ${c.when === 'departure' ? 'Before leaving' : 'Before arriving'}: ${en(c.text)}`);

  h('Packing list');
  for (const g of p.packing) line(`- ${en(g.cat)}: ${g.items.map((i) => en(i.text)).join('; ')}.`);

  h('Rules around wildlife');
  for (const r of p.bushRules) line(`- ${en(r)}`);

  h('Animals and birds');
  for (const s of p.species) {
    const where = en(p.zones[s.zone] && p.zones[s.zone].label).toLowerCase();
    line(`- ${en(s.name)} (${where}, ${LIKELY[s.likely] || s.likely}; best time: ${en(s.best).toLowerCase()}). ${en(s.look)} ${en(s.fact)} ${en(s.care)}${s.sensitive ? ' Sensitive species: never share where or when one was seen.' : ''}`);
  }

  h('Extras guests can ask the host for');
  for (const x of p.extras) line(`- ${en(x.title)}: ${en(x.gets)} Price: ${x.price ? `${x.price.amount} ${en(x.price.unit)}` : 'the host confirms it'}.`);
  line('Every extra is a request. Nothing is booked or charged in the app. The host confirms price and availability.');

  const text = out.join('\n').trim() + '\n';
  writeFileSync(join(dir, `${id}.knowledge.json`), JSON.stringify({ id, lodge: p.brand.name, host, langs: p.brand.langs, text }, null, 1) + '\n');
  console.log(`${id}: ${text.length} characters, about ${Math.round(text.length / 4)} tokens`);
}
