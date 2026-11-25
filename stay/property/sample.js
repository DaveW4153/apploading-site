/* Sample property pack for the public demo on apploading.co: an invented lodge. No real lodge, host or contact detail appears here.
   The area content (places, airports, park gates, emergency numbers, wildlife) is real public information for the Hoedspruit area.
   Everything about this lodge and its area. The app engine reads it through property/index.js.
   To set up another lodge, copy this file and change its content. Nothing else needs to change.
   Every fact here was checked against a source (see SOURCES at the bottom) or is marked as something the host must confirm.
   Drive times are estimates from road data and already allow for the slower estate roads. */

const T = (en, de) => ({ en, de });

export const LODGE = {
  lat: -24.36, lon: 30.98, tz: 'Africa/Johannesburg', tzOffset: 2,
  host: 'Naledi',
  whatsapp: '27000000000', phone: '+27 00 000 0000', phoneAlt: '+27 00 000 0001', email: 'host@sample-lodge.example',
  address: 'Sample Bush Lodge, 1 Sample Road, Sampletown, Limpopo',
  book: 'https://www.apploading.co/guest-app-for-lodges/',
  site: 'https://www.apploading.co/guest-app-for-lodges/',
  cdn: '/stay/img/',
};

export const LODGES = {
  1: { name: 'River Suite', photo: 'suite-1.jpg', sleeps: T('Sleeps 2', 'Für 2 Personen'),
    includes: T('King bedroom, bathroom with outdoor shower, private deck over the riverbed with plunge pool, air conditioning and fans.', 'Schlafzimmer mit Kingsize-Bett, Bad mit Außendusche, private Terrasse über dem Flussbett mit Tauchbecken, Klimaanlage und Ventilatoren.') },
  2: { name: 'Marula Suite', photo: 'suite-2.jpg', sleeps: T('Sleeps 2', 'Für 2 Personen'),
    includes: T('King bedroom, bathroom with bath and outdoor shower, shaded deck with day bed, air conditioning and fans.', 'Schlafzimmer mit Kingsize-Bett, Bad mit Wanne und Außendusche, schattige Terrasse mit Tagesbett, Klimaanlage und Ventilatoren.') },
  3: { name: 'Baobab Suite', photo: 'suite-3.jpg', sleeps: T('Sleeps 2 to 3', 'Für 2 bis 3 Personen'),
    includes: T('King or twin beds, a day bed for a child, outdoor shower, private deck with braai.', 'Kingsize-Bett oder zwei Einzelbetten, Tagesbett für ein Kind, Außendusche, private Terrasse mit Braai.') },
  4: { name: 'Family Villa', photo: 'suite-4.jpg', sleeps: T('Sleeps 4 to 6', 'Für 4 bis 6 Personen'),
    includes: T('Two bedrooms with their own bathrooms, lounge, kitchen, shaded deck with braai and a private pool.', 'Zwei Schlafzimmer mit eigenem Bad, Wohnbereich, Küche, schattige Terrasse mit Braai und privatem Pool.') },
};

/* Opening hours as [open, close] in hours, indexed Sunday to Saturday. null means closed. */
const daily = (a, b) => Array(7).fill([a, b]);
const H = {
  allDay: daily(0, 24),
  hat: daily(10, 22),
  spur: [[9, 20], [7, 21], [7, 21], [7, 21], [7, 21], [7, 22], [7, 22]],
  wimpy: [[8, 17], [7, 19], [7, 19], [7, 19], [7, 19], [7, 19], [7, 19]],
  baguette: [null, [8, 16.5], [8, 16.5], [8, 16.5], [8, 16.5], [8, 16.5], [8, 14.5]],
  upside: daily(9, 16),
  pnp: [[8, 15], [7, 19], [7, 19], [7, 19], [7, 19], [7, 19], [7, 18]],
};

