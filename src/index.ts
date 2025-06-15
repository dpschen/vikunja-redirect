/**
 * Cloudflare Worker — Go vanity-import redirector
 *
 *  • Honour ?go-get=1 for known repos and serve go-import / go-source meta tags
 *  • Permanent 308 redirects for all other paths
 *  • Edge-caches meta pages for 1 h
 *  • Env-driven configuration for easy promotion (BASE_URL, DOMAIN)
 *  • Security headers on every response
 *  • O(1) routing with Set / Map
 *  • Structured JSON logging
 */

/* ---------------------------------------------------------------- *\
 *                         Bindings / Env                            *
\* ---------------------------------------------------------------- */

export interface Env {
    /** e.g. "https://github.com/go-vikunja" */
    BASE_URL: string;
    /** e.g. "code.vikunja.io"            */
    DOMAIN: string;
}

/* ---------------------------------------------------------------- *\
 *                         Constants                                 *
\* ---------------------------------------------------------------- */

const META_REPOS = new Set(['goget', 'web', 'vikunja'] as const);

/** vanity-import sub-directory routing rules → GitHub prefix */
const DIR_ROUTES = new Map([
    ['desktop',  '/vikunja/tree/main/desktop'],
    ['frontend', '/vikunja/tree/main/frontend'],
] as const);

const META_TTL_SECONDS = 3_600; // 1 h

/* ---------------------------------------------------------------- *\
 *                         Helpers                                   *
\* ---------------------------------------------------------------- */

/** Merge default security headers with extras for a given response */
function withHeaders(
    resp: Response,
    extra: Record<string, string> = {},
): Response {
    const security: Record<string, string> = {
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY',
    };
    const headers = new Headers(resp.headers);
    for (const [k, v] of Object.entries({ ...security, ...extra })) headers.set(k, v);
    return new Response(resp.body, {
        status: resp.status,
        statusText: resp.statusText,
        headers,
    });
}

/** Build go-import / go-source meta-tag HTML page */
const buildMetaHTML = (env: Env, path: string) => `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="go-import" content="${env.DOMAIN}${path} git ${env.BASE_URL}${path}.git">
    <meta name="go-source" content="${env.DOMAIN}${path} _ ${env.BASE_URL}${path}/src/branch/main{/dir} ${env.BASE_URL}${path}/src/branch/main{/dir}/{file}#L{line}">
    <meta http-equiv="refresh" content="0; url=${env.BASE_URL}${path}">
    <title>Redirecting to ${env.BASE_URL}${path}</title>
</head>
<body>go get ${env.DOMAIN}${path}</body>
</html>`;

/** 308 (Permanent Redirect) helper */
const redirect = (location: string) =>
    Response.redirect(location, 308);

/* ---------------------------------------------------------------- *\
 *                           Worker                                  *
\* ---------------------------------------------------------------- */

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const { pathname, searchParams } = new URL(request.url);
        const parts = pathname.split('/').filter(Boolean);   // trim leading '/'
        const first = parts[0] ?? '';

        /* ---------------------------------------------- *
         * 1) Vanity-import meta page (go get ?go-get=1)   *
         * ---------------------------------------------- */
        if (searchParams.has('go-get') && parts.length === 1 && META_REPOS.has(first as never)) {
            const cacheKey  = new Request(request.url, request); // immutable key
            const cache     = caches.default;
            let   cachedRes = await cache.match(cacheKey);

            if (cachedRes) {
                cachedRes = withHeaders(cachedRes); // add / refresh security headers
                console.log(JSON.stringify({ event: 'cache_hit', path: pathname }));
                return cachedRes;
            }

            const html = buildMetaHTML(env, `/${first}`);
            const res  = withHeaders(
                new Response(html, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': `public, max-age=${META_TTL_SECONDS}, must-revalidate`,
                    },
                }),
            );

            // Fire-and-forget cache put
            ctx.waitUntil(cache.put(cacheKey, res.clone()));

            console.log(JSON.stringify({ event: 'meta_generate', repo: first }));
            return res;
        }

        /* ---------------------------------------------- *
         * 2) Directory routing (/desktop, /frontend, …)  *
         * ---------------------------------------------- */
        const routePrefix = DIR_ROUTES.get(first);
        if (routePrefix) {
            const sub = parts.slice(1).join('/');
            const target = `${env.BASE_URL}${routePrefix}${sub ? '/' + sub : ''}`;
            console.log(JSON.stringify({ event: 'dir_route', from: pathname, to: target }));
            return withHeaders(redirect(target));
        }

        /* ---------------------------------------------- *
         * 3) Fallback — permanent redirect to GitHub     *
         * ---------------------------------------------- */
        const target = `${env.BASE_URL}${pathname}`;
        console.log(JSON.stringify({ event: 'fallback', from: pathname, to: target }));
        return withHeaders(redirect(target));
    },
} satisfies ExportedHandler<Env>;
