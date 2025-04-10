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

		// Check if this is a repository path
		const pathParts = path.split('/').filter(Boolean);

		if (pathParts.length === 1) {
			const repo = pathParts[0];

			// Check if this is one of our special repositories
			if (['goget', 'web', 'vikunja'].includes(repo)) {
				return showGoGetMeta(path);
			}
		}

		if (path === '/desktop' || path === '/desktop/') {
			return redirectToBase('/vikunja/tree/main/desktop');
		}

		if (path === '/frontend' || path === '/frontend/') {
			return redirectToBase('/vikunja/tree/main/frontend');
		}

		// Default: redirect to base URL
		return redirectToBase(path);
	},
} satisfies ExportedHandler;