/* Places. cat: eat | shop | health | sights | air. km and min are by road from the lodge. */
export const PLACES = [
  // Eat and drink
  { id: 'hat', cat: 'eat', name: 'The Hat & Creek', lat: -24.3571, lon: 30.9478, km: 8, min: 20, phone: '+27157931135', hours: H.hat,
    hoursText: T('Daily, about 10:00 to 22:00. Kitchen times vary, so call ahead.', 'Täglich, etwa 10:00 bis 22:00. Die Küchenzeiten schwanken, rufen Sie vorher an.'),
    note: T('Relaxed lunches and dinners on the main road. A local favourite.', 'Entspannte Mittag- und Abendessen an der Hauptstraße. Bei Einheimischen beliebt.') },
  { id: 'sleepers', cat: 'eat', name: 'Sleepers Railway Station Restaurant', lat: -24.3520, lon: 30.9560, km: 7, min: 20,
    note: T('Set in the old railway station with a local feel.', 'Im alten Bahnhof gelegen, mit lokalem Flair.') },
  { id: 'brewery', cat: 'eat', name: 'The Brewery', lat: -24.3681, lon: 30.9689, km: 10, min: 20,
    note: T('Craft beer and sushi in the bush. Busiest on Friday evenings.', 'Craft-Bier und Sushi mitten im Busch. Am vollsten am Freitagabend.') },
  { id: 'spur', cat: 'eat', name: 'Silver Wings Spur', lat: -24.3514, lon: 30.9572, km: 7, min: 20, phone: '+27157930559', hours: H.spur,
    hoursText: T('Mon to Thu 07:00 to 21:00, Fri and Sat 07:00 to 22:00, Sun 09:00 to 20:00.', 'Mo bis Do 07:00 bis 21:00, Fr und Sa 07:00 bis 22:00, So 09:00 bis 20:00.'),
    note: T('Steaks and easy family meals. Opens early for breakfast.', 'Steaks und unkomplizierte Familiengerichte. Öffnet früh zum Frühstück.') },
  { id: 'baguette', cat: 'eat', name: 'LA Baguette Café', lat: -24.3600, lon: 30.9441, km: 8, min: 20, phone: '+27636517466', hours: H.baguette,
    hoursText: T('Mon to Fri 08:00 to 16:30, Sat 08:00 to 14:30. Closed Sundays.', 'Mo bis Fr 08:00 bis 16:30, Sa 08:00 bis 14:30. Sonntags geschlossen.'),
    note: T('Coffee and light bites in town.', 'Kaffee und kleine Gerichte in der Stadt.') },
  { id: 'wimpy', cat: 'eat', name: 'Wimpy', lat: -24.3520, lon: 30.9566, km: 7, min: 20, phone: '+27157933786', hours: H.wimpy,
    hoursText: T('Mon to Sat 07:00 to 19:00, Sun 08:00 to 17:00.', 'Mo bis Sa 07:00 bis 19:00, So 08:00 bis 17:00.'),
    note: T('Breakfasts and burgers. Easy with children.', 'Frühstück und Burger. Unkompliziert mit Kindern.') },
  { id: 'upside', cat: 'eat', name: 'Upside Down', lat: -24.3734, lon: 30.8575, km: 18, min: 35, hours: H.upside,
    hoursText: T('Daily 09:00 to 16:00.', 'Täglich 09:00 bis 16:00.'),
    note: T('Pancake café west of town.', 'Pfannkuchen-Café westlich der Stadt.') },
  { id: 'bluemountain', cat: 'eat', name: 'Blue Mountain Restaurant', lat: -24.3989, lon: 30.8300, km: 23, min: 35,
    note: T('Popular for sundowners.', 'Beliebt für Sundowner.') },

  // Shops, fuel and cash
  { id: 'pnp', cat: 'shop', name: 'Pick n Pay', lat: -24.3515, lon: 30.9585, km: 7, min: 20, phone: '+27157930482', hours: H.pnp,
    hoursText: T('Mon to Fri 07:00 to 19:00, Sat 07:00 to 18:00, Sun 08:00 to 15:00.', 'Mo bis Fr 07:00 bis 19:00, Sa 07:00 bis 18:00, So 08:00 bis 15:00.'),
    note: T('The main supermarket for your self-catering shop. Capitec bank next door, plus a liquor store (weekdays).', 'Der Hauptsupermarkt für Ihren Einkauf als Selbstversorger. Daneben eine Capitec-Bank und ein Spirituosenladen (werktags).') },
  { id: 'spar', cat: 'shop', name: 'Spar and Tops liquor', lat: -24.3531, lon: 30.9493, km: 8, min: 20, phone: '+27157932305',
    note: T('Second supermarket, with a bottle store and an ABSA ATM.', 'Zweiter Supermarkt, mit Spirituosenladen und ABSA-Geldautomat.') },
  { id: 'fuel', cat: 'shop', name: 'TotalEnergies, open 24 hours', lat: -24.3514, lon: 30.9562, km: 7, min: 20, phone: '+27157930027', hours: H.allDay,
    hoursText: T('Open 24 hours, with a 24-hour Bonjour shop.', 'Rund um die Uhr geöffnet, mit 24-Stunden-Shop (Bonjour).'),
    note: T('The easiest place to fill up. Attendants pump for you; a few rand tip is normal.', 'Die einfachste Tankstelle. Tankwarte tanken für Sie, ein paar Rand Trinkgeld sind üblich.') },

  // Health
  { id: 'hosp-hdp', cat: 'health', name: 'Hoedspruit Private Hospital', lat: null, lon: null, km: 8, min: 20, approx: true, mapQuery: 'Hoedspruit Private Hospital',
    note: T('A 72-bed hospital opened in Hoedspruit in November 2024, with a 24-hour emergency unit listed by local sources. We could not verify its phone number, so ask your host for the direct line.', 'Ein Krankenhaus mit 72 Betten, im November 2024 in Hoedspruit eröffnet, mit 24-Stunden-Notaufnahme laut lokalen Quellen. Die Telefonnummer konnten wir nicht bestätigen, fragen Sie bei {host} nach der Direktnummer.') },
  { id: 'pharm-spar', cat: 'health', name: 'Hoedspruit Apteek (Spar complex)', lat: -24.3531, lon: 30.9498, km: 8, min: 20, phone: '+27157932318',
    note: T('Pharmacy on the main road.', 'Apotheke an der Hauptstraße.') },
  { id: 'pharm-pnp', cat: 'health', name: 'Alpha Pharmacy (Pick n Pay centre)', lat: -24.3515, lon: 30.9585, km: 7, min: 20, phone: '+27157931427',
    note: T('Pharmacy at the Pick n Pay centre.', 'Apotheke im Pick-n-Pay-Zentrum.') },
  { id: 'hosp-tintswalo', cat: 'health', name: 'Tintswalo Hospital, Acornhoek', lat: -24.5904, lon: 31.0611, km: 40, min: 50, phone: '+27137958600',
    note: T('Government hospital in Acornhoek, about 50 minutes away.', 'Staatliches Krankenhaus in Acornhoek, etwa 50 Minuten entfernt.') },
  { id: 'hosp-tzaneen', cat: 'health', name: 'Mediclinic Tzaneen (private)', lat: -23.8230, lon: 30.1527, km: 125, min: 130, phone: '+27861201140',
    note: T('Private hospital, about two hours away.', 'Privatkrankenhaus, etwa zwei Stunden entfernt.') },
  { id: 'hosp-nelspruit', cat: 'health', name: 'Mediclinic Nelspruit (private)', lat: -25.4944, lon: 30.9620, km: 169, min: 170, phone: '+27137590645',
    note: T('Private hospital with an emergency unit, nearly three hours away. The number given is the emergency unit.', 'Privatkrankenhaus mit Notaufnahme, knapp drei Stunden entfernt. Die Nummer gehört zur Notaufnahme.') },

  // Kruger and sights
  { id: 'orpen', cat: 'sights', name: 'Kruger Park: Orpen Gate', lat: -24.4813, lon: 31.3904, km: 80, min: 100,
    note: T('The nearest Kruger gate. Check the gate times below and the entry rules with SANParks.', 'Das nächste Kruger-Tor. Prüfen Sie die Torzeiten unten und die Einlassregeln bei SANParks.') },
  { id: 'phalaborwa', cat: 'sights', name: 'Kruger Park: Phalaborwa Gate', lat: -23.9457, lon: 31.1661, km: 84, min: 85,
    note: T('Northern gate, on the edge of Phalaborwa town.', 'Nördliches Tor am Rand der Stadt Phalaborwa.') },
  { id: 'hesc', cat: 'sights', name: 'Hoedspruit Endangered Species Centre', lat: -24.5065, lon: 31.0498, km: 30, min: 50,
    note: T('Conservation centre with guided tours. Book ahead through your host.', 'Artenschutzzentrum mit Führungen. Buchen Sie vorab über {host}.') },
  { id: 'moholoholo', cat: 'sights', name: 'Moholoholo Wildlife Rehabilitation Centre', lat: -24.5147, lon: 30.9042, km: 35, min: 50,
    note: T('Rehabilitation centre for injured and orphaned wildlife.', 'Auffangstation für verletzte und verwaiste Wildtiere.') },
  { id: 'rondavels', cat: 'sights', name: 'Blyde River Canyon: Three Rondavels', lat: -24.5737, lon: 30.7989, km: 97, min: 115,
    note: T('One of the great views of the Panorama Route. Plan a full day.', 'Eine der großen Aussichten der Panoramaroute. Planen Sie einen ganzen Tag ein.') },
  { id: 'bourkes', cat: 'sights', name: "Bourke's Luck Potholes", lat: -24.6728, lon: 30.8071, km: 107, min: 120,
    note: T('Water-carved potholes on the Panorama Route.', 'Vom Wasser geformte Strudellöcher an der Panoramaroute.') },
  { id: 'godswindow', cat: 'sights', name: "God's Window", lat: -24.8764, lon: 30.8891, km: 119, min: 130,
    note: T('The classic Lowveld viewpoint, best early in the day.', 'Der klassische Aussichtspunkt über dem Lowveld, am besten früh am Tag.') },

  // Airports
  { id: 'hds', cat: 'air', name: 'Hoedspruit Eastgate Airport (HDS)', lat: -24.3839, lon: 31.0467, km: 20, min: 30, minLow: 25,
    note: T('The closest airport. Airlink flies here from Johannesburg and Cape Town; check the current timetable. Car hire is available at the airport.', 'Der nächstgelegene Flughafen. Airlink fliegt ab Johannesburg und Kapstadt; prüfen Sie den aktuellen Flugplan. Am Flughafen gibt es Mietwagen.') },
  { id: 'phw', cat: 'air', name: 'Phalaborwa Airport (PHW)', lat: -23.9363, lon: 31.1552, km: 84, min: 85,
    note: T('Smaller airport to the north. Ask your host before relying on it.', 'Kleinerer Flughafen im Norden. Fragen Sie vorab bei {host} nach.') },
  { id: 'mqp', cat: 'air', name: 'Kruger Mpumalanga International (MQP)', lat: -25.3817, lon: 31.1070, km: 147, min: 165,
    note: T('Nelspruit airport. Hire a car and drive about three hours.', 'Flughafen Nelspruit. Mietwagen nehmen und rund drei Stunden fahren.') },
  { id: 'szk', cat: 'air', name: 'Skukuza Airport (SZK)', lat: -24.9612, lon: 31.5900, km: 146, min: 170,
    note: T('Inside Kruger Park.', 'Im Kruger-Nationalpark.') },
  { id: 'ptg', cat: 'air', name: 'Polokwane International (PTG)', lat: -23.8450, lon: 29.4532, km: 226, min: 230,
    note: T('Polokwane, to the west.', 'Polokwane, im Westen.') },
  { id: 'jnb', cat: 'air', name: 'OR Tambo International (JNB)', lat: -26.1360, lon: 28.2450, km: 435, min: 360,
    note: T('Johannesburg. Most visitors fly on to Hoedspruit; driving takes six hours or more.', 'Johannesburg. Die meisten fliegen weiter nach Hoedspruit; die Fahrt dauert sechs Stunden oder mehr.') },
];

export const CATS = {
  eat: { icon: 'ph-fork-knife', label: T('Eat and drink', 'Essen und Trinken') },
  shop: { icon: 'ph-shopping-cart', label: T('Shops and fuel', 'Einkaufen und Tanken') },
  health: { icon: 'ph-first-aid-kit', label: T('Health', 'Gesundheit') },
  sights: { icon: 'ph-binoculars', label: T('Kruger and sights', 'Kruger und Sehenswertes') },
  air: { icon: 'ph-airplane-tilt', label: T('Airports', 'Flughäfen') },
};

/* Arrival options for the Journey tab. */
export const ROUTES = {
  hds: {
    icon: 'ph-airplane-landing', airport: 'hds', drive: 30, buffer: 30,
    title: T('Fly to Hoedspruit', 'Flug nach Hoedspruit'), code: 'HDS',
    summary: T('The easy way in. About 25 to 30 minutes from the airport to your lodge.', 'Der bequeme Weg. Vom Flughafen zur Lodge sind es etwa 25 bis 30 Minuten.'),
    tips: [
      T('Airlink flies to Hoedspruit Eastgate from Johannesburg (just under an hour) and Cape Town. Check the current timetable, because routes change.', 'Airlink fliegt Hoedspruit Eastgate ab Johannesburg (knapp eine Stunde) und Kapstadt an. Prüfen Sie den aktuellen Flugplan, denn Verbindungen ändern sich.'),
      T('Car hire is available at the airport. Book ahead in school holidays.', 'Am Flughafen gibt es Mietwagen. Buchen Sie in den Schulferien rechtzeitig.'),
      T('Send your host your flight number so they know when to expect you.', 'Senden Sie {host} Ihre Flugnummer, damit klar ist, wann Sie ankommen.'),
    ],
  },
  mqp: {
    icon: 'ph-car', airport: 'mqp', drive: 165, buffer: 40,
    title: T('Fly to Nelspruit and drive', 'Flug nach Nelspruit und Mietwagen'), code: 'MQP',
    summary: T('Kruger Mpumalanga International, then about 2 hours 45 minutes by road (147 km), via the R538 and R40.', 'Kruger Mpumalanga International, danach etwa 2 Stunden 45 Minuten Fahrt (147 km), über die R538 und die R40.'),
    tips: [
      T('Hire a car at the airport and set off in good time, so you arrive in daylight.', 'Mieten Sie am Flughafen ein Auto und fahren Sie rechtzeitig los, damit Sie bei Tageslicht ankommen.'),
      T('Fill the tank and stock up in Hoedspruit town, 7 km from the lodge.', 'Tanken und einkaufen können Sie in Hoedspruit, 7 km von der Lodge entfernt.'),
    ],
  },
  jnb: {
    icon: 'ph-road-horizon', airport: 'jnb', drive: 360, buffer: 45,
    title: T('Drive from Johannesburg', 'Mit dem Auto ab Johannesburg'), code: 'JNB',
    summary: T('About 435 km and 6 hours without stops. Plan for 7 hours, and start early.', 'Etwa 435 km und 6 Stunden ohne Pausen. Rechnen Sie mit 7 Stunden und starten Sie früh.'),
    tips: [
      T('Leave early so you arrive before sunset. Avoid driving after dark: animals, pedestrians and poor lighting are the risks.', 'Starten Sie früh, damit Sie vor Sonnenuntergang ankommen. Vermeiden Sie Fahrten im Dunkeln: Tiere, Fußgänger und schlechte Beleuchtung sind die Gefahr.'),
      T('Most visitors save the drive and fly on to Hoedspruit instead (about an hour).', 'Die meisten sparen sich die Fahrt und fliegen weiter nach Hoedspruit (etwa eine Stunde).'),
    ],
  },
};

