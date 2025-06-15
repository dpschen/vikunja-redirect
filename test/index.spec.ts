import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

env.BASE_URL = 'https://github.com/go-vikunja';
env.DOMAIN = 'code.vikunja.io';

describe('vikunja redirect worker', () => {
        it('serves meta tags for known repo', async () => {
                const request = new IncomingRequest('https://code.vikunja.io/goget?go-get=1');
                const ctx = createExecutionContext();
                const res = await worker.fetch(request, env, ctx);
                await waitOnExecutionContext(ctx);
                expect(res.status).toBe(200);
                expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
                const body = await res.text();
                expect(body).toContain('go-import');
        });

        it('redirects directory routes', async () => {
                const request = new IncomingRequest('https://code.vikunja.io/frontend');
                const ctx = createExecutionContext();
                const res = await worker.fetch(request, env, ctx);
                await waitOnExecutionContext(ctx);
                expect(res.status).toBe(308);
                expect(res.headers.get('Location')).toBe('https://github.com/go-vikunja/vikunja/tree/main/frontend');
        });

        it('redirects unknown paths', async () => {
                const request = new IncomingRequest('https://code.vikunja.io/unknown');
                const ctx = createExecutionContext();
                const res = await worker.fetch(request, env, ctx);
                await waitOnExecutionContext(ctx);
                expect(res.status).toBe(308);
                expect(res.headers.get('Location')).toBe('https://github.com/go-vikunja/unknown');
        });
});
