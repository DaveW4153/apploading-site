/* Languages. To add one: create lang/<code>.js with every key from lang/en.js, add it here, add the code to the property's
   brand.langs, and run `node tools/check-i18n.mjs`. A language is only listed once it is complete.
   reviewed: true means a native speaker has checked the safety and arrival wording. */
import en from './lang/en.js';
import de from './lang/de.js';

export const LANGS = {
  en: { label: 'English', locale: 'en-ZA', reviewed: true },
  de: { label: 'Deutsch', locale: 'de-DE', reviewed: false },
};
export const UI = { en, de };

/* Languages a lodge can ask for that are not translated yet. The demo lists them so an owner can see what is possible.
   They are never offered as working: choosing one explains that it is added per lodge. To make one real, follow the steps above
   and remove it from this list. Names are shown in the language itself. */
export const PLANNED = {
  fr: 'Français', nl: 'Nederlands', es: 'Español', it: 'Italiano', pt: 'Português',
  sv: 'Svenska', da: 'Dansk', no: 'Norsk', pl: 'Polski', ru: 'Русский',
  zh: '中文', ja: '日本語', ko: '한국어', hi: 'हिन्दी', ar: 'العربية', af: 'Afrikaans',
};

/* Order of choice: the link, the guest's saved choice, the phone's language list, the property's default. */
export function pickLang({ url, saved, device, enabled, fallback }) {
  const ok = (c) => c && enabled.includes(c) && LANGS[c];
  if (ok(url)) return url;
  if (ok(saved)) return saved;
  for (const l of device || []) { const c = String(l).toLowerCase().split('-')[0]; if (ok(c)) return c; }
  return fallback;
}