/* Kruger Park gate times by month (index 0 is January): [entrance gates open, camps and gates close]. */
export const GATES = [
  ['05:30', '18:30'], ['05:30', '18:30'], ['05:30', '18:00'], ['06:00', '18:00'], ['06:00', '17:30'], ['06:00', '17:30'],
  ['06:00', '17:30'], ['06:00', '18:00'], ['06:00', '18:00'], ['05:30', '18:00'], ['05:30', '18:30'], ['05:30', '18:30'],
];

/* Average weather by month, 2016 to 2025, from reanalysis data for the lodge's coordinates. */
export const CLIMATE = {
  1: { hi: 30.6, lo: 20.6, rain: 109, days: 10.4, hot: 2.9 },
  2: { hi: 30.4, lo: 20.9, rain: 121, days: 11.2, hot: 2.8 },
  3: { hi: 30.2, lo: 19.9, rain: 40, days: 6.2, hot: 2.4 },
  4: { hi: 28.4, lo: 17.6, rain: 34, days: 4.5, hot: 0.5 },
  5: { hi: 26.6, lo: 14.6, rain: 14, days: 2.0, hot: 0 },
  6: { hi: 24.9, lo: 11.8, rain: 6, days: 0.8, hot: 0 },
  7: { hi: 24.8, lo: 11.5, rain: 4, days: 0.9, hot: 0 },
  8: { hi: 27.3, lo: 13.6, rain: 4, days: 0.8, hot: 1.1 },
  9: { hi: 29.6, lo: 16.1, rain: 9, days: 1.5, hot: 4.2 },
  10: { hi: 29.9, lo: 17.3, rain: 28, days: 4.5, hot: 6.5 },
  11: { hi: 30.6, lo: 19.0, rain: 59, days: 6.8, hot: 6.7 },
  12: { hi: 31.1, lo: 20.5, rain: 90, days: 11.0, hot: 7.3 },
};

/* Emergency numbers. Checked against the Hoedspruit community directory and several national lists. */
export const EMERGENCY = [
  { group: T('Medical', 'Medizinische Notfälle'), items: [
    { name: T('All emergencies from a mobile phone', 'Alle Notfälle vom Handy'), tel: '112' },
    { name: T('ER24 private ambulance', 'ER24, privater Rettungsdienst'), tel: '084124' },
    { name: T('Netcare 911 private ambulance', 'Netcare 911, privater Rettungsdienst'), tel: '082911' },
    { name: T('Hoedspruit Medical Rescue', 'Hoedspruit Medical Rescue'), tel: '0721700864' },
    { name: T('Public ambulance and fire', 'Öffentlicher Rettungsdienst und Feuerwehr'), tel: '10177' },
    { name: T('Poison Information Centre, 24 hours', 'Giftnotruf, 24 Stunden'), tel: '0861555777' },
  ] },
  { group: T('Police and security', 'Polizei und Sicherheit'), items: [
    { name: T('Police emergency', 'Polizei-Notruf'), tel: '10111' },
    { name: T('Hoedspruit police station', 'Polizeistation Hoedspruit'), tel: '0157994000' },
    { name: T('Hoedspruit Farmwatch and Townwatch (WhatsApp too)', 'Hoedspruit Farmwatch und Townwatch (auch WhatsApp)'), tel: '0723100032' },
  ] },
  { group: T('Inside Kruger Park', 'Im Kruger-Nationalpark'), items: [
    { name: T('Kruger Park emergency call centre', 'Notrufzentrale Kruger-Park'), tel: '0137354325' },
  ] },
];

/* Wildlife for the Passport.
   zone: estate (on or around the estate) | excursion (met on regional day trips, such as Kruger Park).
   grp: hoofed | hunter | small | bird | giant | reptile. size: s | m | l. act: day | night | both.
   likely: daily | often | sometimes | rare. Rare estate animals are reported in the wider Hoedspruit area.
   sensitive: true means the app never asks for, stores or suggests a place for that animal.
   look: how to recognise it, used for the "help me identify" browser and by young explorers. */
