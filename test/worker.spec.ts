import { describe, it, expect } from 'vitest';
import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index';

const env = {
  BASE_URL: 'https://github.com/go-vikunja',
  DOMAIN: 'code.vikunja.io',
};

describe('vanity Worker', () => {
  it('redirects /frontend to GitHub', async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request('https://code.vikunja.io/frontend'), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(308);
    expect(res.headers.get('location'))
      .toBe('https://github.com/go-vikunja/vikunja/tree/main/frontend');
  });

  it('serves go-import meta on ?go-get=1', async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request('https://code.vikunja.io/vikunja?go-get=1'), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.headers.get('content-type')).toContain('text/html');
    const body = await res.text();
    expect(body).toMatch(/<meta name="go-import"[^>]+vikunja.git/);
  });
});
