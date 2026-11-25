/* Sunrise, sunset, twilight and moon phase for any date, computed on the device.
   Works offline. Sun maths follows the NOAA solar calculator equations. */
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

/* Minutes after local midnight for sunrise, solar noon and sunset.
   `date` is 'YYYY-MM-DD' in the local time zone, `tz` is the UTC offset in hours. */
export function sunTimes(date, lat, lon, tz = 2, zenith = 90.833) {
  const [y, m, d] = date.split('-').map(Number);
  const jd = julian(y, m, d) + 0.5 - tz / 24;
  const T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T))
    + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T)
    + Math.sin(3 * M * RAD) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
  const yy = Math.tan((eps * RAD) / 2) ** 2;
  const eqTime = 4 * DEG * (yy * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD)
    + 4 * e * yy * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD)
    - 0.5 * yy * yy * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD));
  const cosHA = Math.cos(zenith * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) - Math.tan(lat * RAD) * Math.tan(decl);
  if (cosHA > 1 || cosHA < -1) return null;
  const ha = Math.acos(cosHA) * DEG;
  const noon = 720 - 4 * lon - eqTime + tz * 60;
  return { rise: noon - 4 * ha, noon, set: noon + 4 * ha };
}

/* Civil twilight: first and last usable light. */
export const twilight = (date, lat, lon, tz = 2) => sunTimes(date, lat, lon, tz, 96);

/* 'HH:MM' from minutes after midnight. */
export function hhmm(min) {
  const t = ((Math.round(min) % 1440) + 1440) % 1440;
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
}

/* Moon age (days since new moon), lit fraction and a phase index 0 to 7 for a given date. */
export function moon(date) {
  const [y, m, d] = date.split('-').map(Number);
  const days = Date.UTC(y, m - 1, d, 18, 0) / 86400000; // about 20:00 in South Africa
  const synodic = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
  const age = (((days - ref) % synodic) + synodic) % synodic;
  const lit = (1 - Math.cos((2 * Math.PI * age) / synodic)) / 2;
  const phase = Math.floor(((age / synodic) * 8) + 0.5) % 8;
  return { age, lit, phase };
}