export const SPECIES = [
  // On the estate: hoofed animals
  { id: 'giraffe', zone: 'estate', grp: 'hoofed', size: 'l', act: 'day', icon: 'ph-paw-print', photo: 'sp-giraffe.jpg', likely: 'often', best: T('Morning and late afternoon', 'Morgens und am späten Nachmittag'),
    name: T('Giraffe', 'Giraffe'),
    look: T('Very tall, with a long neck and brown patches.', 'Sehr hoch, mit langem Hals und braunen Flecken.'),
    fact: T('The tallest animal on earth. Adults reach about 5 metres and pull acacia leaves in with a tongue about 45 cm long.', 'Das höchste Landtier der Erde. Erwachsene werden etwa 5 Meter hoch und greifen Akazienblätter mit einer rund 45 cm langen Zunge.'),
    care: T('Calm, but they kick hard. Keep your distance and never walk towards one.', 'Ruhig, aber sie treten kräftig aus. Halten Sie Abstand und gehen Sie nie auf eine Giraffe zu.') },
  { id: 'zebra', zone: 'estate', grp: 'hoofed', size: 'l', act: 'day', icon: 'ph-paw-print', photo: 'sp-zebra.jpg', likely: 'often', best: T('Morning and afternoon, often at water', 'Morgens und nachmittags, oft am Wasser'),
    name: T('Plains zebra', 'Steppenzebra'),
    look: T('Black and white stripes. No two zebras match.', 'Schwarz-weiße Streifen. Kein Zebra gleicht dem anderen.'),
    fact: T("Every zebra's stripe pattern is unique, like a fingerprint. Herds often graze alongside wildebeest and impala.", 'Das Streifenmuster jedes Zebras ist einzigartig, wie ein Fingerabdruck. Herden grasen oft zusammen mit Gnus und Impalas.'),
    care: T('Nervous and quick to bolt. Move slowly and keep your voice down.', 'Nervös und schnell auf der Flucht. Bewegen Sie sich langsam und sprechen Sie leise.') },
  { id: 'wildebeest', zone: 'estate', grp: 'hoofed', size: 'l', act: 'day', icon: 'ph-paw-print', photo: 'sp-wildebeest.jpg', likely: 'often', best: T('Morning and afternoon', 'Morgens und nachmittags'),
    name: T('Blue wildebeest', 'Streifengnu'),
    look: T('Dark and shaggy, with a beard, a sloping back and curved horns.', 'Dunkel und zottelig, mit Bart, abfallendem Rücken und gebogenen Hörnern.'),
    fact: T('Bearded and shaggy, often seen with zebra. Calves can stand within minutes of birth and run within hours.', 'Bärtig und zottelig, oft zusammen mit Zebras. Kälber stehen wenige Minuten nach der Geburt und laufen nach wenigen Stunden.'),
    care: T('Bulls can be touchy. Never approach on foot.', 'Bullen können gereizt reagieren. Nähern Sie sich nie zu Fuß.') },
  { id: 'kudu', zone: 'estate', grp: 'hoofed', size: 'l', act: 'both', icon: 'ph-paw-print', photo: 'sp-kudu.jpg', likely: 'often', best: T('Dawn and dusk', 'Morgen- und Abenddämmerung'),
    name: T('Greater kudu', 'Großer Kudu'),
    look: T('Grey-brown with thin white stripes and big round ears. Bulls have spiral horns.', 'Graubraun mit dünnen weißen Streifen und großen runden Ohren. Die Bullen tragen Spiralhörner.'),
    fact: T('Bulls carry spiralling horns well over a metre long. Shy animals that can leap high fences.', 'Die Bullen tragen spiralig gedrehte Hörner von weit über einem Meter. Scheue Tiere, die hohe Zäune überspringen können.'),
    care: T('Kudu step onto roads at dusk. Drive slowly and watch the verges.', 'Kudus treten in der Dämmerung auf die Straße. Fahren Sie langsam und beobachten Sie die Wegränder.') },
  { id: 'impala', zone: 'estate', grp: 'hoofed', size: 'm', act: 'day', icon: 'ph-paw-print', photo: 'sp-impala.jpg', likely: 'daily', best: T('All day, most active early and late', 'Ganztägig, am aktivsten früh und spät'),
    name: T('Impala', 'Impala'),
    look: T('Reddish-brown, with a black stripe on each side of the white rump. Males have lyre-shaped horns.', 'Rötlich-braun, mit einem schwarzen Streifen auf jeder Seite des weißen Hinterteils. Böcke haben leierförmige Hörner.'),
    fact: T('The most common antelope in the Lowveld. Lambs arrive around the start of the rains, often from November.', 'Die häufigste Antilope im Lowveld. Die Lämmer kommen zu Beginn der Regenzeit zur Welt, oft ab November.'),
    care: T("The first animals you'll meet. Don't startle herds on the road.", 'Meist die ersten Tiere, die Sie sehen. Erschrecken Sie Herden auf der Straße nicht.') },
  { id: 'nyala', zone: 'estate', grp: 'hoofed', size: 'm', act: 'both', icon: 'ph-paw-print', photo: 'sp-nyala.jpg', likely: 'often', best: T('Early morning and dusk, near thicket and water', 'Früh am Morgen und in der Dämmerung, nahe Dickicht und Wasser'),
    name: T('Nyala', 'Nyala'),
    look: T('Males are dark and shaggy with white stripes. Females are chestnut with thin stripes.', 'Böcke sind dunkel und zottelig mit weißen Streifen. Weibchen sind kastanienbraun mit dünnen Streifen.'),
    fact: T('A shy antelope of the thick bush near water. Males and females look so different that they can seem like two species.', 'Eine scheue Antilope im dichten Busch nahe am Wasser. Böcke und Weibchen sehen so verschieden aus, dass man sie für zwei Arten halten könnte.'),
    care: T('Look along the edge of the riverbed at first and last light.', 'Schauen Sie bei Sonnenauf- und -untergang am Rand des Flussbetts.') },
  { id: 'waterbuck', zone: 'estate', grp: 'hoofed', size: 'l', act: 'day', icon: 'ph-paw-print', photo: 'sp-waterbuck.jpg', likely: 'sometimes', best: T('Morning and evening, at the riverbed', 'Morgens und abends am Flussbett'),
    name: T('Waterbuck', 'Wasserbock'),
    look: T('Shaggy grey-brown coat and a white ring on the rump. Males have long horns.', 'Zotteliges graubraunes Fell und ein weißer Ring auf dem Hinterteil. Böcke haben lange Hörner.'),
    fact: T('It stays close to water, and the riverbed below the lodges is a good place to look.', 'Es bleibt nahe am Wasser, und das Flussbett unterhalb der Lodges ist ein guter Ort zum Schauen.'),
    care: T('Males have long horns. Stay well back.', 'Die Böcke haben lange Hörner. Bleiben Sie weit zurück.') },
  { id: 'bushbuck', zone: 'estate', grp: 'hoofed', size: 'm', act: 'both', icon: 'ph-paw-print', photo: 'sp-bushbuck.jpg', likely: 'sometimes', best: T('Dusk and night', 'Dämmerung und Nacht'),
    name: T('Bushbuck', 'Buschbock'),
    look: T('Chestnut with white spots and stripes. Shy and low to the ground.', 'Kastanienbraun mit weißen Flecken und Streifen. Scheu und flach geduckt.'),
    fact: T('A shy antelope that hides in dense riverside bush and is active mostly at dusk and at night.', 'Eine scheue Antilope, die sich im dichten Ufergebüsch versteckt und meist in der Dämmerung und nachts aktiv ist.'),
    care: T('Rarely seen in the open. Use a torch after dark.', 'Selten in offenem Gelände zu sehen. Nutzen Sie nach Einbruch der Dunkelheit eine Taschenlampe.') },
  { id: 'duiker', zone: 'estate', grp: 'hoofed', size: 's', act: 'both', icon: 'ph-paw-print', photo: 'sp-duiker.jpg', likely: 'sometimes', best: T('Early and late', 'Früh und spät'),
    name: T('Common duiker', 'Kronenducker'),
    look: T('Small and grey-brown, with a tuft on the forehead. It darts into cover.', 'Klein und graubraun, mit einem Haarschopf auf der Stirn. Es huscht ins Gebüsch.'),
    fact: T("'Duiker' is Afrikaans for 'diver', because it dives into the bush when startled.", "„Duiker“ ist Afrikaans für „Taucher“, weil es bei Gefahr im Gebüsch abtaucht."),
    care: T('Easy to miss. Look low, at the edge of the bush.', 'Leicht zu übersehen. Schauen Sie tief, am Rand des Gebüschs.') },
  { id: 'warthog', zone: 'estate', grp: 'hoofed', size: 'm', act: 'day', icon: 'ph-paw-print', photo: 'sp-warthog.jpg', likely: 'often', best: T('Daytime', 'Tagsüber'),
    name: T('Warthog', 'Warzenschwein'),
    look: T('Grey and pig-like, with tusks and a tail held straight up when it runs.', 'Grau und schweineartig, mit Hauern und senkrecht aufgestelltem Schwanz beim Rennen.'),
    fact: T('Sleeps in burrows and backs in, so the tusks face out.', 'Schläft in Erdbauen und geht rückwärts hinein, damit die Hauer nach außen zeigen.'),
    care: T('The tusks are sharp. Keep well away from sows with piglets.', 'Die Hauer sind scharf. Halten Sie viel Abstand zu Bachen mit Frischlingen.') },

  // On the estate: hunters and others
  { id: 'monkey', zone: 'estate', grp: 'small', size: 's', act: 'day', icon: 'ph-paw-print', photo: 'sp-monkey.jpg', likely: 'sometimes', best: T('Daytime', 'Tagsüber'),
    name: T('Vervet monkey', 'Grüne Meerkatze'),
    look: T('A small grey monkey with a black face and a long tail.', 'Ein kleiner grauer Affe mit schwarzem Gesicht und langem Schwanz.'),
    fact: T('Clever and cheeky. They learn to open doors and raid kitchens.', 'Clever und frech. Sie lernen, Türen zu öffnen und Küchen zu plündern.'),
    care: T('Never feed them. Close doors and windows when you go out, and keep food and bins secure.', 'Füttern Sie sie nie. Schließen Sie Türen und Fenster, wenn Sie weggehen, und sichern Sie Essen und Mülleimer.') },
  { id: 'leopard', zone: 'estate', grp: 'hunter', size: 'l', act: 'night', sensitive: true, icon: 'ph-paw-print', photo: 'sp-leopard.jpg', likely: 'rare', best: T('Night and the hours around it', 'Nachts und in den Stunden davor und danach'),
    name: T('Leopard', 'Leopard'),
    look: T('Golden coat with dark rosettes. Usually seen at night or resting in a tree.', 'Goldenes Fell mit dunklen Rosetten. Meist nachts zu sehen oder auf einem Baum ruhend.'),
    fact: T('Reported on wildlife estates around Hoedspruit and seldom seen. Mostly active at night.', 'Auf den Wildreservats-Siedlungen rund um Hoedspruit gemeldet und selten zu sehen. Meist nachtaktiv.'),
    care: T('Never walk alone after dark. If you see one, stay calm, do not run, keep your distance and tell your host.', 'Gehen Sie nachts nie allein zu Fuß. Wenn Sie einen sehen: ruhig bleiben, nicht rennen, Abstand halten und {host} informieren.') },
  { id: 'wilddog', zone: 'estate', grp: 'hunter', size: 'm', act: 'day', sensitive: true, icon: 'ph-paw-print', photo: 'sp-wilddog.jpg', likely: 'rare', best: T('Early morning', 'Früh am Morgen'),
    name: T('African wild dog', 'Afrikanischer Wildhund'),
    look: T('Large round ears and a patchy coat of black, tan and white.', 'Große runde Ohren und ein gescheckter Pelz in Schwarz, Braun und Weiß.'),
    fact: T('Occasionally reported in the Hoedspruit area. Wild dogs hunt in packs and are endangered.', 'Gelegentlich in der Gegend von Hoedspruit gemeldet. Wildhunde jagen im Rudel und sind bedroht.'),
    care: T('A rare treat. Keep food and rubbish indoors overnight.', 'Eine Seltenheit. Lassen Sie Essen und Müll über Nacht nicht draußen.') },
  { id: 'hyena', zone: 'estate', grp: 'hunter', size: 'm', act: 'night', icon: 'ph-paw-print', photo: 'sp-hyena.jpg', likely: 'rare', best: T('Night and early morning', 'Nachts und früh am Morgen'),
    name: T('Spotted hyena', 'Tüpfelhyäne'),
    look: T('A sloping back, a spotted coat and round ears. Its whooping call carries far at night.', 'Abfallender Rücken, getupftes Fell und runde Ohren. Ihr Ruf trägt nachts weit.'),
    fact: T('Occasionally reported in the Hoedspruit area. Clans are led by females, and the whoop call is a way of keeping in touch.', 'Gelegentlich in der Gegend von Hoedspruit gemeldet. Die Clans werden von Weibchen angeführt, und der Ruf hält den Kontakt.'),
    care: T('Keep food and rubbish indoors overnight and never leave bins outside.', 'Lassen Sie Essen und Müll über Nacht nicht draußen und stellen Sie keine Mülleimer vor die Tür.') },
  { id: 'bushbaby', zone: 'estate', grp: 'small', size: 's', act: 'night', icon: 'ph-moon-stars', photo: 'sp-bushbaby.jpg', likely: 'sometimes', best: T('After dark, from the patio', 'Nach Einbruch der Dunkelheit, von der Terrasse'),
    name: T('Bushbaby', 'Buschbaby'),
    look: T('Tiny, with huge eyes and a fluffy tail. You will probably hear it before you see it.', 'Winzig, mit riesigen Augen und buschigem Schwanz. Meist hören Sie es, bevor Sie es sehen.'),
    fact: T('A small tree-dwelling primate whose cry sounds like a crying baby.', 'Ein kleiner baumbewohnender Primat, dessen Ruf wie ein weinendes Baby klingt.'),
    care: T('Listen from the patio. Do not follow it into the dark.', 'Lauschen Sie von der Terrasse aus. Folgen Sie ihm nicht in die Dunkelheit.') },
  { id: 'honeybadger', zone: 'estate', grp: 'hunter', size: 's', act: 'night', icon: 'ph-moon-stars', photo: 'sp-honeybadger.jpg', likely: 'rare', best: T('After dark, from the patio', 'Nach Einbruch der Dunkelheit, von der Terrasse'),
    name: T('Honey badger', 'Honigdachs'),
    look: T('Low and sturdy, dark below with a pale grey-white back.', 'Niedrig und kräftig, unten dunkel, mit hellgrau-weißem Rücken.'),
    fact: T('Famously fearless for its size, strong, clever and good at opening latches.', 'Bekannt für seine Furchtlosigkeit, stark, klug und geschickt im Öffnen von Verschlüssen.'),
    care: T('Do not approach it. Secure bins and doors at night.', 'Nähern Sie sich nicht. Sichern Sie nachts Mülleimer und Türen.') },
  { id: 'porcupine', zone: 'estate', grp: 'small', size: 'm', act: 'night', icon: 'ph-moon-stars', photo: 'sp-porcupine.jpg', likely: 'sometimes', best: T('After dark, from the patio', 'Nach Einbruch der Dunkelheit, von der Terrasse'),
    name: T('Cape porcupine', 'Kap-Stachelschwein'),
    look: T('Low and round, with long black and white banded quills.', 'Niedrig und rundlich, mit langen schwarz-weiß geringelten Stacheln.'),
    fact: T("Africa's largest rodent. It forages at night and its quills are modified hairs.", 'Das größte Nagetier Afrikas. Es sucht nachts nach Nahrung, und seine Stacheln sind umgebildete Haare.'),
    care: T('Look, do not touch. Loose quills cause painful wounds.', 'Nur ansehen, nicht berühren. Lose Stacheln verursachen schmerzhafte Wunden.') },
  { id: 'civet', zone: 'estate', grp: 'hunter', size: 'm', act: 'night', icon: 'ph-moon-stars', photo: 'sp-civet.jpg', likely: 'sometimes', best: T('After dark, from the patio', 'Nach Einbruch der Dunkelheit, von der Terrasse'),
    name: T('African civet', 'Afrikanische Zibetkatze'),
    look: T('Dog-sized, with black and white markings and a dark mask.', 'Hundegroß, mit schwarz-weißer Zeichnung und dunkler Maske.'),
    fact: T('A solitary night forager that eats fruit, insects and small animals.', 'Ein Einzelgänger, der nachts nach Früchten, Insekten und Kleintieren sucht.'),
    care: T('Watch from the patio. Keep food and rubbish indoors.', 'Beobachten Sie von der Terrasse aus. Lassen Sie Essen und Müll nicht draußen.') },

  // On the estate: birds (names stay in English in German, as in most field guides)
  { id: 'roller', zone: 'estate', grp: 'bird', size: 's', act: 'day', icon: 'ph-bird', photo: 'sp-roller.jpg', likely: 'often', best: T('Early morning, on open branches', 'Früh am Morgen, auf freien Ästen'),
    name: T('Lilac-breasted roller', 'Gabelracke (Lilac-breasted Roller)'),
    look: T('A lilac chest, a turquoise belly and long tail streamers.', 'Lila Brust, türkisfarbener Bauch und lange Schwanzspieße.'),
    fact: T('It dives from a perch to catch insects. The name comes from the rolling, tumbling display flights.', 'Es stößt von einer Warte herab, um Insekten zu fangen. Der Name stammt von den rollenden Balzflügen.'),
    care: T('Bring binoculars. It often sits on open branches near the road.', 'Nehmen Sie ein Fernglas mit. Es sitzt oft auf freien Ästen nahe der Straße.') },
  { id: 'barbet', zone: 'estate', grp: 'bird', size: 's', act: 'day', icon: 'ph-bird', photo: 'sp-barbet.jpg', likely: 'daily', best: T('Early morning', 'Früh am Morgen'),
    name: T('Crested barbet', 'Haubenbartvogel (Crested Barbet)'),
    look: T('Chunky, yellow and red-speckled, with a black crest.', 'Kompakt, gelb und rot gesprenkelt, mit schwarzer Haube.'),
    fact: T('Its long, dry trill is one of the most common sounds of the bushveld.', 'Sein langer, trockener Triller gehört zu den häufigsten Geräuschen im Buschveld.'),
    care: T('Listen first, then look in the tops of the tall trees.', 'Erst lauschen, dann in die Kronen der hohen Bäume schauen.') },
  { id: 'starling', zone: 'estate', grp: 'bird', size: 's', act: 'day', icon: 'ph-bird', photo: 'sp-starling.jpg', likely: 'daily', best: T('Daytime, often on the ground near the lodges', 'Tagsüber, oft am Boden nahe der Lodges'),
    name: T("Burchell's starling", "Burchell's Starling"),
    look: T('A large, glossy blue-green starling with a long tail and a pale eye.', 'Ein großer, glänzender blaugrüner Star mit langem Schwanz und hellem Auge.'),
    fact: T('A bold, sociable bird that forages on the ground near the lodges.', 'Ein dreister, geselliger Vogel, der am Boden nahe der Lodges nach Futter sucht.'),
    care: T('Please do not feed it. Wild birds are healthier on their own food.', 'Bitte nicht füttern. Wildvögel sind mit ihrer natürlichen Nahrung gesünder.') },
  { id: 'hornbill', zone: 'estate', grp: 'bird', size: 's', act: 'day', icon: 'ph-bird', photo: 'sp-hornbill.jpg', likely: 'often', best: T('Morning and afternoon', 'Morgens und nachmittags'),
    name: T('Yellow-billed hornbill', 'Gelbschnabeltoko (Yellow-billed Hornbill)'),
    look: T('A long, curved yellow bill and a speckled back.', 'Langer, gebogener gelber Schnabel und gesprenkelter Rücken.'),
    fact: T('Hornbills nest in tree holes, and the female is sealed in with mud while she raises the chicks.', 'Toko-Vögel nisten in Baumhöhlen, und das Weibchen wird beim Aufziehen der Küken mit Lehm eingemauert.'),
    care: T('Common across the Lowveld bush. Look on the ground and in low branches.', 'Im Busch des Lowveld häufig. Schauen Sie auf den Boden und in niedrige Äste.') },
  { id: 'goaway', zone: 'estate', grp: 'bird', size: 's', act: 'day', icon: 'ph-bird', photo: 'sp-goaway.jpg', likely: 'often', best: T('Morning and afternoon', 'Morgens und nachmittags'),
    name: T('Grey go-away-bird', 'Graulärmvogel (Grey Go-away-bird)'),
    look: T('A slim grey bird with a pointed crest.', 'Ein schlanker grauer Vogel mit spitzer Haube.'),
    fact: T('Its harsh call sounds like "go away", which is how it got its name.', 'Sein schriller Ruf klingt wie „go away“, daher der Name.'),
    care: T('Often the first to sound the alarm when a predator is near.', 'Oft der Erste, der Alarm schlägt, wenn ein Raubtier in der Nähe ist.') },

  // Excursions: animals met on day trips (Kruger Park, the Panorama Route and conservation centres)
  { id: 'elephant', zone: 'excursion', grp: 'giant', size: 'l', act: 'day', icon: 'ph-paw-print', photo: 'sp-elephant.jpg', likely: 'often', best: T('Near water, mornings and afternoons', 'In Wassernähe, morgens und nachmittags'),
    name: T('African elephant', 'Afrikanischer Elefant'),
    look: T('The largest land animal, grey, with a trunk and large ears.', 'Das größte Landtier, grau, mit Rüssel und großen Ohren.'),
    fact: T('Herds are led by an experienced older female.', 'Herden werden von einer erfahrenen älteren Kuh angeführt.'),
    care: T('In a park, stay in your vehicle with the engine off and give elephants space. Back away calmly if one flaps its ears or mock-charges.', 'Bleiben Sie im Park im Fahrzeug, Motor aus, und geben Sie Elefanten Platz. Weichen Sie ruhig zurück, wenn einer mit den Ohren schlägt oder eine Scheinattacke macht.') },
  { id: 'lion', zone: 'excursion', grp: 'hunter', size: 'l', act: 'both', icon: 'ph-paw-print', photo: 'sp-lion.jpg', likely: 'sometimes', best: T('Dawn and dusk. They rest through the heat.', 'Morgens und abends. Sie ruhen in der Hitze.'),
    name: T('Lion', 'Löwe'),
    look: T('A tawny cat, and the males have a mane.', 'Eine sandfarbene Großkatze, die Männchen mit Mähne.'),
    fact: T("Africa's most social big cat. Prides are built around related females.", 'Die geselligste Großkatze Afrikas. Rudel bestehen aus verwandten Weibchen.'),
    care: T('Never leave your vehicle in a park, and never get out to take a photo.', 'Verlassen Sie im Park nie das Fahrzeug, auch nicht für ein Foto.') },
  { id: 'buffalo', zone: 'excursion', grp: 'hoofed', size: 'l', act: 'both', icon: 'ph-paw-print', photo: 'sp-buffalo.jpg', likely: 'often', best: T('Morning and evening, near water', 'Morgens und abends, in Wassernähe'),
    name: T('African buffalo', 'Afrikanischer Büffel'),
    look: T('A heavy black bovine with a broad, curved horn boss.', 'Ein schweres schwarzes Rind mit breiter, gebogener Hornbasis.'),
    fact: T('Herds can number in the hundreds.', 'Herden können Hunderte Tiere zählen.'),
    care: T('Unpredictable and dangerous. Stay in your vehicle.', 'Unberechenbar und gefährlich. Bleiben Sie im Fahrzeug.') },
  { id: 'rhino', zone: 'excursion', grp: 'giant', size: 'l', act: 'day', sensitive: true, icon: 'ph-paw-print', photo: 'sp-rhino.jpg', likely: 'sometimes', best: T('Morning and afternoon', 'Morgens und nachmittags'),
    name: T('White rhino', 'Breitmaulnashorn'),
    look: T('A huge grey animal with two horns and a wide, square lip.', 'Ein riesiges graues Tier mit zwei Hörnern und breiter, eckiger Lippe.'),
    fact: T('A grazer. Rhinos are targeted by poachers, so guides and parks never share exact locations.', 'Ein Grasfresser. Nashörner werden von Wilderern gejagt, deshalb geben Guides und Parks nie genaue Orte weiter.'),
    care: T('Please do not post where or when you saw one. Photos are fine, but switch off location tags.', 'Bitte posten Sie nicht, wo oder wann Sie eines gesehen haben. Fotos sind in Ordnung, schalten Sie aber Ortungsdaten aus.') },
  { id: 'hippo', zone: 'excursion', grp: 'giant', size: 'l', act: 'both', icon: 'ph-paw-print', photo: 'sp-hippo.jpg', likely: 'often', best: T('In the water by day, on land at night', 'Tagsüber im Wasser, nachts an Land'),
    name: T('Hippopotamus', 'Flusspferd'),
    look: T('Round and grey, with eyes and nostrils above the water line.', 'Rund und grau, mit Augen und Nüstern über der Wasserlinie.'),
    fact: T('Spends the day in water and grazes on land at night.', 'Verbringt den Tag im Wasser und grast nachts an Land.'),
    care: T('Dangerous. Stay well back from the water and never get between a hippo and the water.', 'Gefährlich. Halten Sie großen Abstand zum Wasser und stellen Sie sich nie zwischen Flusspferd und Wasser.') },
  { id: 'croc', zone: 'excursion', grp: 'reptile', size: 'l', act: 'day', icon: 'ph-paw-print', photo: 'sp-croc.jpg', likely: 'often', best: T('Sunny mornings, on sandbanks', 'Sonnige Morgen, auf Sandbänken'),
    name: T('Nile crocodile', 'Nilkrokodil'),
    look: T('A long, armoured reptile that basks on sandbanks.', 'Ein langes, gepanzertes Reptil, das sich auf Sandbänken sonnt.'),
    fact: T('Basks on sandbanks and slides into the water when disturbed.', 'Sonnt sich auf Sandbänken und gleitet bei Störung ins Wasser.'),
    care: T('Never stand at the water edge, and never swim in rivers or dams.', 'Stellen Sie sich nie ans Wasser und baden Sie nie in Flüssen oder Stauseen.') },
];

