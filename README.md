# Go Package Redirector

A Cloudflare Worker that implements a Go package redirector for Vikunja repositories.

## What it does

This worker serves as a custom import path for Go packages, allowing users to use `go get code.vikunja.io/[repo]` to fetch Vikunja repositories from GitHub.

## How it works

When a Go client tries to fetch a package from `code.vikunja.io/[repo]`, this worker:
1. Checks if the repository is one of the supported repositories
2. If it is, returns an HTML page with meta tags that tell the Go client where to find the actual code
3. If not, redirects to the Vikunja GitHub organization

## Development

1. Install dependencies: `npm install`
2. Run locally: `npm run dev`
3. Deploy: `npm run deploy`

## License

See the [LICENSE](LICENSE) file for details.
