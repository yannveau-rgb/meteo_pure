import { describe, it, expect } from 'vitest';
import { mergeSeries, PREFER_BLEND } from '../weatherApi';

describe('mergeSeries', () => {
  it('keeps a value already present in primary over secondary/tertiary', () => {
    const primary = { temperature_2m: [10, 11, 12] };
    mergeSeries(primary, { temperature_2m: [99, 99, 99] }, { temperature_2m: [1, 1, 1] });
    expect(primary.temperature_2m).toEqual([10, 11, 12]);
  });

  it('fills a field missing from primary entirely from secondary', () => {
    const primary: any = {};
    mergeSeries(primary, { uv_index_max: [3, 4, 5] }, { uv_index_max: [9, 9, 9] });
    expect(primary.uv_index_max).toEqual([3, 4, 5]);
  });

  it('falls back to tertiary only where secondary is null/undefined', () => {
    const primary: any = {};
    mergeSeries(
      primary,
      { temperature_2m_max: [20, null, 22] },
      { temperature_2m_max: [30, 31, 32] }
    );
    // AROME covers ~2 days then goes null; ECMWF (tertiary here) fills the gap.
    expect(primary.temperature_2m_max).toEqual([20, 31, 22]);
  });

  it('extends primary past its own length using secondary, then tertiary', () => {
    // AROME (primary) only covers 2 days; ECMWF (secondary) covers day 5-10.
    const primary = { temperature_2m_max: [20, 21] };
    mergeSeries(
      primary,
      { temperature_2m_max: [undefined, undefined, 23, 24, 25] },
      { temperature_2m_max: [30, 31, 33, 34, 35] }
    );
    expect(primary.temperature_2m_max).toEqual([20, 21, 23, 24, 25]);
  });

  it('prefers the blend (tertiary) over secondary for PREFER_BLEND fields', () => {
    expect(PREFER_BLEND.has('precipitation_probability')).toBe(true);
    const primary: any = {};
    mergeSeries(
      primary,
      { precipitation_probability: [40, 40, 40] }, // secondary — not calibrated for this field
      { precipitation_probability: [10, 12, 14] }  // tertiary/blend — calibrated
    );
    expect(primary.precipitation_probability).toEqual([10, 12, 14]);
  });

  it('falls back to secondary for a PREFER_BLEND field when the blend lacks it', () => {
    const primary: any = {};
    mergeSeries(
      primary,
      { precipitation_probability: [40, 40, 40] },
      { /* no precipitation_probability from the blend */ }
    );
    expect(primary.precipitation_probability).toEqual([40, 40, 40]);
  });

  it('treats a real 0 as data, not a gap to fill', () => {
    const primary = { precipitation: [0, 0, 5] };
    mergeSeries(primary, { precipitation: [9, 9, 9] }, { precipitation: [9, 9, 9] });
    expect(primary.precipitation).toEqual([0, 0, 5]);
  });

  it('leaves primary untouched when neither secondary nor tertiary has the field', () => {
    const primary = { temperature_2m: [10, 11] };
    mergeSeries(primary, { other_field: [1] }, { other_field: [2] });
    expect(primary.temperature_2m).toEqual([10, 11]);
  });

  it('handles missing secondary/tertiary objects without throwing', () => {
    const primary = { temperature_2m: [10, 11] };
    expect(() => mergeSeries(primary, null, undefined)).not.toThrow();
    expect(primary.temperature_2m).toEqual([10, 11]);
  });
});
