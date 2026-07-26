import { describe, it, expect } from 'vitest';
import { assessConfidence } from '../forecastConfidence';

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
