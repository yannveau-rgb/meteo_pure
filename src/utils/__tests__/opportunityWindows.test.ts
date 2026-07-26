import { describe, it, expect } from 'vitest';
import { findDryWindow, getLaundryVerdict, formatDryWindow } from '../opportunityWindows';
import { HourlyForecastItem } from '../../types';

const hour = (h: number, precip: number, prob: number): HourlyForecastItem => ({
  time: `${String(h).padStart(2, '0')}:00`,
  temp: 20,
  weatherCode: precip > 0 ? 61 : 1,
  iconName: '1',
  precipitationProbability: prob,
  precipitation: precip,
});

describe('findDryWindow', () => {
  it('returns null when it rains throughout', () => {
    const hours = Array.from({ length: 10 }, (_, i) => hour(8 + i, 1, 90));
    expect(findDryWindow(hours)).toBeNull();
  });

  it('rejects an isolated dry hour as unusable', () => {
    const hours = [hour(9, 1, 90), hour(10, 0, 5), hour(11, 1, 90)];
    expect(findDryWindow(hours)).toBeNull();
  });

  it('finds the longest stretch, not merely the first', () => {
    const hours = [
      hour(8, 0, 5), hour(9, 0, 5),            // 2h
      hour(10, 1, 80),
      hour(11, 0, 5), hour(12, 0, 5), hour(13, 0, 5), hour(14, 0, 5), // 4h
      hour(15, 1, 80),
    ];
    const w = findDryWindow(hours);
    expect(w).not.toBeNull();
    expect(w!.startHour).toBe(11);
    expect(w!.length).toBe(4);
  });

  it('treats a very high rain probability as not dry even at 0mm', () => {
    const hours = [hour(9, 0, 80), hour(10, 0, 85), hour(11, 0, 80)];
    expect(findDryWindow(hours)).toBeNull();
  });

  it('still counts a moderate probability at 0mm as usable', () => {
    // Models disagree wildly on probability for identical 0mm forecasts
    // (ECMWF 21-51% vs GFS blend 0-13% on the same Paris evening), so amount
    // leads and probability only vetoes at high confidence. Otherwise the app
    // reports "no dry slot" on a visibly clear evening.
    const hours = [hour(18, 0, 21), hour(19, 0, 41), hour(20, 0, 51), hour(21, 0, 40)];
    const w = findDryWindow(hours);
    expect(w).not.toBeNull();
    expect(w!.length).toBe(4);
  });

  it('applies a stricter ceiling when asked', () => {
    const hours = [hour(18, 0, 55), hour(19, 0, 55), hour(20, 0, 55)];
    expect(findDryWindow(hours)).not.toBeNull();          // outing: tolerated
    expect(findDryWindow(hours, undefined, 50)).toBeNull(); // laundry: refused
  });

  it('honours the fromHour cutoff', () => {
    const hours = [hour(7, 0, 5), hour(8, 0, 5), hour(15, 1, 90), hour(16, 1, 90)];
    expect(findDryWindow(hours, 14)).toBeNull();
  });

  it('ignores night hours', () => {
    const hours = [hour(2, 0, 0), hour(3, 0, 0), hour(4, 0, 0)];
    expect(findDryWindow(hours)).toBeNull();
  });

  it('never welds hours together across the night gap', () => {
    // Regression: filtering out-of-range hours instead of breaking on them
    // stitched 22h onto the next morning, yielding "22h → 10h · 5h sans pluie"
    // at 22:05 on a real evening.
    const hours = [
      hour(22, 0, 5), hour(23, 0, 5), hour(0, 0, 5), hour(1, 0, 5),
      hour(6, 0, 5), hour(7, 0, 5), hour(8, 0, 5),
    ];
    const w = findDryWindow(hours);
    expect(w).not.toBeNull();
    expect(w!.startHour).toBe(6);
    expect(w!.endHour).toBe(9);
    expect(w!.length).toBe(3);
  });

  it('marks a post-midnight window as next-day', () => {
    const hours = [
      hour(21, 0, 5), hour(22, 0, 5), hour(23, 0, 5),
      hour(7, 0, 5), hour(8, 0, 5), hour(9, 0, 5), hour(10, 0, 5),
    ];
    const w = findDryWindow(hours);
    expect(w!.nextDay).toBe(true);
    expect(formatDryWindow(w!)).toBe('demain 7h → 11h');
  });

  it('does not flag a same-day window as next-day', () => {
    const hours = [hour(9, 0, 5), hour(10, 0, 5), hour(11, 0, 5)];
    const w = findDryWindow(hours);
    expect(w!.nextDay).toBe(false);
    expect(formatDryWindow(w!)).toBe('9h → 12h');
  });
});

describe('getLaundryVerdict', () => {
  const dryDay = Array.from({ length: 10 }, (_, i) => hour(9 + i, 0, 5));

  it('approves a long dry breezy day', () => {
    const v = getLaundryVerdict(dryDay, 55, 15);
    expect(v!.ok).toBe(true);
  });

  it('rejects a wet day', () => {
    const wet = Array.from({ length: 10 }, (_, i) => hour(9 + i, 2, 95));
    expect(getLaundryVerdict(wet, 55, 15)!.ok).toBe(false);
  });

  it('rejects a dry but short window', () => {
    const shortDry = [hour(9, 0, 5), hour(10, 0, 5), hour(11, 1, 90)];
    expect(getLaundryVerdict(shortDry, 55, 15)!.ok).toBe(false);
  });

  it('rejects still, saturated air even with no rain', () => {
    // The nuance a plain "no rain today" reading would miss entirely.
    const v = getLaundryVerdict(dryDay, 92, 3);
    expect(v!.ok).toBe(false);
    expect(v!.label).toMatch(/humide/i);
  });
});
