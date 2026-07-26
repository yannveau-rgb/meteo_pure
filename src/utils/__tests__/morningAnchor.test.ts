import { describe, it, expect } from 'vitest';
import { buildMorningAnchor, analyzeRainTiming } from '../morningAnchor';

describe('analyzeRainTiming', () => {
  const h = (hour: number, precip: number, precipProb: number) => ({ hour, precip, precipProb });

  it('reports no rain when the day stays dry', () => {
    const hours = [h(8, 0, 5), h(12, 0, 10), h(18, 0, 15)];
    expect(analyzeRainTiming(hours)).toEqual({ startsAtHour: null, allDay: false });
  });

  it('ignores a low probability with no accumulation', () => {
    // 40% and 0mm must never put "parapluie" in front of someone at 7am.
    const hours = [h(9, 0, 40), h(14, 0, 45)];
    expect(analyzeRainTiming(hours).startsAtHour).toBeNull();
  });

  it('flags the first genuinely wet hour', () => {
    const hours = [h(8, 0, 10), h(14, 0, 20), h(15, 0.6, 70), h(16, 0.4, 65)];
    expect(analyzeRainTiming(hours).startsAtHour).toBe(15);
  });

  it('detects a wash-out day', () => {
    const hours = Array.from({ length: 12 }, (_, i) => h(8 + i, 1.2, 90));
    expect(analyzeRainTiming(hours).allDay).toBe(true);
  });

  it('ignores night-time hours', () => {
    const hours = [h(3, 5, 100), h(10, 0, 5)];
    expect(analyzeRainTiming(hours).startsAtHour).toBeNull();
  });
});

describe('buildMorningAnchor', () => {
  it('always yields three segments', () => {
    const anchor = buildMorningAnchor({ weatherCode: 0, tempMax: 24 });
    expect(anchor.split(' · ')).toHaveLength(3);
  });

  it('leads with the temperature', () => {
    expect(buildMorningAnchor({ weatherCode: 0, tempMax: 23.6 })).toMatch(/^24°/);
  });

  it('announces when rain starts', () => {
    const anchor = buildMorningAnchor({ weatherCode: 80, tempMax: 18, rainStartsAtHour: 15 });
    expect(anchor).toContain('averses dès 15h');
    expect(anchor).toContain('parapluie');
  });

  it('prioritises storms over every other condition', () => {
    const anchor = buildMorningAnchor({
      weatherCode: 95, tempMax: 33, uvMax: 9, rainStartsAtHour: 17,
    });
    expect(anchor).toContain('orages dès 17h');
    expect(anchor).toContain('prudence');
  });

  it('prioritises damaging gusts over rain', () => {
    const anchor = buildMorningAnchor({
      weatherCode: 61, tempMax: 12, windGustsMax: 82, rainStartsAtHour: 9,
    });
    expect(anchor).toContain('rafales 82 km/h');
  });

  it('calls out an all-day wash-out rather than a start time', () => {
    const anchor = buildMorningAnchor({
      weatherCode: 63, tempMax: 14, rainStartsAtHour: 7, rainAllDay: true,
    });
    expect(anchor).toContain('pluie toute la journée');
  });

  it('flags morning frost', () => {
    const anchor = buildMorningAnchor({ weatherCode: 3, tempMax: 5, tempMin: -2 });
    expect(anchor).toContain('gel ce matin');
    expect(anchor).toContain('manteau');
  });

  it('flags heat before UV', () => {
    const anchor = buildMorningAnchor({ weatherCode: 0, tempMax: 35, uvMax: 9 });
    expect(anchor).toContain('forte chaleur');
  });

  it('recommends sun protection on a high-UV day', () => {
    const anchor = buildMorningAnchor({ weatherCode: 2, tempMax: 25, uvMax: 8 });
    expect(anchor).toContain('UV fort');
    expect(anchor).toContain('crème solaire');
  });

  it('degrades gracefully when only the weather code is known', () => {
    const anchor = buildMorningAnchor({ weatherCode: 3 });
    expect(anchor.split(' · ')).toHaveLength(3);
    expect(anchor).toMatch(/^—/);
  });
});
