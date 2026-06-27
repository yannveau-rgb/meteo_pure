import { describe, it, expect } from 'vitest';
import { calculateVigilance } from '../weatherUtils';

describe('calculateVigilance', () => {
  it('returns all green for calm conditions', () => {
    const v = calculateVigilance(18, 10, 1, 0);
    expect(v.globalLevel).toBe('green');
    expect(v.categories.every(c => c.level === 'green')).toBe(true);
  });

  it('flags wind orange at 50 km/h', () => {
    const v = calculateVigilance(18, 55, 1, 0);
    const wind = v.categories.find(c => c.name === 'Vent violent');
    expect(wind?.level).toBe('orange');
  });

  it('flags wind red at 70 km/h+', () => {
    const v = calculateVigilance(18, 75, 1, 0);
    const wind = v.categories.find(c => c.name === 'Vent violent');
    expect(wind?.level).toBe('red');
  });

  it('flags thunderstorm yellow for code 95', () => {
    const v = calculateVigilance(18, 10, 95, 1);
    const orage = v.categories.find(c => c.name === 'Orages');
    expect(orage?.level).toBe('yellow');
  });

  it('escalates to red on extreme storm + rain', () => {
    const v = calculateVigilance(18, 50, 99, 20);
    expect(v.globalLevel).toBe('red');
  });

  it('flags rain orange for heavy precipitation', () => {
    const v = calculateVigilance(18, 10, 80, 10);
    const rain = v.categories.find(c => c.name === 'Inondation / Pluie-Inondation');
    expect(rain?.level).toBe('orange');
  });
});
