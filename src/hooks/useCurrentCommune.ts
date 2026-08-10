import { useEffect, useState } from 'react';
import { Commune } from '../types';
import { getCommuneByCoords } from '../utils/weatherApi';

const STORAGE_KEY = 'meteo_pure_last_commune';

const DEFAULT_COMMUNE: Commune = {
  nom: 'Paris',
  code: '75056',
  codesPostaux: ['75001'],
  centre: { type: 'Point', coordinates: [2.3522, 48.8566] },
  codeDepartement: '75'
};

/** Minimal shape of what the auto-locate decision needs from `navigator`. */
interface GeoCapableNavigator {
  geolocation?: unknown;
  permissions?: { query: (descriptor: { name: string }) => Promise<{ state: string }> };
}

/**
 * Whether a page load may silently re-locate the user.
 *
 * True only when permission has *already* been granted. Anything else — not yet
 * asked, refused, or an API the browser does not expose — means no: a reload
 * must never become a permission prompt for someone who never opted in.
 */
export async function shouldFollowLocation(nav: GeoCapableNavigator | undefined): Promise<boolean> {
  if (!nav?.geolocation || !nav?.permissions) return false;
  try {
    const status = await nav.permissions.query({ name: 'geolocation' });
    return status.state === 'granted';
  } catch {
    return false; // Permissions API unsupported for this name — do not guess.
  }
}

export function useCurrentCommune() {
  const [showWelcomePrompt, setShowWelcomePrompt] = useState<boolean>(
    () => !localStorage.getItem(STORAGE_KEY)
  );

  const [currentCommune, setCurrentCommune] = useState<Commune>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading last commune from localStorage', e);
    }
    return DEFAULT_COMMUNE;
  });

  useEffect(() => {
    if (!currentCommune) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCommune));
    } catch (e) {
      console.error('Error saving commune to localStorage', e);
    }
  }, [currentCommune]);

  /**
   * Follow the user on reload, but only for those who already said yes.
   *
   * Reloading used to restore whichever commune was stored, so someone who had
   * travelled kept reading yesterday's town until they thought to press the pin.
   * Locating on every load fixes that — except it would also turn a plain
   * refresh into a permission prompt for everyone who never opted in, which is
   * worse than the problem. See shouldFollowLocation: act when the answer is
   * already "granted", stay silent otherwise. The pin button remains the way in.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!(await shouldFollowLocation(navigator))) return;
      if (cancelled) return;

      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          if (cancelled) return;
          try {
            const nearest = await getCommuneByCoords(coords.latitude, coords.longitude);
            // Null outside France, where the reverse geocoder has nothing to
            // offer; the stored commune is then the better answer.
            if (nearest && !cancelled) setCurrentCommune(nearest);
          } catch {
            // Silent by design: this is an enhancement over the stored commune.
          }
        },
        () => {},
        // A slightly stale fix beats a spinner: the commune would not change.
        { timeout: 8000, maximumAge: 5 * 60 * 1000 },
      );
    })();

    return () => { cancelled = true; };
  }, []);

  return { currentCommune, setCurrentCommune, showWelcomePrompt, setShowWelcomePrompt };
}
