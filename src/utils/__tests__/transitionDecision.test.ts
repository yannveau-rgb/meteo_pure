import { describe, it, expect } from 'vitest';
import { decideTransition, TransitionDecisionInput } from '../transitionDecision';

// Noon Paris (UTC+2 in August) — comfortably outside quiet hours for every test
// that doesn't specifically exercise quiet-hours behavior.
const NOON = new Date('2026-08-20T10:00:00Z');
// 3 AM Paris — inside quiet hours (22h-7h).
const THREE_AM = new Date('2026-08-20T01:00:00Z');

function baseInput(overrides: Partial<TransitionDecisionInput> = {}): TransitionDecisionInput {
  return {
    currentVigilance: 'green',
    prevVigilance: 'green',
    isRainingNow: false,
    isStormingNow: false,
    isHotNow: false,
    prevRain: false,
    prevStorm: false,
    prevHot: false,
    ...overrides,
  };
}

describe('decideTransition — vigilance priority', () => {
  it('triggers alert_yellow when vigilance rises to yellow', () => {
    const result = decideTransition(baseInput({ currentVigilance: 'yellow' }), NOON);
    expect(result).toEqual({ shouldTrigger: true, transitionType: 'alert_yellow' });
  });

  it('triggers alert_orange when vigilance rises to orange', () => {
    const result = decideTransition(baseInput({ currentVigilance: 'orange' }), NOON);
    expect(result.transitionType).toBe('alert_orange');
  });

  it('triggers alert_red when vigilance rises to red', () => {
    const result = decideTransition(baseInput({ currentVigilance: 'red' }), NOON);
    expect(result.transitionType).toBe('alert_red');
  });

  it('does not trigger when vigilance drops back to green', () => {
    const result = decideTransition(baseInput({ currentVigilance: 'green', prevVigilance: 'yellow' }), NOON);
    expect(result.shouldTrigger).toBe(false);
  });

  it('does not re-trigger when vigilance is unchanged', () => {
    const result = decideTransition(baseInput({ currentVigilance: 'orange', prevVigilance: 'orange' }), NOON);
    expect(result.shouldTrigger).toBe(false);
  });

  it('vigilance takes priority over a simultaneous storm', () => {
    const result = decideTransition(
      baseInput({ currentVigilance: 'orange', isStormingNow: true, prevStorm: false }),
      NOON
    );
    expect(result.transitionType).toBe('alert_orange');
  });
});

describe('decideTransition — weather-event transitions', () => {
  it('triggers thunderstorm on storm onset', () => {
    const result = decideTransition(baseInput({ isStormingNow: true, prevStorm: false }), NOON);
    expect(result).toEqual({ shouldTrigger: true, transitionType: 'thunderstorm' });
  });

  it('triggers moderate on rain onset (no storm)', () => {
    const result = decideTransition(baseInput({ isRainingNow: true, prevRain: false }), NOON);
    expect(result).toEqual({ shouldTrigger: true, transitionType: 'moderate' });
  });

  it('does not trigger moderate rain when a storm is also starting (storm wins)', () => {
    const result = decideTransition(
      baseInput({ isRainingNow: true, prevRain: false, isStormingNow: true, prevStorm: false }),
      NOON
    );
    expect(result.transitionType).toBe('thunderstorm');
  });

  it('triggers heatwave on heat onset', () => {
    const result = decideTransition(baseInput({ isHotNow: true, prevHot: false }), NOON);
    expect(result).toEqual({ shouldTrigger: true, transitionType: 'heatwave' });
  });

  it('does not trigger when already raining (no new onset)', () => {
    const result = decideTransition(baseInput({ isRainingNow: true, prevRain: true }), NOON);
    expect(result.shouldTrigger).toBe(false);
  });

  it('does not trigger on rain/storm/heat end', () => {
    const result = decideTransition(
      baseInput({ isRainingNow: false, prevRain: true, isStormingNow: false, prevStorm: true, isHotNow: false, prevHot: true }),
      NOON
    );
    expect(result.shouldTrigger).toBe(false);
  });
});

