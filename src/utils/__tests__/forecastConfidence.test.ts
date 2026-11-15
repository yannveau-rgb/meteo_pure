import { describe, it, expect } from 'vitest';
import { assessConfidence, assessRainAgreement } from '../forecastConfidence';

describe('assessConfidence', () => {
  it('returns null with a single source', () => {
    // No agreement can be measured from one model; inventing a confidence
    // level would be worse than showing none.
    expect(assessConfidence([21])).toBeNull();
    expect(assessConfidence([21, null, undefined])).toBeNull();
  });

  it('returns null when nothing is usable', () => {
    expect(assessConfidence([null, undefined, NaN])).toBeNull();
  });

  it('reports high confidence on tight agreement', () => {
    const r = assessConfidence([21.2, 21.8, 22.0])!;
    expect(r.level).toBe('high');
    expect(r.sources).toBe(3);
  });

  it('reports medium confidence on mild divergence', () => {
    expect(assessConfidence([20, 22])!.level).toBe('medium');
  });

  it('reports low confidence on wide divergence', () => {
    const r = assessConfidence([18, 24.5])!;
    expect(r.level).toBe('low');
    expect(r.spread).toBe(6.5);
  });

  it('ignores missing models rather than treating them as zero', () => {
    const r = assessConfidence([19.5, null, 20.1])!;
    expect(r.sources).toBe(2);
    expect(r.level).toBe('high');
  });

  it('rounds the spread to one decimal', () => {
    expect(assessConfidence([20.04, 22.39])!.spread).toBe(2.4);
  });

  it('places the boundary between high and medium at 1.5', () => {
    expect(assessConfidence([20, 21.4])!.level).toBe('high');
    expect(assessConfidence([20, 21.6])!.level).toBe('medium');
  });
});

describe('assessRainAgreement', () => {
  it('renvoie null avec un seul modèle', () => {
    expect(assessRainAgreement([3, null, undefined])).toBeNull();
  });

  it('low quand un modèle prévoit une journée pluvieuse et un autre une journée sèche', () => {
    expect(assessRainAgreement([5, 0, 0.1])).toBe('low');
  });

  it('medium quand tous sont du même côté mais les cumuls diffèrent de 4 mm ou plus', () => {
    expect(assessRainAgreement([2, 7, 5])).toBe('medium');
  });

  it('high quand les modèles sont cohérents (secs ensemble, ou pluvieux proches)', () => {
    expect(assessRainAgreement([0, 0.1, 0])).toBe('high');
    expect(assessRainAgreement([4, 5, 4.5])).toBe('high');
  });

  it("ignore les modèles sans valeur (AROME s'arrête vers J+2)", () => {
    expect(assessRainAgreement([null, 6, 0])).toBe('low');
  });
});