export const BUSH_RULES = [
  T('Keep your distance and never walk towards an animal. Wild animals are not tame, however calm they look.', 'Halten Sie Abstand und gehen Sie nie auf ein Tier zu. Wildtiere sind nicht zahm, auch wenn sie ruhig wirken.'),
  T('Never feed wildlife. It makes animals bold and dangerous, and it is not allowed.', 'Füttern Sie nie Wildtiere. Das macht sie dreist und gefährlich und ist nicht erlaubt.'),
  T('No walking at night. After dark, use a torch, stay on lit paths and never go alone.', 'Keine Spaziergänge bei Nacht. Nach Einbruch der Dunkelheit Taschenlampe benutzen, auf beleuchteten Wegen bleiben und nie allein gehen.'),
  T('Look before you step. Wear closed shoes outside at dusk, use a torch at night and shake out shoes left outdoors.', 'Schauen Sie, wohin Sie treten. Tragen Sie abends draußen geschlossene Schuhe, nutzen Sie nachts eine Taschenlampe und schütteln Sie draußen stehende Schuhe aus.'),
  T('Close doors and windows when you go out. Monkeys are expert kitchen thieves.', 'Schließen Sie Türen und Fenster, wenn Sie weggehen. Affen sind geübte Küchendiebe.'),
  T('Drive slowly and give animals right of way. They step onto roads at dusk, and a wait costs you nothing.', 'Fahren Sie langsam und lassen Sie Tieren den Vortritt. In der Dämmerung treten sie auf die Straße, und Warten kostet nichts.'),
  T('If an animal blocks the road, wait quietly. Do not hoot, rev or edge forward.', 'Blockiert ein Tier die Straße, warten Sie ruhig. Nicht hupen, Gas geben oder vorrollen.'),
  T('Do not leave food, rubbish or braai leftovers outside overnight.', 'Lassen Sie Essen, Müll oder Braai-Reste nicht über Nacht draußen.'),
  T('Keep noise down. The animals and your neighbours on the estate will thank you.', 'Halten Sie den Lärm gering. Die Tiere und Ihre Nachbarn auf der Anlage werden es Ihnen danken.'),
];

