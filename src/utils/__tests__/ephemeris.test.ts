import { describe, it, expect } from 'vitest';
import { getDaylightInfo, getSaintDuJour } from '../ephemeris';

describe('ephemeris & getDaylightInfo', () => {
  it('computes negative daily daylight delta in autumn (November in Paris)', () => {
    const novDate = new Date('2026-11-06T12:00:00Z');
    const info = getDaylightInfo(48.8566, 2.3522, 0, '07:45', '17:27', novDate);

    expect(info.isGaining).toBe(false);
    expect(info.deltaMinutesRounded).toBeLessThan(0);
    expect(info.badgeLabel).toMatch(/^-\d+ min \/ jour$/);
    expect(info.dayLengthFormatted).toBe('9h 42m');
    expect(info.weeklyDeltaMinutes).toBeLessThan(0);
    expect(info.headline).toContain('On perd');
    expect(info.morningDeltaMinutes + info.eveningDeltaMinutes).toBe(info.deltaMinutesRounded);
  });

  it('computes positive daily daylight delta in spring (March in Paris)', () => {
    const marDate = new Date('2026-03-25T12:00:00Z');
    const info = getDaylightInfo(48.8566, 2.3522, 0, '06:45', '19:10', marDate);

    expect(info.isGaining).toBe(true);
    expect(info.deltaMinutesRounded).toBeGreaterThan(0);
    expect(info.badgeLabel).toMatch(/^\+\d+ min \/ jour$/);
    expect(info.dayLengthFormatted).toBe('12h 25m');
    expect(info.weeklyDeltaMinutes).toBeGreaterThan(0);
    expect(info.headline).toContain('On gagne');
    expect(info.morningDeltaMinutes + info.eveningDeltaMinutes).toBe(info.deltaMinutesRounded);
  });

  it('returns saint du jour for a known date', () => {
    const date = new Date('2026-11-06T12:00:00Z');
    expect(getSaintDuJour(date)).toContain('Bertille');
  });
});
