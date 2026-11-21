import { describe, it, expect } from 'vitest';
import { calculateVigilance } from '../weatherUtils';

describe('calculateVigilance', () => {
  it('returns all green for calm conditions', () => {
    const v = calculateVigilance(18, 10, 1, 0);
    expect(v.globalLevel).toBe('green');
    expect(v.categories.every(c => c.level === 'green')).toBe(true);
  });

  it('flags wind yellow at 65 km/h, orange at 90 km/h and red at 120 km/h+', () => {
    const yellow = calculateVigilance(18, 68, 1, 0);
    expect(yellow.categories.find(c => c.name === 'Vent violent')?.level).toBe('yellow');

    const orange = calculateVigilance(18, 95, 1, 0);
    expect(orange.categories.find(c => c.name === 'Vent violent')?.level).toBe('orange');

    const red = calculateVigilance(18, 125, 1, 0);
    expect(red.categories.find(c => c.name === 'Vent violent')?.level).toBe('red');
  });

  it('does not trigger frost vigilance above 0°C', () => {
    const v = calculateVigilance(0.9, 10, 1, 0);
    expect(v.categories.find(c => c.name === 'Canicule / Grand Froid')?.level).toBe('green');
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
