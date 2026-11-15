import { describe, it, expect } from 'vitest';
import { parseObservation } from './meteofrance.js';

/**
 * Règles qui décident si une station peut parler pour une commune :
 * jamais d'altitude inventée, température corrigée du dénivelé, et rejet
 * quand l'écart est trop grand ou inconnu.
 */

const record = (t: number) => ({
  validity_time: new Date().toISOString(),
  t, // °C (< 100 : pas de conversion Kelvin)
  u: 70,
  ff: 3, // m/s
  raf: 6,
});

const station = (altitude: number | undefined) => ({
  id: '1',
  name: 'Station test',
  lat: 48,
  lon: 2,
  altitude,
});

describe('parseObservation — altitude', () => {
  it('garde la température brute sous 150 m d\'écart', () => {
    const o = parseObservation(null, record(20), station(100), 3, 200);
    expect(o?.temperature).toBe(20);
    expect(o?.lapseCorrected).toBe(false);
  });

  it('corrige la température du dénivelé entre 150 et 400 m (0,65 °C / 100 m)', () => {
    // Commune 200 m plus haut que la station : plus froid de 1,3 °C.
    const o = parseObservation(null, record(20), station(100), 8, 300);
    expect(o?.lapseCorrected).toBe(true);
    expect(o?.temperature).toBeCloseTo(20 - 200 * 0.0065, 1);
  });

  it('rejette la température au-delà de 400 m d\'écart', () => {
    const o = parseObservation(null, record(20), station(100), 8, 900);
    expect(o?.temperature).toBeUndefined();
  });

  it('ne prend plus une altitude de station inconnue pour 0 m', () => {
    // Station sans altitude, commune à 600 m : avec « 0 m » l'écart de 600 m aurait
    // rejeté la mesure par hasard ; ici l'écart est simplement inconnu.
    const near = parseObservation(null, record(20), station(undefined), 3, 600);
    expect(near?.temperature).toBe(20);
    expect(near?.altitudeDeltaM).toBeUndefined();
    const far = parseObservation(null, record(20), station(undefined), 10, 600);
    expect(far?.temperature).toBeUndefined();
  });

  it('rejette la température d\'une station lointaine quand l\'altitude de la commune est inconnue', () => {
    expect(parseObservation(null, record(20), station(100), 10, null)?.temperature).toBeUndefined();
    expect(parseObservation(null, record(20), station(100), 3, null)?.temperature).toBe(20);
  });

  it('garde vent et humidité même quand la température est rejetée', () => {
    const o = parseObservation(null, record(20), station(100), 10, null);
    expect(o?.temperature).toBeUndefined();
    expect(o?.windSpeed).toBe(11); // 3 m/s = 10,8 km/h
    expect(o?.humidity).toBe(70);
  });
});
