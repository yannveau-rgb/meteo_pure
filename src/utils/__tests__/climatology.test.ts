import { describe, it, expect } from 'vitest';
import { getLocalClimatology } from '../climatology';

describe('getLocalClimatology — altitude', () => {
  // Chamonix : même position qu'avant le correctif, altitude très différente de la côte.
  const lat = 45.92;
  const lon = 6.87;

  it("ne change rien sans altitude connue ni pour un écart de moins de 100 m", () => {
    const base = getLocalClimatology(lat, lon, 5, 10);
    expect(getLocalClimatology(lat, lon, 5, 10, undefined).normalMax).toBe(base.normalMax);
    expect(getLocalClimatology(lat, lon, 5, 10, 150).normalMax).toBe(base.normalMax);
  });

  it("abaisse les normales d'environ 6,5 °C par 1000 m au-dessus des stations de référence", () => {
    const base = getLocalClimatology(lat, lon, 5, 10);
    const high = getLocalClimatology(lat, lon, 5, 10, 1080); // ~1000 m au-dessus de 80 m
    expect(base.normalMax - high.normalMax).toBeCloseTo(6.5, 0);
    expect(base.normalMin - high.normalMin).toBeCloseTo(6.5, 0);
  });

  it("l'écart affiché reflète des normales corrigées : 2 °C de plus que la normale d'altitude", () => {
    const high = getLocalClimatology(lat, lon, 0, 0, 1080);
    const warmer = getLocalClimatology(lat, lon, high.normalMin + 2, high.normalMax + 2, 1080);
    expect(warmer.deviationMax).toBeCloseTo(2, 1);
  });
});
