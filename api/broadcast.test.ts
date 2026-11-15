import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const state = { subs: [] as any[] };
const send = vi.fn();

vi.mock('web-push', () => ({ default: { sendNotification: (...a: any[]) => send(...a) } }));
vi.mock('./_lib/vapid.js', () => ({ configureVapid: vi.fn() }));
vi.mock('./_lib/storage.js', () => ({
  getSubscriptions: vi.fn(async () => state.subs),
  withSubscriptionsLock: vi.fn(async (fn: (subs: any[]) => Promise<{ subs: any[]; result: any }>) => {
    const { subs, result } = await fn(state.subs);
    state.subs = subs;
    return result;
  }),
}));

import handler from './broadcast.js';

function mockRes() {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res as VercelResponse);
  res.json = vi.fn().mockReturnValue(res as VercelResponse);
  return res as VercelResponse;
}

function mockReq(body: any, token: string | null = 'secret'): VercelRequest {
  return { method: 'POST', body, headers: token ? { 'x-admin-token': token } : {} } as unknown as VercelRequest;
}

describe('POST /api/broadcast', () => {
  beforeEach(() => {
    process.env.ADMIN_TOKEN = 'secret';
    send.mockReset();
    state.subs = [
      { id: 'a', subscription: { endpoint: 'a' } },
      { id: 'b', subscription: { endpoint: 'b' } },
    ];
  });

  it('refuse sans jeton admin', async () => {
    const res = mockRes();
    await handler(mockReq({ title: 't', message: 'm' }, null), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(send).not.toHaveBeenCalled();
  });

  it('refuse un corps incomplet ou trop long', async () => {
    const res = mockRes();
    await handler(mockReq({ title: 't' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    const res2 = mockRes();
    await handler(mockReq({ title: 't', message: 'x'.repeat(300) }), res2);
    expect(res2.status).toHaveBeenCalledWith(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("n'envoie rien sans confirm (à blanc) et compte les destinataires", async () => {
    const res = mockRes();
    await handler(mockReq({ title: 'Titre', message: 'Message' }), res);
    expect(send).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, recipients: 2 }));
  });

  it('envoie à tous avec confirm et retire les abonnements expirés', async () => {
    send.mockImplementation(async (sub: any) => {
      if (sub.endpoint === 'b') throw Object.assign(new Error('gone'), { statusCode: 410 });
    });
    const res = mockRes();
    await handler(mockReq({ title: 'Titre', message: 'Message', confirm: true }), res);
    expect(send).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ success: true, successCount: 1, failCount: 1, removed: 1 });
    expect(state.subs.map((s) => s.id)).toEqual(['a']);
  });
});
