/* Shared constants, plus the active property's content re-exported under the names the app uses.
   Property content lives in property/<id>.js. */
import { PROPERTY } from './property/index.js';

export const T = (en, de) => ({ en, de });

export const { brand: BRAND, lodge: LODGE, lodges: LODGES, info: LODGE_INFO, extras: EXTRAS, zones: ZONES, places: PLACES, cats: CATS, routes: ROUTES, gates: GATES, climate: CLIMATE, emergency: EMERGENCY, species: SPECIES, demo: DEMO, bushRules: BUSH_RULES, know: KNOW, checklist: CHECKLIST, packing: PACKING, sources: SOURCES } = PROPERTY;

/* Weather codes (WMO) to an icon and a label. */
export const WEATHER = [
  { codes: [0, 1], icon: 'ph-sun', label: T('Sunny', 'Sonnig') },
  { codes: [2], icon: 'ph-cloud-sun', label: T('Partly cloudy', 'Teils bewölkt') },
  { codes: [3], icon: 'ph-cloud', label: T('Overcast', 'Bedeckt') },
  { codes: [45, 48], icon: 'ph-cloud-fog', label: T('Fog', 'Nebel') },
  { codes: [51, 53, 55, 56, 57], icon: 'ph-cloud-rain', label: T('Drizzle', 'Nieselregen') },
  { codes: [61, 63, 65, 66, 67], icon: 'ph-cloud-rain', label: T('Rain', 'Regen') },
  { codes: [80, 81, 82], icon: 'ph-cloud-rain', label: T('Showers', 'Schauer') },
  { codes: [95, 96, 99], icon: 'ph-cloud-lightning', label: T('Thunderstorm', 'Gewitter') },
];