/* Know before you go. Entry rules differ by language: German visitors get the German-specific version. */
export const KNOW = [
  { id: 'entry', icon: 'ph-identification-card', title: T('Passport and entry', 'Reisepass und Einreise'),
    body: {
      en: 'Entry rules depend on your passport, so check your own government\'s travel advice. In general South Africa asks for a passport that stays valid for at least 30 days after you leave and has two blank pages, plus proof that you are leaving again. Children need their own travel document, and officials can ask for extra papers such as a birth certificate. Rules change, so check the official sources before you fly.',
      de: 'Deutsche Staatsangehörige reisen für touristische Aufenthalte bis zu 90 Tage ohne Visum ein und müssen ein Rück- oder Weiterreiseticket vorweisen. In der Regel muss der Reisepass mindestens 30 Tage über die Ausreise hinaus gültig sein und zwei freie Seiten haben. Der Personalausweis genügt nicht. Kinder brauchen ein eigenes Reisedokument; bei der Einreise können zusätzliche Papiere wie eine Geburtsurkunde verlangt werden. Die Regeln ändern sich, prüfen Sie vor dem Flug die offiziellen Hinweise.' },
    links: { en: [['South African Home Affairs', 'https://www.dha.gov.za/']], de: [['Auswärtiges Amt: Südafrika', 'https://www.auswaertiges-amt.de/de/ReiseUndSicherheit/suedafrikasicherheit/208400'], ['ADAC: Einreise und Zoll', 'https://www.adac.de/reise-freizeit/reiseplanung/reiseziele/suedafrika/einreise-zoll/']] } },
  { id: 'health', icon: 'ph-first-aid', title: T('Health and malaria', 'Gesundheit und Malaria'),
    body: {
      en: 'Hoedspruit lies in the Lowveld, a region where malaria occurs, mostly in the warm, wet months (roughly October to May). Talk to a doctor or travel clinic about preventive tablets, ideally a few weeks before you travel. Use insect repellent with DEET at dusk and at night and wear long sleeves in the evening. If you get a fever, see a doctor, even up to six months after your trip. Check your routine vaccinations; hepatitis A is commonly recommended.',
      de: 'Hoedspruit liegt im Lowveld, einer Region mit Malariavorkommen, vor allem in den warmen, feuchten Monaten (etwa Oktober bis Mai). Lassen Sie sich von einer Ärztin, einem Arzt oder einem Tropeninstitut zur Prophylaxe beraten, am besten einige Wochen vor der Reise. Verwenden Sie abends und nachts Insektenschutz mit DEET und tragen Sie abends lange Kleidung. Bei Fieber gehen Sie zum Arzt, auch noch bis zu sechs Monate nach der Reise. Prüfen Sie Ihre Standardimpfungen; Hepatitis A wird häufig empfohlen.' },
    links: { en: [['Fit for Travel: South Africa', 'https://fitfortravel.scot.nhs.uk/destinations/africa/south-africa']], de: [['Centrum für Reisemedizin', 'https://www.crm.de/']] } },
  { id: 'insurance', icon: 'ph-shield-check', title: T('Insurance', 'Versicherung'),
    body: {
      en: 'Take travel insurance that covers medical care and repatriation. Private ambulance services can bill you directly, so keep your policy number handy.',
      de: 'Die gesetzliche Krankenkasse zahlt in Südafrika in der Regel nicht. Schließen Sie eine Auslandsreise-Krankenversicherung mit Rücktransport ab. Private Rettungsdienste können Sie direkt abrechnen, halten Sie die Policennummer griffbereit.' } },
  { id: 'driving', icon: 'ph-steering-wheel', title: T('Driving', 'Autofahren'),
    body: {
      en: 'South Africans drive on the left. Limits are usually 120 km/h on highways, 100 km/h on open roads and 60 km/h in towns, and 50 km/h on tar and 40 km/h on gravel in Kruger Park. Avoid driving after dark: animals, pedestrians and poor lighting are the risks. Keep doors locked and windows up, leave nothing valuable on view, and do not pick up hitchhikers. Carry your licence. An international driving permit is often recommended, and car-hire firms may ask for one if your licence is not in English.',
      de: 'In Südafrika herrscht Linksverkehr. Üblich sind 120 km/h auf Autobahnen, 100 km/h außerorts und 60 km/h in Ortschaften, im Kruger-Park 50 km/h auf Asphalt und 40 km/h auf Schotter. Vermeiden Sie Fahrten im Dunkeln: Tiere, Fußgänger und schlechte Beleuchtung sind die Gefahr. Türen verriegeln, Fenster geschlossen halten, nichts Wertvolles sichtbar lassen und keine Anhalter mitnehmen, so rät auch das Auswärtige Amt. Führerschein mitführen. Ein internationaler Führerschein wird häufig empfohlen, und Mietwagenfirmen verlangen ihn teils, wenn der Führerschein nicht auf Englisch ist.' } },
  { id: 'money', icon: 'ph-money', title: T('Money and tipping', 'Geld und Trinkgeld'),
    body: {
      en: 'The currency is the South African rand (ZAR). Cards work in most shops and restaurants, and Hoedspruit has ATMs. Keep some cash for small purchases. A tip of 10 to 15 percent is usual in restaurants, and fuel attendants, who fill the tank for you, appreciate a few rand.',
      de: 'Die Währung ist der Südafrikanische Rand (ZAR). Karten werden in den meisten Geschäften und Restaurants akzeptiert, und in Hoedspruit gibt es Geldautomaten. Etwas Bargeld für Kleinigkeiten ist praktisch. Im Restaurant sind 10 bis 15 Prozent Trinkgeld üblich, und Tankwarte, die für Sie tanken, freuen sich über ein paar Rand.' } },
  { id: 'power', icon: 'ph-plug', title: T('Plugs and power', 'Steckdosen und Strom'),
    body: {
      en: 'Power is 230 V at 50 Hz, the same as Europe, so your chargers work without a converter. The sockets are different: bring a Type M adapter, or a universal one that covers types M and N.',
      de: 'Die Spannung beträgt 230 V bei 50 Hz, wie in Deutschland, Ihre Ladegeräte funktionieren also ohne Spannungswandler. Die Steckdosen sind anders: Nehmen Sie einen Adapter Typ M mit oder einen Universaladapter, der die Typen M und N abdeckt.' } },
  { id: 'time', icon: 'ph-clock', title: T('Time zone', 'Zeitzone'),
    body: {
      en: 'South Africa runs on SAST (UTC+2) all year, with no daylight saving. Sunrise is early in summer, around 05:00, so mornings start early.',
      de: 'Südafrika hat das ganze Jahr Südafrikanische Normalzeit (UTC+2), ohne Sommerzeit. Zur deutschen Sommerzeit ist es gleich spät wie in Deutschland, zur Winterzeit eine Stunde später. Im Sommer geht die Sonne früh auf, gegen 05:00 Uhr, die Tage beginnen also zeitig.' } },
  { id: 'phone', icon: 'ph-cell-signal-slash', title: T('Phones and signal', 'Handy und Empfang'),
    body: {
      en: 'Mobile reception can be poor in the bushveld, so WhatsApp and the lodge Wi-Fi are your friends. Download an offline map of the area before you arrive. Check roaming costs, or use a local SIM or eSIM.',
      de: 'Der Mobilfunkempfang kann im Busch schlecht sein, WhatsApp und das WLAN der Lodge sind daher Ihre Verbündeten. Laden Sie vor der Anreise eine Offline-Karte der Gegend herunter. Prüfen Sie die Roaming-Kosten oder nutzen Sie eine lokale SIM-Karte oder eSIM.' } },
  { id: 'safety', icon: 'ph-lock-key', title: T('Staying safe', 'Sicherheit'),
    body: {
      en: 'Use normal travel sense: lock the car and the lodge at night, and keep valuables out of sight. The estate\'s real hazards are wildlife and the road, so read the wildlife tips.',
      de: 'Es gilt gesunder Reiseverstand: Auto und Lodge nachts abschließen und Wertsachen nicht offen liegen lassen. Die eigentlichen Gefahren auf der Anlage sind Wildtiere und der Straßenverkehr, lesen Sie deshalb die Tipps zur Tierwelt.' } },
];

