import { HourlyForecastItem } from '../types';

/**
 * Turns the hourly forecast into *decisions* rather than numbers.
 *
 * Everything here is derived from data the app already holds — no extra API
 * call. The value isn't the meteorology (Open-Meteo did that), it's answering
 * "when can I actually go out / hang the washing" instead of making the user
 * scan twelve columns and work it out themselves.
 */

export interface DryWindow {
  startHour: number;
  endHour: number;
  /** Duration in hours. */
  length: number;
}

function hourOf(item: HourlyForecastItem): number {
  return parseInt(item.time.split(':')[0], 10);
}

/**
 * Probability ceilings, deliberately different per use case.
 *
 * Forecast *amount* is the primary signal and probability only a veto, because
 * the two disagree far more than you'd expect: for an identical 0mm evening in
 * Paris, ECMWF reported 21-51% where the GFS/ICON blend reported 0-13%. Treating
 * a 40% "chance" at 0mm as wet made the app claim there was no dry slot on a
 * visibly clear evening.
 *
 * Stepping outside is a short, reversible commitment, so it tolerates
 * uncertainty; leaving laundry out for hours does not.
 */
const PROB_CEILING_OUTING = 70;
const PROB_CEILING_LAUNDRY = 50;

function isDry(item: HourlyForecastItem, probCeiling: number): boolean {
  const precip = item.precipitation ?? 0;
  if (precip > 0) return false;
  return (item.precipitationProbability ?? 0) < probCeiling;
}

/**
 * Longest uninterrupted dry stretch from `fromHour` onwards.
 * Returns null below two consecutive hours — a single dry hour isn't a plan.
 */
export function findDryWindow(
  hours: HourlyForecastItem[],
  fromHour?: number,
  probCeiling: number = PROB_CEILING_OUTING
): DryWindow | null {
  const start = typeof fromHour === 'number' ? fromHour : -1;
  const usable = hours.filter(h => {
    const hr = hourOf(h);
    return !isNaN(hr) && hr >= start && hr >= 6 && hr <= 22;
  });
  if (usable.length === 0) return null;

  let best: DryWindow | null = null;
  let runStart: number | null = null;
  let runLen = 0;

  const flush = (endHour: number) => {
    if (runStart !== null && runLen >= 2) {
      if (!best || runLen > best.length) {
        best = { startHour: runStart, endHour, length: runLen };
      }
    }
    runStart = null;
    runLen = 0;
  };

  usable.forEach((item, idx) => {
    const hr = hourOf(item);
    if (isDry(item, probCeiling)) {
      if (runStart === null) runStart = hr;
      runLen++;
      if (idx === usable.length - 1) flush(hr + 1);
    } else {
      flush(hr);
    }
  });

  return best;
}

export function formatDryWindow(w: DryWindow): string {
  return `${w.startHour}h → ${w.endHour}h`;
}

/**
 * Laundry-drying verdict. Needs a long dry stretch plus air movement —
 * still air at high humidity dries almost nothing, which is exactly the
 * nuance a raw "no rain today" reading hides.
 */
export function getLaundryVerdict(
  hours: HourlyForecastItem[],
  humidity: number | undefined,
  windSpeed: number | undefined
): { ok: boolean; label: string } | null {
  const window = findDryWindow(hours, undefined, PROB_CEILING_LAUNDRY);
  if (!window) return { ok: false, label: 'Pluie trop présente aujourd\'hui' };
  if (window.length < 4) return { ok: false, label: `Créneau trop court (${window.length}h)` };

  const humid = typeof humidity === 'number' && humidity > 80;
  const stillAir = typeof windSpeed === 'number' && windSpeed < 6;
  if (humid && stillAir) return { ok: false, label: 'Air humide et sans vent — séchage lent' };

  return { ok: true, label: `${window.length}h de sec, ${formatDryWindow(window)}` };
}
