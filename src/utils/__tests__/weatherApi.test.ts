import { describe, it, expect } from 'vitest';
import { mergeSeries, PREFER_BLEND, consensus, skyCodeFromCloudCover, computeRepresentativeDailyCode } from '../weatherApi';

describe('consensus', () => {
  it('returns median for odd count of values', () => {
    expect(consensus([100, 21, 30])).toBe(30);
  });

  it('ignores outliers and filters nulls/NaN', () => {
    expect(consensus([100, null, 25, undefined, 20])).toBe(25);
  });

  it('returns null for empty array', () => {
    expect(consensus([])).toBeNull();
  });
});

describe('skyCodeFromCloudCover', () => {
  it('maps standard okta thresholds correctly', () => {
    expect(skyCodeFromCloudCover(0, 99)).toBe(0);   // Ensoleillé
    expect(skyCodeFromCloudCover(15, 99)).toBe(0);  // Ensoleillé
    expect(skyCodeFromCloudCover(25, 99)).toBe(1);  // Peu nuageux
    expect(skyCodeFromCloudCover(45, 99)).toBe(1);  // Peu nuageux
    expect(skyCodeFromCloudCover(60, 99)).toBe(2);  // Éclaircies
    expect(skyCodeFromCloudCover(80, 99)).toBe(2);  // Éclaircies
    expect(skyCodeFromCloudCover(95, 99)).toBe(3);  // Couvert (avec nuages bas standard)
  });

  it('caps at Éclaircies (2) when 100% cloud cover is only high cirrus veil', () => {
    // 100% total cloud cover, but low clouds are 0% and mid clouds 10%
    expect(skyCodeFromCloudCover(100, 99, 0, 10)).toBe(2);
  });

  it('keeps Couvert (3) when low clouds are present and dense', () => {
    expect(skyCodeFromCloudCover(100, 99, 85, 90)).toBe(3);
  });

  it('uses fallback when cloud cover is undefined or NaN', () => {
    expect(skyCodeFromCloudCover(undefined, 1)).toBe(1);
    expect(skyCodeFromCloudCover(NaN, 2)).toBe(2);
  });
});

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

describe('computeRepresentativeDailyCode', () => {
  it('demotes daily rain code (51) to Couvert (3) when precipitation is 0 and all daytime hours are dry/cloudy, even with high probability', () => {
    // Exact scenario reported by user for Monday:
    // API returns weather_code 51 (drizzle) and 67% rain probability,
    // but daytime hourly has 0.0mm everywhere and all hours were converted to cloud codes (3=Couvert).
    const daytimeHours = Array.from({ length: 15 }, () => ({
      weatherCode: 3,
      precipitation: 0,
      precipitationProbability: 67,
    }));

    const result = computeRepresentativeDailyCode({
      apiDailyCode: 51,
      daytimeHours,
      dayPrecipSum: 0,
    });

    expect(result).toBe(3); // Couvert, matching the hourly view
  });

  it('preserves rain code when actual rain hours are present', () => {
    const daytimeHours = [
      { weatherCode: 3, precipitation: 0, precipitationProbability: 20 },
      { weatherCode: 61, precipitation: 1.2, precipitationProbability: 80 },
      { weatherCode: 3, precipitation: 0, precipitationProbability: 10 },
    ];

    const result = computeRepresentativeDailyCode({
      apiDailyCode: 61,
      daytimeHours,
      dayPrecipSum: 1.2,
    });

    expect(result).toBe(61);
  });

  it('selects heavy rain code over light rain code if heavy rain occurs', () => {
    const daytimeHours = [
      { weatherCode: 61, precipitation: 0.5, precipitationProbability: 60 },
      { weatherCode: 63, precipitation: 3.5, precipitationProbability: 90 },
      { weatherCode: 3, precipitation: 0, precipitationProbability: 10 },
    ];

    const result = computeRepresentativeDailyCode({
      apiDailyCode: 61,
      daytimeHours,
      dayPrecipSum: 4.0,
    });

    expect(result).toBe(63);
  });

  it('prioritizes storm code (95) when storm is predicted and confirmed by hourly data or high probability', () => {
    const daytimeHours = [
      { weatherCode: 95, precipitation: 5.0, precipitationProbability: 85 },
      { weatherCode: 3, precipitation: 0, precipitationProbability: 20 },
    ];

    const result = computeRepresentativeDailyCode({
      apiDailyCode: 95,
      daytimeHours,
    });

    expect(result).toBe(95);
  });

  it('handles snow hours correctly', () => {
    const daytimeHours = [
      { weatherCode: 71, precipitation: 0.8, precipitationProbability: 70 },
      { weatherCode: 3, precipitation: 0, precipitationProbability: 10 },
    ];

    const result = computeRepresentativeDailyCode({
      apiDailyCode: 71,
      daytimeHours,
      dayPrecipSum: 0.8,
    });

    expect(result).toBe(71);
  });

  it('computes dominant sky for clear dry day', () => {
    const daytimeHours = [
      { weatherCode: 0, precipitation: 0, precipitationProbability: 0 },
      { weatherCode: 0, precipitation: 0, precipitationProbability: 0 },
      { weatherCode: 1, precipitation: 0, precipitationProbability: 0 },
    ];

    const result = computeRepresentativeDailyCode({
      apiDailyCode: 0,
      daytimeHours,
      dayPrecipSum: 0,
    });

    expect(result).toBe(0); // Soleil
  });
});