/* Checklist. when: 'pre' shows until arrival, 'dep' on the day of departure. */
export const CHECKLIST = [
  { id: 'eta', when: 'pre', text: T('Tell your host when you will arrive', 'Teilen Sie {host} Ihre Ankunftszeit mit'), act: 'whatsapp', actLabel: T('WhatsApp', 'WhatsApp') },
  { id: 'gate', when: 'pre', text: T('Confirm your estate gate access with your host. Visitors are let in with a code arranged before arrival.', 'Klären Sie den Zutritt zur Anlage mit {host}. Besucher werden mit einem vorab organisierten Code eingelassen.'), act: 'whatsapp-gate', actLabel: T('Ask', 'Fragen') },
  { id: 'passport', when: 'pre', text: T('Check your passport and entry rules', 'Reisepass und Einreisebestimmungen prüfen'), act: 'know:entry', actLabel: T('Read', 'Lesen') },
  { id: 'insurance', when: 'pre', text: T('Arrange travel and medical insurance', 'Reise- und Krankenversicherung abschließen'), act: 'know:insurance', actLabel: T('Read', 'Lesen') },
  { id: 'malaria', when: 'pre', text: T('Talk to a doctor or travel clinic about malaria, ideally weeks ahead', 'Mit Arzt oder Tropeninstitut über Malaria sprechen, am besten Wochen vorher'), act: 'know:health', actLabel: T('Read', 'Lesen') },
  { id: 'flights', when: 'pre', text: T('Enter your flights to get check-in reminders', 'Flüge eintragen und Erinnerungen zum Einchecken erhalten'), act: 'tab:journey', actLabel: T('Open', 'Öffnen') },
  { id: 'offline', when: 'pre', text: T('Download an offline map of Hoedspruit in your maps app', 'Offline-Karte von Hoedspruit in Ihrer Karten-App laden'), act: 'maps', actLabel: T('Open map', 'Karte öffnen') },
  { id: 'calendar', when: 'pre', text: T('Add your stay to your calendar', 'Aufenthalt in den Kalender eintragen'), act: 'ics', actLabel: T('Add', 'Hinzufügen') },
  { id: 'shop', when: 'pre', text: T('Plan your first shop. Pick n Pay and Spar are in Hoedspruit, 7 km from the lodge.', 'Planen Sie den ersten Einkauf. Pick n Pay und Spar liegen in Hoedspruit, 7 km von der Lodge.'), act: 'tab:around', actLabel: T('See map', 'Karte') },
  { id: 'pack', when: 'pre', text: T('Pack with the list', 'Mit der Packliste packen'), act: 'tab:journey', actLabel: T('Open', 'Öffnen') },
  { id: 'd1', when: 'dep', text: T('Check every room for belongings', 'Alle Räume auf liegengebliebene Dinge prüfen') },
  { id: 'd2', when: 'dep', text: T('Switch off air conditioning, fans and lights', 'Klimaanlage, Ventilatoren und Licht ausschalten') },
  { id: 'd3', when: 'dep', text: T('Leave the braai area tidy and close all doors and windows', 'Braai-Bereich aufgeräumt hinterlassen und alle Türen und Fenster schließen') },
  { id: 'd4', when: 'dep', text: T('Say goodbye to your host and ask about your next visit', 'Sich von {host} verabschieden und nach dem nächsten Besuch fragen'), act: 'whatsapp-thanks', actLabel: T('Message', 'Nachricht') },
];

/* Packing list. cond(ctx) decides if an item shows; ctx has climate, kids, driving, summer. */
export const PACKING = [
  { cat: T('Documents and money', 'Dokumente und Geld'), items: [
    { id: 'p-passport', text: T('Passports and a copy of each', 'Reisepässe und je eine Kopie') },
    { id: 'p-booking', text: T('Booking confirmation and flight tickets', 'Buchungsbestätigung und Flugtickets') },
    { id: 'p-insurance', text: T('Travel insurance details', 'Unterlagen der Reiseversicherung') },
    { id: 'p-licence', text: T('Driving licence and international permit', 'Führerschein und internationaler Führerschein'), cond: (c) => c.driving },
    { id: 'p-cash', text: T('Some rand in cash and a card that works abroad', 'Etwas Bargeld in Rand und eine Karte, die im Ausland funktioniert') },
  ] },
  { cat: T('Clothes', 'Kleidung'), items: [
    { id: 'p-light', text: T('Light, loose clothes in neutral colours (green, khaki, brown)', 'Leichte, lockere Kleidung in neutralen Farben (grün, khaki, braun)') },
    { id: 'p-warm', text: T('A warm layer for cool mornings and evenings', 'Eine warme Schicht für kühle Morgen und Abende'), cond: (c) => c.lo < 17 },
    { id: 'p-rain', text: T('A light rain jacket for afternoon storms', 'Eine leichte Regenjacke für Gewitter am Nachmittag'), cond: (c) => c.rainDays >= 5 },
    { id: 'p-hat', text: T('Wide-brim hat and sunglasses', 'Sonnenhut mit Krempe und Sonnenbrille') },
    { id: 'p-shoes', text: T('Closed shoes for walking outdoors', 'Geschlossene Schuhe für draußen') },
    { id: 'p-swim', text: T('Swimwear', 'Badebekleidung') },
  ] },
  { cat: T('Wildlife', 'Tierwelt'), items: [
    { id: 'p-bino', text: T('Binoculars', 'Fernglas') },
    { id: 'p-camera', text: T('Camera with a zoom lens', 'Kamera mit Zoomobjektiv') },
    { id: 'p-torch', text: T('Torch or headlamp for after dark', 'Taschenlampe oder Stirnlampe für die Dunkelheit') },
    { id: 'p-water', text: T('Refillable water bottle', 'Wiederbefüllbare Trinkflasche') },
  ] },
  { cat: T('Health', 'Gesundheit'), items: [
    { id: 'p-deet', text: T('Insect repellent with DEET', 'Insektenschutz mit DEET') },
    { id: 'p-sun', text: T('Sunscreen (the UV index is often very high)', 'Sonnencreme (der UV-Index ist oft sehr hoch)') },
    { id: 'p-meds', text: T('Personal medicine, and malaria tablets if prescribed', 'Persönliche Medikamente und Malaria-Tabletten, falls verschrieben') },
    { id: 'p-aid', text: T('Basic first-aid kit and hand sanitiser', 'Kleine Reiseapotheke und Desinfektionsmittel') },
  ] },
  { cat: T('Tech', 'Technik'), items: [
    { id: 'p-adapter', text: T('Type M plug adapter', 'Steckdosenadapter Typ M') },
    { id: 'p-bank', text: T('Power bank and phone charger', 'Powerbank und Handy-Ladegerät') },
    { id: 'p-offline', text: T('Offline maps downloaded', 'Offline-Karten heruntergeladen') },
  ] },
  { cat: T('With children', 'Mit Kindern'), items: [
    { id: 'p-kidhat', text: T("Children's sun hats and swim shirts", 'Sonnenhüte und Badeshirts für Kinder') },
    { id: 'p-kidgames', text: T('Games and a wildlife spotting book for the car and patio', 'Spiele und ein Tierbestimmungsbuch für Auto und Terrasse') },
    { id: 'p-kidid', text: T("Children's own passports and any documents officials may ask for", 'Eigene Reisepässe der Kinder und Unterlagen, die Beamte verlangen könnten') },
  ], cond: (c) => c.kids > 0 },
];

