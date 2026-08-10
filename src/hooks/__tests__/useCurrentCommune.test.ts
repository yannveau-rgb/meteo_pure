import { describe, it, expect } from 'vitest';
import { shouldFollowLocation } from '../useCurrentCommune';

/**
 * The rule guarding automatic re-location on page load.
 *
 * Every case below except the first must stay false: a reload silently asking
 * for the user's position is a privacy regression, not a feature, and the only
 * safe signal is a permission the user has already granted.
 */
describe('shouldFollowLocation', () => {
  const withPermission = (state: string) => ({
    geolocation: {},
    permissions: { query: async () => ({ state }) },
  });

  it('follows the user when permission is already granted', async () => {
    expect(await shouldFollowLocation(withPermission('granted'))).toBe(true);
  });

  it('stays put when permission has never been asked', async () => {
    expect(await shouldFollowLocation(withPermission('prompt'))).toBe(false);
  });

  it('stays put when permission was refused', async () => {
    expect(await shouldFollowLocation(withPermission('denied'))).toBe(false);
  });

  it('stays put when the browser exposes no Permissions API', async () => {
    expect(await shouldFollowLocation({ geolocation: {} })).toBe(false);
  });

  it('stays put when geolocation itself is unavailable', async () => {
    expect(await shouldFollowLocation({ permissions: { query: async () => ({ state: 'granted' }) } })).toBe(false);
  });

  it('stays put when querying the permission throws', async () => {
    // Safari historically rejected on the "geolocation" descriptor name.
    expect(await shouldFollowLocation({
      geolocation: {},
      permissions: { query: async () => { throw new Error('unsupported'); } },
    })).toBe(false);
  });

  it('stays put when there is no navigator at all', async () => {
    expect(await shouldFollowLocation(undefined)).toBe(false);
  });
});
