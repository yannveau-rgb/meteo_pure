import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CelestialSky from '../CelestialSky';

describe('CelestialSky', () => {
  it('hides the sun disc when weatherCode is 3 (Couvert / Overcast)', () => {
    const html = renderToStaticMarkup(
      <CelestialSky
        hour={12}
        weatherCode={3}
        sunriseHour={7}
        sunsetHour={20}
      />
    );

    // When overcast, no glowing yellow sun halo exists
    expect(html).not.toContain('rgba(255, 180, 50, 0.35)');
    expect(html).not.toContain('scale(1.2)');

    // Background gradient must be overcast slate (#334155 / #475569 / #64748b)
    expect(html).toContain('#334155');
  });

  it('hides the sun disc when raining (weatherCode = 61)', () => {
    const html = renderToStaticMarkup(
      <CelestialSky
        hour={14}
        weatherCode={61}
        sunriseHour={7}
        sunsetHour={20}
      />
    );

    expect(html).not.toContain('rgba(255, 180, 50, 0.35)');
    expect(html).toContain('#1e293b');
  });

  it('hides the sun disc during thunderstorm (weatherCode = 95)', () => {
    const html = renderToStaticMarkup(
      <CelestialSky
        hour={15}
        weatherCode={95}
        sunriseHour={7}
        sunsetHour={20}
      />
    );

    expect(html).not.toContain('rgba(255, 180, 50, 0.35)');
    expect(html).toContain('#06070a');
  });

  it('renders radiant sun during clear daylight (weatherCode = 0)', () => {
    const html = renderToStaticMarkup(
      <CelestialSky
        hour={12}
        weatherCode={0}
        sunriseHour={7}
        sunsetHour={20}
      />
    );

    expect(html).toContain('rgba(255, 180, 50, 0.35)');
    expect(html).toContain('#3878cf');
  });

  it('renders moon at clear night (weatherCode = 0, hour = 23)', () => {
    const html = renderToStaticMarkup(
      <CelestialSky
        hour={23}
        weatherCode={0}
        sunriseHour={7}
        sunsetHour={20}
      />
    );

    // Moon exists
    expect(html).toContain('moonCrescent');
    // Sun does not exist
    expect(html).not.toContain('rgba(255, 180, 50, 0.35)');
  });

  it('hides moon at night when overcast (weatherCode = 3, hour = 23)', () => {
    const html = renderToStaticMarkup(
      <CelestialSky
        hour={23}
        weatherCode={3}
        sunriseHour={7}
        sunsetHour={20}
      />
    );

    // Moon is hidden by thick overcast
    expect(html).not.toContain('moonCrescent');
    // Sun does not exist
    expect(html).not.toContain('rgba(255, 180, 50, 0.35)');
  });
});
