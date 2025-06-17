# Go Package Redirector

A Cloudflare Worker providing vanity Go import paths under **code.vikunja.io**.

## What it does

`go get code.vikunja.io/vikunja` → Worker → GitHub

## How it works

1. `go get code.vikunja.io/<repo>?go-get=1` triggers an HTML page containing `<meta name="go-import">` and `<meta name="go-source">`.
2. Directory prefixes like `/frontend` redirect to specific sub-folders in GitHub.
3. Everything else 308‑redirects straight to GitHub.

Lookup tables use `Set`/`Map` for O(1) routing and permanent `308` redirects maximise cache hits. Enable Cloudflare **Tiered Cache (Smart)** for even less origin load.

## Development

```bash
pnpm install
pnpm test --watch
wrangler dev
```

Deploy with `wrangler deploy --env staging`.

See `docs/LOGGING.md` for streaming logs off-platform and `docs/BULK_REDIRECTS.md` for moving large tables to Bulk Redirects.

### Benchmark
Run `node --no-warnings bench/set_vs_array.ts` to see `Set.has()` outperform `Array.includes()` by roughly ten times.

### Adding a repo
1. Add the repo name to `META_REPOS` (for the root vanity path) **or**
2. Add a `[prefix, target]` entry to `DIR_ROUTES`.
3. `pnpm test && wrangler deploy --env staging`.

### Security headers
Responses include `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` and `X-Frame-Options`.

### License

See the [LICENSE](LICENSE) file for details.