export const SOURCES = [
  ['Hoedspruit emergency numbers', 'https://www.hoedspruit.co.za/emergency-numbers'],
  ['Hoedspruit Private Hospital opening, Limpopo government', 'https://www.limpopo.gov.za/?p=7182'],
  ['Kruger Park gate times', 'https://krugerpark.co.za/Kruger_Park_Travel_Advisory-travel/kruger-park-gate-times.html'],
  ['SANParks Kruger', 'https://www.sanparks.org/parks/kruger/'],
  ['Auswärtiges Amt: Südafrika', 'https://www.auswaertiges-amt.de/de/ReiseUndSicherheit/suedafrikasicherheit/208400'],
  ['Open-Meteo weather data', 'https://open-meteo.com/'],
  ['OpenStreetMap contributors', 'https://www.openstreetmap.org/copyright'],
  ['Photo credits', '/stay/credits.html'],
];

/* Brand. Everything a guest sees that carries the lodge's identity. A new lodge changes this block and its photos. */
export const BRAND = {
  name: 'Sample Bush Lodge', short: 'Sample Lodge',
  logo: null, accent: 'ember',
  welcomePhoto: 'welcome.jpg',
  memoryPhoto: '/stay/img/welcome.jpg',
  langs: ['en', 'de'], defaultLang: 'en',
  reviewUrl: 'https://www.apploading.co/guest-app-for-lodges/',
  hashtag: '#MyStay',
};

/* What the lodge tells each guest. value: null means the host has not filled it in yet, so the app offers a one-tap question instead.
   To fill one in, set value to T('English text', 'German text'). */
export const LODGE_INFO = [
  { id: 'checkin', icon: 'ph-key', value: null },
  { id: 'checkout', icon: 'ph-door-open', value: null },
  { id: 'wifi', icon: 'ph-wifi-high', value: null },
  { id: 'gate', icon: 'ph-shield-check', value: null },
  { id: 'braai', icon: 'ph-fire', value: null },
  { id: 'pool', icon: 'ph-swimming-pool', value: null },
];

/* Extras the guest can ask for. This is a sample menu: prices and availability are the lodge's to confirm.
   price: null means "the host confirms the price". Set price to { amount: 450, unit: T('per person', 'pro Person') } once it is agreed.
   when: null means "the host confirms dates and times". stages lists when the app suggests the extra on the home screen.
   Every extra is a request. Nothing is booked or charged in the app. */
export const EXTRAS = [
  { id: 'transfer', icon: 'ph-van', stages: ['pre', 'eve', 'departure'], fields: ['date', 'time', 'guests', 'flight'], price: null, when: null,
    title: T('Airport transfer', 'Flughafentransfer'),
    gets: T('A lift between the airport and the lodge, arranged by your host.', 'Eine Fahrt zwischen Flughafen und Lodge, von {host} organisiert.'),
    ask: 'an airport transfer' },
  { id: 'braai', icon: 'ph-fire', stages: ['arrival', 'staying'], fields: ['date', 'guests', 'note'], price: null, when: null,
    title: T('Braai pack', 'Braai-Paket'),
    gets: T('Food and firewood for a braai on your own patio. Your host tells you what is in the pack.', 'Essen und Brennholz für ein Braai auf Ihrer eigenen Terrasse. {host} sagt Ihnen, was im Paket ist.'),
    ask: 'a braai pack' },
  { id: 'meal', icon: 'ph-cooking-pot', stages: ['staying', 'arrival'], fields: ['date', 'time', 'guests', 'note'], price: null, when: null,
    title: T('Breakfast or dinner', 'Frühstück oder Abendessen'),
    gets: T('A meal prepared for you, so a night off cooking. Tell your host about allergies and preferences.', 'Eine Mahlzeit, für Sie zubereitet, damit Sie einmal nicht kochen müssen. Sagen Sie {host} Bescheid bei Allergien und Wünschen.'),
    ask: 'a meal arranged for me' },
  { id: 'drive', icon: 'ph-jeep', stages: ['pre', 'staying'], fields: ['date', 'time', 'guests', 'note'], price: null, when: null,
    title: T('Open-vehicle game drive', 'Pirschfahrt im offenen Fahrzeug'),
    gets: T('A guided drive in an open safari vehicle. Your host suggests options and timing.', 'Eine geführte Fahrt im offenen Safarifahrzeug. {host} schlägt Möglichkeiten und Zeiten vor.'),
    ask: 'a game drive in an open safari vehicle' },
  { id: 'bushdinner', icon: 'ph-campfire', stages: ['pre', 'staying'], fields: ['date', 'guests', 'note'], price: null, when: null,
    title: T('Private bush dinner', 'Privates Abendessen im Busch'),
    gets: T('Dinner by lantern light out in the bush, set up for your party only. Your host confirms the menu and the evening.', 'Abendessen bei Laternenlicht draußen im Busch, nur für Ihre Gruppe gedeckt. {host} bestätigt Menü und Abend.'),
    ask: 'a private bush dinner' },
  { id: 'spa', icon: 'ph-flower-lotus', stages: ['staying'], fields: ['date', 'time', 'guests', 'note'], price: null, when: null,
    title: T('Massage on your deck', 'Massage auf Ihrer Terrasse'),
    gets: T('A therapist comes to your suite. Your host confirms treatments, times and prices.', 'Eine Therapeutin kommt in Ihre Suite. {host} bestätigt Behandlungen, Zeiten und Preise.'),
    ask: 'a massage at my suite' },
  { id: 'kruger', icon: 'ph-binoculars', stages: ['pre', 'staying'], fields: ['date', 'guests', 'note'], price: null, when: null,
    title: T('Day trip to Kruger Park', 'Tagesausflug in den Kruger-Park'),
    gets: T('Help planning a day in Kruger National Park, from the gate you use to what to bring.', 'Hilfe bei der Planung eines Tages im Kruger-Nationalpark, vom Tor bis zur Packliste.'),
    ask: 'a day trip to Kruger National Park' },
  { id: 'panorama', icon: 'ph-mountains', stages: ['pre', 'staying'], fields: ['date', 'guests', 'note'], price: null, when: null,
    title: T('Panorama Route day', 'Tag auf der Panoramaroute'),
    gets: T('Advice for a full day at Blyde River Canyon, Bourke\'s Luck Potholes and God\'s Window.', 'Tipps für einen ganzen Tag am Blyde River Canyon, bei Bourke\'s Luck Potholes und am God\'s Window.'),
    ask: 'advice for a day on the Panorama Route' },
];

/* Which species groups, zones and badges this property offers is decided in the app. The zone labels live here so a lodge can rename them. */
export const ZONES = {
  estate: { label: T('On the estate', 'Auf der Anlage') },
  excursion: { label: T('On day trips', 'Auf Ausflügen') },
};

/* Sample content for the owner demo and website previews. Freely licensed photos, credited at /stay/credits.html. None shows a real lodge's guests. */
export const DEMO = {
  samplePhotos: { giraffe: '/stay/img/sp-giraffe.jpg', zebra: '/stay/img/sp-zebra.jpg' },
};

/* Everything above, in one object. */
export const PACK = {
  id: 'sample', brand: BRAND, lodge: LODGE, lodges: LODGES, info: LODGE_INFO, extras: EXTRAS, zones: ZONES,
  places: PLACES, cats: CATS, routes: ROUTES, gates: GATES, climate: CLIMATE, emergency: EMERGENCY,
  species: SPECIES, demo: DEMO, bushRules: BUSH_RULES, know: KNOW, checklist: CHECKLIST, packing: PACKING, sources: SOURCES,
};
