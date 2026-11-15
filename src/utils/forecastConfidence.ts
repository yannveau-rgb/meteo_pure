/**
 * Forecast confidence from multi-model agreement.
 *
 * The app already downloads three independent models (AROME/ARPEGE, ECMWF and
 * the GFS/ICON blend). Their disagreement is real information that consumer
 * weather apps throw away: presenting a day-6 temperature as a single confident
 * number is a small lie when the models are 5°C apart.
 *
 * Surfacing the spread turns unavoidable uncertainty into a credibility signal
 * rather than something to hide.
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceResult {
  level: ConfidenceLevel;
  /** Max-min across models, in °C. */
  spread: number;
  /** How many models actually supplied a value for this day. */
  sources: number;
}

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: 'Modèles d\'accord',
  medium: 'Léger désaccord',
  low: 'Modèles divergents',
};

/**
 * Do the models agree on whether it rains on a given day? Daily precipitation
 * totals (mm) from each model. The temperature spread says nothing about rain,
 * which is where forecasts go wrong most visibly (a shower cell 20 km off).
 *
 *  - low:    one model gives a wet day (>= 1 mm) while another gives a dry one (< 0.2 mm)
 *  - medium: all on the same side but totals differ by 4 mm or more
 *  - high:   consistent
 * null with fewer than two usable models, for the same reason as above.
 */
export function assessRainAgreement(values: Array<number | null | undefined>): ConfidenceLevel | null {
  const usable = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (usable.length < 2) return null;
  const max = Math.max(...usable);
  const min = Math.min(...usable);
  if (max >= 1 && min < 0.2) return 'low';
  if (max - min >= 4) return 'medium';
  return 'high';
}

/**
 * Classifies agreement between per-model temperature predictions for one day.
 * Returns null when fewer than two models supplied a value — with a single
 * source there is no agreement to measure, and inventing a confidence level
 * would be worse than showing none.
 */
export function assessConfidence(values: Array<number | null | undefined>): ConfidenceResult | null {
  const usable = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (usable.length < 2) return null;

  const spread = Math.max(...usable) - Math.min(...usable);
  const level: ConfidenceLevel = spread < 1.5 ? 'high' : spread < 3 ? 'medium' : 'low';

  return { level, spread: Math.round(spread * 10) / 10, sources: usable.length };
}
