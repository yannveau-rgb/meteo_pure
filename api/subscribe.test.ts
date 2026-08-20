import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const state = { subs: [] as any[] };

vi.mock('./_lib/storage.js', () => ({
  getSubscriptions: vi.fn(async () => state.subs),
  saveSubscriptions: vi.fn(async (subs: any[]) => { state.subs = subs; }),
}));

import handler from './subscribe.js';

function mockRes() {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res as VercelResponse);
  res.json = vi.fn().mockReturnValue(res as VercelResponse);
  return res as VercelResponse;
}

function mockReq(body: any): VercelRequest {
  return { method: 'POST', body } as VercelRequest;
}

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    state.subs = [{
      id: 'sub-1',
      subscription: { endpoint: 'https://push.example/sub-1' },
      commune: { nom: 'Rennes' },
      humorLevel: 'spicy',
      birthDate: '',
      prevHot: false,
      prevRain: true,
      prevStorm: false,
      prevVigilance: 'yellow',
      lastBriefDate: '2026-08-19',
      lastChristmasDate: '',
      updatedAt: '2026-08-19T08:00:00.000Z',
    }];
  });

  it('preserves prevRain/prevStorm/prevHot on a silent resync without currentConditions', async () => {
    // This is what App.tsx's silent refresh sends on every app load: no
    // currentConditions. A naive `currentConditions ? … : false` here used
    // to wipe the tracked rain state, making the next cron pass re-announce
    // rain that had already started.
    await handler(mockReq({
      subscription: { endpoint: 'https://push.example/sub-1' },
      commune: { nom: 'Rennes' },
      humorLevel: 'spicy',
    }), mockRes());

    expect(state.subs[0].prevRain).toBe(true);
    expect(state.subs[0].prevStorm).toBe(false);
    expect(state.subs[0].prevHot).toBe(false);
    expect(state.subs[0].prevVigilance).toBe('yellow');
    expect(state.subs[0].lastBriefDate).toBe('2026-08-19');
  });

  it('still derives state from currentConditions on a real subscribe payload', async () => {
    await handler(mockReq({
      subscription: { endpoint: 'https://push.example/sub-1' },
      commune: { nom: 'Rennes' },
      humorLevel: 'spicy',
      currentConditions: { temperature: 32, precipitation: 0, weatherCode: 0 },
    }), mockRes());

    expect(state.subs[0].prevHot).toBe(true);
    expect(state.subs[0].prevRain).toBe(false);
  });
});
