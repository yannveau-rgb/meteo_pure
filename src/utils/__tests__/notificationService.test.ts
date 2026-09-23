import { describe, it, expect } from 'vitest';
import {
  getZodiacSign,
  getDaysUntilChristmas,
  getFunnyRainMessage,
  getSarcasticChristmasCountdownMessage,
  getMonthlyChristmasCountdown,
  getMorningBriefContent
} from '../notificationService';

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

describe('getFunnyRainMessage (normalized notifications)', () => {
  const BANNED_WORDS = ['merde', 'putain', 'fion', 'cul', 'bâtard', 'pisse', 'chier', 'crève', 'con '];
  const intensities = ['light', 'moderate', 'heavy', 'thunderstorm', 'end_rain', 'end_storm', 'alert_yellow', 'alert_orange', 'alert_red', 'heatwave'] as const;

  it('generates polite, non-empty messages and titles for all intensities', () => {
    for (const intensity of intensities) {
      for (let i = 0; i < 20; i++) {
        const notif = getFunnyRainMessage(intensity, 'safe');
        expect(notif.title).toBeTruthy();
        expect(notif.message).toBeTruthy();
        
        const fullText = `${notif.title} ${notif.message}`.toLowerCase();
        for (const badWord of BANNED_WORDS) {
          expect(fullText).not.toContain(badWord);
        }
      }
    }
  });

  it('never outputs vulgar content even if level is spicy or vulgar', () => {
    for (const level of ['safe', 'spicy', 'vulgar'] as const) {
      for (const intensity of intensities) {
        const notif = getFunnyRainMessage(intensity, level);
        const fullText = `${notif.title} ${notif.message}`.toLowerCase();
        for (const badWord of BANNED_WORDS) {
          expect(fullText).not.toContain(badWord);
        }
      }
    }
  });
});

describe('Christmas Countdown & Morning Brief (normalized tone)', () => {
  const BANNED_WORDS = ['merde', 'putain', 'fion', 'cul', 'bâtard', 'pisse', 'chier', 'crève', 'hypocrisie', 'ruine'];

  it('getSarcasticChristmasCountdownMessage provides friendly festive messages', () => {
    for (let month = 0; month < 12; month++) {
      const date = new Date(2025, month, 15);
      const msg = getSarcasticChristmasCountdownMessage(date, 'safe');
      expect(msg.title).toBeTruthy();
      expect(msg.body).toBeTruthy();

      const fullText = `${msg.title} ${msg.body}`.toLowerCase();
      for (const badWord of BANNED_WORDS) {
        expect(fullText).not.toContain(badWord);
      }
    }
  });

  it('getMonthlyChristmasCountdown provides polite seasonal texts for all 12 months', () => {
    for (let month = 0; month < 12; month++) {
      const date = new Date(2025, month, 1);
      for (const level of ['safe', 'spicy', 'vulgar'] as const) {
        const msg = getMonthlyChristmasCountdown(date, level);
        expect(msg.title).toBeTruthy();
        expect(msg.body).toBeTruthy();

        const fullText = `${msg.title} ${msg.body}`.toLowerCase();
        for (const badWord of BANNED_WORDS) {
          expect(fullText).not.toContain(badWord);
        }
      }
    }
  });

  it('getMorningBriefContent provides uplifting and polite messages', () => {
    const brief = getMorningBriefContent('safe', '1995-04-10', 0); // Bélier, sunny
    expect(brief).not.toBeNull();
    if (brief) {
      expect(brief.title).toContain('Bélier');
      expect(brief.body.length).toBeGreaterThan(10);
      const fullText = `${brief.title} ${brief.body}`.toLowerCase();
      for (const badWord of BANNED_WORDS) {
        expect(fullText).not.toContain(badWord);
      }
    }
  });
});

