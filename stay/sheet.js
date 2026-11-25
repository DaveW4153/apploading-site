/* The bottom sheets: one shared dialog for species, extras and options, plus the demo guard. */
import { $ } from './ui.js';

export function openSheet(content, id = 'sheet') {
  $(`#${id}-body`).innerHTML = content && content.r !== undefined ? content.r : String(content);
  const d = $(`#${id}`);
  if (!d.open) d.showModal();
  d.scrollTop = 0;
}
export function closeSheet(id = 'sheet') {
  const d = $(`#${id}`);
  if (d && d.open) d.close();
}
export const sheetOpen = (id = 'sheet') => { const d = $(`#${id}`); return !!(d && d.open); };
