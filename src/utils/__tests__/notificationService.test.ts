import { describe, it, expect } from 'vitest';
import { getZodiacSign, getDaysUntilChristmas } from '../notificationService';

describe('getZodiacSign', () => {
  it('returns Bélier for late March', () => {
    expect(getZodiacSign('1990-03-25')).toBe('Bélier');
  });

  it('returns Poissons for early March', () => {
    expect(getZodiacSign('1990-03-10')).toBe('Poissons');
  });

  it('returns Capricorne for early January', () => {
    expect(getZodiacSign('1990-01-05')).toBe('Capricorne');
  });

  it('returns Verseau for late January', () => {
    expect(getZodiacSign('1990-01-25')).toBe('Verseau');
  });

  it('handles boundary date Lion -> Vierge', () => {
    expect(getZodiacSign('1990-08-22')).toBe('Lion');
    expect(getZodiacSign('1990-08-23')).toBe('Vierge');
  });

  it('returns Inconnu for empty or invalid input', () => {
    expect(getZodiacSign('')).toBe('Inconnu');
    expect(getZodiacSign('not-a-date')).toBe('Inconnu');
  });
});

describe('getDaysUntilChristmas', () => {
  it('returns positive count before Dec 25 same year', () => {
    const dec1 = new Date(2025, 11, 1, 0, 0, 0);
    expect(getDaysUntilChristmas(dec1)).toBe(24);
  });

  it('rolls over to next year after Dec 25', () => {
    const dec26 = new Date(2025, 11, 26, 0, 0, 0);
    const result = getDaysUntilChristmas(dec26);
    expect(result).toBeGreaterThan(360);
    expect(result).toBeLessThanOrEqual(365);
  });

  it('returns ~half a year mid-year', () => {
    const june25 = new Date(2025, 5, 25, 0, 0, 0);
    const result = getDaysUntilChristmas(june25);
    expect(result).toBeGreaterThan(180);
    expect(result).toBeLessThan(190);
  });
});
