import { describe, it, expect } from 'vitest';
import { getDailyHoroscope, ZODIAC_METAS } from '../horoscopeService';

describe('horoscopeService', () => {
  it('contient les métadonnées complètes pour les 12 signes du zodiaque', () => {
    const expectedSigns = [
      'Bélier', 'Taureau', 'Gémeaux', 'Cancer',
      'Lion', 'Vierge', 'Balance', 'Scorpion',
      'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'
    ];

    expect(Object.keys(ZODIAC_METAS)).toHaveLength(12);

    expectedSigns.forEach((sign) => {
      const meta = ZODIAC_METAS[sign];
      expect(meta).toBeDefined();
      expect(meta.sign).toBe(sign);
      expect(meta.symbol).toBeTruthy();
      expect(['Feu', 'Terre', 'Air', 'Eau']).toContain(meta.element);
      expect(meta.planet).toBeTruthy();
      expect(meta.period).toBeTruthy();
      expect(meta.keywords.length).toBeGreaterThan(0);
    });
  });

  it('génère un horoscope complet et structuré pour un signe donné', () => {
    // 15 juillet -> Cancer (Eau)
    const horoscope = getDailyHoroscope('1992-07-15', new Date(2026, 8, 23));

    expect(horoscope.sign).toBe('Cancer');
    expect(horoscope.symbol).toBe('♋');
    expect(horoscope.element).toBe('Eau');
    expect(horoscope.planet).toBe('Lune');
    expect(horoscope.general).toBeTruthy();
    expect(horoscope.love).toBeTruthy();
    expect(horoscope.career).toBeTruthy();
    expect(horoscope.vitality).toBeTruthy();
    expect(horoscope.advice).toBeTruthy();
    expect(horoscope.luckyNumber).toBeGreaterThanOrEqual(1);
    expect(horoscope.luckyNumber).toBeLessThanOrEqual(90);
    expect(horoscope.compatibility).toBeTruthy();
    expect(horoscope.ai).toBe(false);
  });

  it('fournit des prévisions différentes selon l’élément (Terre vs Feu)', () => {
    const cancerDate = new Date(2026, 8, 23);
    const horoscopeCancer = getDailyHoroscope('1990-07-10', cancerDate); // Cancer (Eau)
    const horoscopeBélier = getDailyHoroscope('1990-04-05', cancerDate); // Bélier (Feu)

    expect(horoscopeCancer.element).toBe('Eau');
    expect(horoscopeBélier.element).toBe('Feu');
    expect(horoscopeCancer.general).not.toBe(horoscopeBélier.general);
  });

  it('est déterministe pour une date cible donnée', () => {
    const fixedDate = new Date(2026, 5, 12);
    const res1 = getDailyHoroscope('1988-11-03', fixedDate);
    const res2 = getDailyHoroscope('1988-11-03', fixedDate);

    expect(res1).toEqual(res2);
  });

  it('fournit un fallback propre si la date de naissance est invalide ou vide', () => {
    const fallback = getDailyHoroscope('');
    expect(fallback.sign).toBe('Bélier');
    expect(fallback.element).toBe('Feu');
    expect(fallback.general).toBeTruthy();
  });
});
