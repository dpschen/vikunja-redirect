/**
 * Cloudflare Worker implementation of a Go package redirector
 * This worker serves HTML pages with go-import and go-source meta tags
 * for specific repositories, and redirects other requests to the base URL.
 */

const BaseUrl = `https://github.com/go-vikunja`;
const Domain = `code.vikunja.io`;
const GoGetTemplate = `<!doctype html>
<html>
	<head>
		<meta name="go-import" content="${Domain}{{path}} git ${BaseUrl}{{path}}.git">
		<meta name="go-source" content="${Domain}{{path}} _ ${BaseUrl}{{path}}/src/branch/main{/dir} ${BaseUrl}{{path}}/src/branch/main{/dir}/{file}#L{line}">
		<meta http-equiv="refresh" content="0; url=${BaseUrl}{{path}}" />
	</head>
	<body>
		go get ${Domain}{{path}}
	</body>
</html>
`;

function redirectToBase(url: string): Response {
	return Response.redirect(BaseUrl + url, 302);
}

function showGoGetMeta(path: string): Response {
	const html = GoGetTemplate.replace(/{{path}}/g, path);
	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
		},
	});
}

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		// Split the pathname by '/' and remove empty items (leading slash, etc.)
		const pathParts = path.split('/').filter(Boolean);

		// -------------------------------------------------------------------
		// 1) Handle single-segment paths that correspond to "go-get" repos.
		//
		//    That is, if someone does: `go get code.vikunja.io/vikunja`
		//    or `go get code.vikunja.io/goget`, we serve the meta tags
		//    so that "go get" knows which Git repo to use.
		// -------------------------------------------------------------------
		if (pathParts.length === 1) {
			const repo = pathParts[0];

			// Check if this is one of our special repositories
			if (['goget', 'web', 'vikunja'].includes(repo)) {
				return showGoGetMeta(`/${repo}`);
			}
		}

		// -------------------------------------------------------------------
		// 2) Handle /desktop and all its subpaths.
		//
		//    Examples:
		//    - /desktop          => https://github.com/go-vikunja/vikunja/tree/main/desktop
		//    - /desktop/main.js  => https://github.com/go-vikunja/vikunja/tree/main/desktop/main.js
		// -------------------------------------------------------------------
		if (pathParts[0] === 'desktop') {
			const subPath = pathParts.slice(1).join('/');
			// Prepend '/' if there is a sub path
			return redirectToBase(`/vikunja/tree/main/desktop${subPath ? `/${subPath}` : ''}`);
		}

		// -------------------------------------------------------------------
		// 3) Handle /frontend and all its subpaths.
		//
		//    Examples:
		//    - /frontend           => https://github.com/go-vikunja/vikunja/tree/main/frontend
		//    - /frontend/lang/i18n => https://github.com/go-vikunja/vikunja/tree/main/frontend/lang/i18n
		// -------------------------------------------------------------------
		if (pathParts[0] === 'frontend') {
			const subPath = pathParts.slice(1).join('/');
			return redirectToBase(`/vikunja/tree/main/frontend${subPath ? `/${subPath}` : ''}`);
		}

		// -------------------------------------------------------------------
		// 4) Default fallback:
		//    If nothing above applies, just redirect to the base URL
		//    with the entire path appended. This ensures that any other
		//    repos or subpaths which don't need special handling
		//    still redirect to the correct GitHub path.
		// -------------------------------------------------------------------
		return redirectToBase(path);
	},
} satisfies ExportedHandler;
