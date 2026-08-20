export type TransitionType =
  | 'alert_red' | 'alert_orange' | 'alert_yellow'
  | 'thunderstorm' | 'moderate' | 'heatwave'
  | null;

export interface TransitionDecisionInput {
  currentVigilance: string;
  prevVigilance: string;
  isRainingNow: boolean;
  isStormingNow: boolean;
  isHotNow: boolean;
  prevRain: boolean;
  prevStorm: boolean;
  prevHot: boolean;
  rainNotificationsEnabled?: boolean;
  stormNotificationsEnabled?: boolean;
  alertNotificationsEnabled?: boolean;
  /** Cooldown length in minutes for routine (non-safety-critical) pushes. Defaults to 30. */
  minMinutesBetweenAlerts?: number;
  /** ISO timestamp of the last transition push sent to this subscriber, if any. */
  lastTransitionPushAt?: string;
}

export interface TransitionDecision {
  shouldTrigger: boolean;
  transitionType: TransitionType;
}

/**
 * Pure decision function for whether a weather-transition push should fire,
 * and which category — extracted from the ~60-line inline block in
 * checkAllSubscriptions so the rules (vigilance takes priority, quiet hours,
 * per-category opt-out, cooldown, orange/red bypass everything) are testable
 * without mocking Open-Meteo, web-push, and Redis.
 *
 * `now` is injected (rather than read via `new Date()` internally) so tests
 * can pin quiet-hours and cooldown behavior to an exact instant.
 */
export function decideTransition(input: TransitionDecisionInput, now: Date): TransitionDecision {
  let shouldTrigger = false;
  let transitionType: TransitionType = null;

  if (input.currentVigilance !== input.prevVigilance && input.currentVigilance !== 'green') {
    transitionType =
      input.currentVigilance === 'red' ? 'alert_red' :
      input.currentVigilance === 'orange' ? 'alert_orange' : 'alert_yellow';
    shouldTrigger = true;
  }

  if (!shouldTrigger) {
    // "end_rain" / "end_storm" deliberately no longer notify. Telling
    // someone it stopped raining prompts no action — they can see out of a
    // window — while mechanically doubling the notification count of every
    // single rain episode. Callers still track prevRain/prevStorm so the
    // *start* of the next episode is detected correctly.
    if (input.isStormingNow && !input.prevStorm) {
      transitionType = 'thunderstorm';
      shouldTrigger = true;
    } else if (input.isRainingNow && !input.prevRain && !input.isStormingNow) {
      transitionType = 'moderate';
      shouldTrigger = true;
    } else if (input.isHotNow && !input.prevHot) {
      transitionType = 'heatwave';
      shouldTrigger = true;
    }
  }

  // Respect the per-category toggles set in Réglages.
  if (shouldTrigger) {
    const isAlertType = transitionType === 'alert_yellow' || transitionType === 'alert_orange' || transitionType === 'alert_red' || transitionType === 'heatwave';
    const isStormType = transitionType === 'thunderstorm';
    const isRainType = transitionType === 'moderate';
    if (isAlertType && input.alertNotificationsEnabled === false) shouldTrigger = false;
    else if (isStormType && input.stormNotificationsEnabled === false) shouldTrigger = false;
    else if (isRainType && input.rainNotificationsEnabled === false) shouldTrigger = false;
  }

  const isSafetyCritical = transitionType === 'alert_orange' || transitionType === 'alert_red';

  // Quiet hours: nothing routine wakes anyone between 22h and 7h Paris.
  // Orange/red vigilance is exempt — a violent storm at 3am is precisely
  // when a notification earns its keep.
  if (shouldTrigger && !isSafetyCritical) {
    const hourNow = parseInt(
      now.toLocaleTimeString('en-US', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false }),
      10
    );
    if (hourNow >= 22 || hourNow < 7) shouldTrigger = false;
  }

  // Cooldown between routine pushes to the same person, so a borderline
  // value flip-flopping across checks (e.g. precipitation hovering right at
  // 0mm) can't fire a burst of alerts. Orange/red vigilance bypasses it.
  if (shouldTrigger && !isSafetyCritical) {
    const cooldownMin = typeof input.minMinutesBetweenAlerts === 'number' ? input.minMinutesBetweenAlerts : 30;
    if (input.lastTransitionPushAt) {
      const elapsedMin = (now.getTime() - new Date(input.lastTransitionPushAt).getTime()) / 60000;
      if (elapsedMin < cooldownMin) shouldTrigger = false;
    }
  }

  return { shouldTrigger, transitionType: shouldTrigger ? transitionType : null };
}