describe('decideTransition — per-category opt-out', () => {
  it('suppresses alert types when alertNotificationsEnabled is false', () => {
    const result = decideTransition(
      baseInput({ currentVigilance: 'yellow', alertNotificationsEnabled: false }),
      NOON
    );
    expect(result).toEqual({ shouldTrigger: false, transitionType: null });
  });

  it('suppresses heatwave when alertNotificationsEnabled is false', () => {
    const result = decideTransition(
      baseInput({ isHotNow: true, prevHot: false, alertNotificationsEnabled: false }),
      NOON
    );
    expect(result.shouldTrigger).toBe(false);
  });

  it('suppresses storm when stormNotificationsEnabled is false', () => {
    const result = decideTransition(
      baseInput({ isStormingNow: true, prevStorm: false, stormNotificationsEnabled: false }),
      NOON
    );
    expect(result.shouldTrigger).toBe(false);
  });

  it('suppresses rain when rainNotificationsEnabled is false', () => {
    const result = decideTransition(
      baseInput({ isRainingNow: true, prevRain: false, rainNotificationsEnabled: false }),
      NOON
    );
    expect(result.shouldTrigger).toBe(false);
  });

  it('does not suppress rain when only stormNotificationsEnabled is false', () => {
    const result = decideTransition(
      baseInput({ isRainingNow: true, prevRain: false, stormNotificationsEnabled: false }),
      NOON
    );
    expect(result.shouldTrigger).toBe(true);
  });
});

describe('decideTransition — quiet hours (22h-7h Paris)', () => {
  it('suppresses a routine rain trigger at 3 AM Paris', () => {
    const result = decideTransition(baseInput({ isRainingNow: true, prevRain: false }), THREE_AM);
    expect(result.shouldTrigger).toBe(false);
  });

  it('suppresses a routine storm trigger at 3 AM Paris', () => {
    const result = decideTransition(baseInput({ isStormingNow: true, prevStorm: false }), THREE_AM);
    expect(result.shouldTrigger).toBe(false);
  });

  it('suppresses alert_yellow at 3 AM Paris', () => {
    const result = decideTransition(baseInput({ currentVigilance: 'yellow' }), THREE_AM);
    expect(result.shouldTrigger).toBe(false);
  });

  it('does NOT suppress alert_orange at 3 AM Paris (safety-critical bypass)', () => {
    const result = decideTransition(baseInput({ currentVigilance: 'orange' }), THREE_AM);
    expect(result.shouldTrigger).toBe(true);
  });

  it('does NOT suppress alert_red at 3 AM Paris (safety-critical bypass)', () => {
    const result = decideTransition(baseInput({ currentVigilance: 'red' }), THREE_AM);
    expect(result.shouldTrigger).toBe(true);
  });

  it('allows a routine trigger at noon Paris', () => {
    const result = decideTransition(baseInput({ isRainingNow: true, prevRain: false }), NOON);
    expect(result.shouldTrigger).toBe(true);
  });
});

describe('decideTransition — cooldown', () => {
  it('suppresses a routine trigger inside the default 30-minute cooldown', () => {
    const lastPush = new Date(NOON.getTime() - 10 * 60000).toISOString();
    const result = decideTransition(
      baseInput({ isRainingNow: true, prevRain: false, lastTransitionPushAt: lastPush }),
      NOON
    );
    expect(result.shouldTrigger).toBe(false);
  });

  it('allows a routine trigger once the default cooldown has elapsed', () => {
    const lastPush = new Date(NOON.getTime() - 31 * 60000).toISOString();
    const result = decideTransition(
      baseInput({ isRainingNow: true, prevRain: false, lastTransitionPushAt: lastPush }),
      NOON
    );
    expect(result.shouldTrigger).toBe(true);
  });

  it('respects a custom minMinutesBetweenAlerts', () => {
    const lastPush = new Date(NOON.getTime() - 5 * 60000).toISOString();
    const result = decideTransition(
      baseInput({ isRainingNow: true, prevRain: false, lastTransitionPushAt: lastPush, minMinutesBetweenAlerts: 3 }),
      NOON
    );
    expect(result.shouldTrigger).toBe(true);
  });

  it('does NOT apply cooldown to alert_orange (safety-critical bypass)', () => {
    const lastPush = new Date(NOON.getTime() - 1 * 60000).toISOString();
    const result = decideTransition(
      baseInput({ currentVigilance: 'orange', lastTransitionPushAt: lastPush }),
      NOON
    );
    expect(result.shouldTrigger).toBe(true);
  });

  it('does NOT apply cooldown to alert_red (safety-critical bypass)', () => {
    const lastPush = new Date(NOON.getTime() - 1 * 60000).toISOString();
    const result = decideTransition(
      baseInput({ currentVigilance: 'red', lastTransitionPushAt: lastPush }),
      NOON
    );
    expect(result.shouldTrigger).toBe(true);
  });

  it('ignores cooldown when there is no prior push recorded', () => {
    const result = decideTransition(baseInput({ isRainingNow: true, prevRain: false }), NOON);
    expect(result.shouldTrigger).toBe(true);
  });
});
