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
