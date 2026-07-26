import { describe, it, expect } from 'vitest';
import {
  classifyPollen, getAqiBand, getNotablePollens, parseAirQuality, PollenReading,
} from '../airQuality';

describe('classifyPollen', () => {
  it('treats zero as absent', () => {
    expect(classifyPollen('grass_pollen', 0)).toBe('none');
  });

  it('scales grass pollen on its own thresholds', () => {
    expect(classifyPollen('grass_pollen', 5)).toBe('low');
    expect(classifyPollen('grass_pollen', 25)).toBe('moderate');
    expect(classifyPollen('grass_pollen', 60)).toBe('high');
    expect(classifyPollen('grass_pollen', 250)).toBe('veryHigh');
  });

  it('is far stricter on ragweed than on grass at the same count', () => {
    // The whole point of per-species thresholds: an identical reading is
    // unremarkable for grass and a bad day for a ragweed sufferer.
    expect(classifyPollen('grass_pollen', 22)).toBe('moderate');
    expect(classifyPollen('ragweed_pollen', 22)).toBe('high');
  });

  it('handles negative or invalid readings as absent', () => {
    expect(classifyPollen('birch_pollen', -1)).toBe('none');
  });
});

describe('getAqiBand', () => {
  it('maps the official European AQI bands', () => {
    expect(getAqiBand(15).severity).toBe('good');
    expect(getAqiBand(30).severity).toBe('fair');
    expect(getAqiBand(55).severity).toBe('moderate');
    expect(getAqiBand(70).severity).toBe('poor');
    expect(getAqiBand(120).severity).toBe('bad');
  });

  it('places band boundaries inclusively on the lower band', () => {
    expect(getAqiBand(20).severity).toBe('good');
    expect(getAqiBand(40).severity).toBe('fair');
  });
});

describe('getNotablePollens', () => {
  const mk = (species: any, value: number, level: any): PollenReading =>
    ({ species, label: species, value, level });

  it('hides anything below moderate', () => {
    const out = getNotablePollens([mk('grass_pollen', 3, 'low'), mk('birch_pollen', 0, 'none')]);
    expect(out).toHaveLength(0);
  });

  it('sorts worst first', () => {
    const out = getNotablePollens([
      mk('grass_pollen', 25, 'moderate'),
      mk('ragweed_pollen', 60, 'veryHigh'),
      mk('birch_pollen', 55, 'high'),
    ]);
    expect(out.map(p => p.level)).toEqual(['veryHigh', 'high', 'moderate']);
  });
});

describe('parseAirQuality', () => {
  it('returns null without a current block', () => {
    expect(parseAirQuality({})).toBeNull();
  });

  it('parses a real payload shape', () => {
    const snap = parseAirQuality({
      current: {
        european_aqi: 25, pm2_5: 5.5,
        alder_pollen: 0, birch_pollen: 0, grass_pollen: 6.9,
        mugwort_pollen: 20.1, olive_pollen: 0, ragweed_pollen: 0,
      },
    });
    expect(snap!.aqi).toBe(25);
    expect(snap!.pollens).toHaveLength(6);
    expect(snap!.pollens.find(p => p.species === 'mugwort_pollen')!.level).toBe('moderate');
    expect(snap!.pollens.find(p => p.species === 'grass_pollen')!.level).toBe('low');
  });

  it('skips species the API omitted rather than inventing zeros', () => {
    const snap = parseAirQuality({ current: { european_aqi: 30, grass_pollen: 12 } });
    expect(snap!.pollens).toHaveLength(1);
    expect(snap!.pollens[0].species).toBe('grass_pollen');
  });
});
