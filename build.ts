#!/usr/bin/env bun
import plugin from "bun-plugin-tailwind";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import path from "path";
import { cp } from "node:fs/promises";
import { Readable } from "node:stream";
import { SitemapStream, streamToPromise } from "sitemap";
import { version } from "./package.json";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
	console.log(`
🏗️  Bun Build Script

Usage: bun run build.ts [options]

Common Options:
  --outdir <path>          Output directory (default: "dist")
  --dev                    Development mode only generate HTML files and exit
  --minify                 Enable minification (or --minify.whitespace, --minify.syntax, etc)
  --sourcemap <type>      Sourcemap type: none|linked|inline|external
  --target <target>        Build target: browser|bun|node
  --format <format>        Output format: esm|cjs|iife
  --splitting              Enable code splitting
  --packages <type>        Package handling: bundle|external
  --public-path <path>     Public path for assets
  --env <mode>             Environment handling: inline|disable|prefix*
  --conditions <list>      Package.json export conditions (comma separated)
  --external <list>        External packages (comma separated)
  --banner <text>          Add banner text to output
  --footer <text>          Add footer text to output
  --define <obj>           Define global constants (e.g. --define.VERSION=1.0.0)
  --help, -h               Show this help message

Example:
  bun run build.ts --outdir=dist --minify --sourcemap=linked --external=react,react-dom
  bun run build.ts --dev   (Development mode - generate HTML only)
`);
	process.exit(0);
}

const toCamelCase = (str: string): string => str.replace(/-([a-z])/g, (g) => g[1]?.toUpperCase() || "");

const parseValue = (value: string): any => {
	if (value === "true") return true;
	if (value === "false") return false;

	if (/^\d+$/.test(value)) return parseInt(value, 10);
	if (/^\d*\.\d+$/.test(value)) return parseFloat(value);

	if (value.includes(",")) return value.split(",").map((v) => v.trim());

	return value;
};

function parseArgs(): Record<string, any> {
	const config: Record<string, any> = {};
	const args = process.argv.slice(2);

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === undefined) continue;
		if (!arg.startsWith("--")) continue;

		if (arg.startsWith("--no-")) {
			const key = toCamelCase(arg.slice(5));
			config[key] = false;
			continue;
		}

		if (!arg.includes("=") && (i === args.length - 1 || args[i + 1]?.startsWith("--"))) {
			const key = toCamelCase(arg.slice(2));
			config[key] = true;
			continue;
		}

		let key: string;
		let value: string;

		if (arg.includes("=")) {
			[key, value] = arg.slice(2).split("=", 2) as [string, string];
		} else {
			key = arg.slice(2);
			value = args[++i] ?? "";
		}

		key = toCamelCase(key);

		if (key.includes(".")) {
			const [parentKey, childKey] = key.split(".", 2);
			if (parentKey && childKey) {
				config[parentKey] = config[parentKey] || {};
				config[parentKey][childKey] = parseValue(value);
			}
		} else {
			config[key] = parseValue(value);
		}
	}

	return config;
}

const formatFileSize = (bytes: number): string => {
	const units = ["B", "KB", "MB", "GB"];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(2)} ${units[unitIndex]}`;
};

interface SitemapUrl {
	description?: string;
	frequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
	lastModified?: string;
	priority?: number;
	url: string;
}

const generateSitemap = async (outputDir: string) => {
	try {
		const { BASE_URL, ROUTE_METADATA, ROUTES } = await import("./src/config/routes");
		console.log("");
		console.log("🗺️  Generating sitemap...");
		console.log(`📍  Base URL: ${BASE_URL}`);

		const urls: SitemapUrl[] = Object.values(ROUTES).map((route) => {
			const metadata = ROUTE_METADATA[route];
			return {
				url: route,
				frequency: metadata.frequency,
				priority: metadata.priority,
				lastModified: new Date().toISOString(),
				description: metadata.title,
			};
		});

		const stream = new SitemapStream({ hostname: BASE_URL });
		const sitemapUrls = urls.map((url) => ({
			url: url.url,
			changefreq: url.frequency,
			priority: url.priority,
			lastmod: url.lastModified,
		}));

		const xmlString = await streamToPromise(Readable.from(sitemapUrls).pipe(stream)).then((data) => data.toString());
		const sitemapPath = path.join(outputDir, "sitemap.xml");
		await Bun.write(sitemapPath, xmlString);

		console.log("     📝  URLs included in sitemap:");
		for (const url of urls) {
			console.log(`         ${url.url} - ${url.description || "No description"} (Priority: ${url.priority})`);
		}
		console.log("     ✅  Sitemap generated successfully at sitemap.xml");
	} catch (error) {
		console.warn("⚠️  Could not generate sitemap using routes config, falling back to basic sitemap");
	}
};

const generatePageHTML = (
	pageName: string = "index",
	route: string = "/",
	metadata?: { title: string; description: string },
	clientScriptPath?: string,
	isDev: boolean = false,
): string => {
	const title = metadata?.title || `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} - CMRU Bus`;
	const description = metadata?.description || `${pageName} page for CMRU Bus Reservation System`;
	const baseUrl = isDev ? "http://localhost:3000" : "https://cmru-bus.vercel.app";
	const fullUrl = `${baseUrl}${route}`;
	const relativePath = "./";
	const isIndexPage = pageName === "index" || route === "/";
	const additionalMetaTags =
		isIndexPage && !isDev && Bun.env.GOOGLE_VERIFICATION_TOKEN
			? `
		<meta name="google-site-verification" content="${Bun.env.GOOGLE_VERIFICATION_TOKEN ?? ""}" />`
			: "";

	return `<!DOCTYPE html>
<html lang="th">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="icon" type="image/svg+xml" href="${relativePath}logo.svg" />
		<title>${title}</title>
		<meta name="description" content="${description}" />
		<meta name="keywords" content="CMRU, มหาวิทยาลัยราชภัฏเชียงใหม่, จองรถ, รถรับส่ง, รถบัส, Chiang Mai Rajabhat University, Bus Reservation" />
		<meta name="author" content="CMRU Computer Science 66" />
		<meta name="robots" content="index, follow" />
		<meta name="language" content="Thai" />${additionalMetaTags}
		<meta property="og:type" content="website" />
		<meta property="og:url" content="${fullUrl}" />
		<meta property="og:title" content="${title}" />
		<meta property="og:description" content="${description}" />
		<meta property="og:site_name" content="CMRU Bus Reservation" />
		<meta property="og:locale" content="th_TH" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:url" content="${fullUrl}" />
		<meta name="twitter:title" content="${title}" />
		<meta name="twitter:description" content="${description}" />
		<meta name="mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="default" />
		<meta name="apple-mobile-web-app-title" content="CMRU Bus" />
		<meta name="format-detection" content="telephone=no" />
		<meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)" />
		<meta name="theme-color" content="#1e40af" media="(prefers-color-scheme: dark)" />

		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="dns-prefetch" href="https://cmru-bus.vercel.app" />
		<link rel="preload" href="${relativePath}fonts/LINE_Seed_Sans_TH/Web/WOFF2/LINESeedSansTH_W_Rg.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
		<link rel="preload" href="${relativePath}fonts/LINE_Seed_Sans_TH/Web/WOFF2/LINESeedSansTH_W_Bd.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
		<style>
			@font-face {
				font-family: "LINE Seed Sans TH";
				src: url("${relativePath}fonts/LINE_Seed_Sans_TH/Web/WOFF2/LINESeedSansTH_W_Rg.woff2") format("woff2");
				font-weight: 300 500;
				font-style: normal;
				font-display: swap;
			}
			@font-face {
				font-family: "LINE Seed Sans TH";
				src: url("${relativePath}fonts/LINE_Seed_Sans_TH/Web/WOFF2/LINESeedSansTH_W_Bd.woff2") format("woff2");
				font-weight: 600 700;
				font-style: normal;
				font-display: swap;
			}
			body { font-family: "LINE Seed Sans TH", sans-serif !important; }
		</style>
		${clientScriptPath ? `<link rel="preload" href="${relativePath}${clientScriptPath}" as="script" crossorigin="anonymous" />` : ""}

		<script>
			if (typeof global === "undefined") {
				globalThis.global = globalThis;
			}

			(function () {
				try {
					const savedTheme = localStorage.getItem("theme");
					const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
					const shouldBeDark = savedTheme === "dark" || (!savedTheme && media?.matches);

					document.documentElement.classList.toggle("dark", shouldBeDark);
					document.documentElement.style.setProperty("--theme-transition", "none");
					requestAnimationFrame(() => {
						document.documentElement.style.removeProperty("--theme-transition");
					});

					media?.addEventListener("change", (event) => {
						const currentTheme = localStorage.getItem("theme");
						if (!currentTheme || currentTheme === "system") {
							document.documentElement.classList.toggle("dark", event.matches);
						}
					});
				} catch {}
			})();
		</script>

		<style>
			html {
				visibility: hidden;
				opacity: 0;
			}
			html.js-loaded {
				visibility: visible;
				opacity: 1;
				transition: opacity 0.1s;
			}

			.loading-skeleton {
				background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
				background-size: 200% 100%;
				animation: loading 1.5s infinite;
			}
			@keyframes loading {
				0% {
					background-position: 200% 0;
				}
				100% {
					background-position: -200% 0;
				}
			}

			.dark .loading-skeleton {
				background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
			}
		</style>

		${clientScriptPath ? `<script type="module" src="${relativePath}${clientScriptPath}" async></script>` : isDev ? `<script type="module" src="${relativePath}client.tsx" async></script>` : ""}
		<script>
			document.documentElement.classList.add("js-loaded");
		</script>
	</head>
	<body>
		<div id="root"></div>
	</body>
</html>
`;
};

const createPageHTMLFiles = async (isDev: boolean = false) => {
	const routesConfigPath = path.join("src", "config", "routes.ts");

	let defaultRoutes: Array<{
		route: string;
		pageName: string;
		title: string;
		description: string;
	}> = [];

	if (existsSync(routesConfigPath)) {
		try {
			const { ROUTES, ROUTE_METADATA } = await import("./src/config/routes");

			console.log("📖  Found route metadata configuration");

			defaultRoutes = Object.values(ROUTES)
				.filter((route) => route !== "/")
				.map((route) => {
					const metadata = ROUTE_METADATA[route];
					const pageName = `${route.slice(1)}-page`;

					return {
						route,
						pageName,
						title: metadata.title,
						description: metadata.description,
					};
				});

			console.log(`     🗺️  Auto-generated ${defaultRoutes.length} routes from configuration:`);
			defaultRoutes.forEach(({ route, pageName }) => {
				console.log(`         ${pageName}.html → ${route}`);
			});
		} catch (error) {
			console.warn("⚠️  Could not load routes configuration, using fallback defaults");
		}
	}

	console.log("");
	const pagesDir = path.join("src", "pages");
	if (existsSync(pagesDir)) {
		const existingPageFiles = [...new Bun.Glob("**/*-page.{tsx,ts,jsx,js}").scanSync(pagesDir)]
			.filter((file) => !file.includes("components/") && !file.endsWith(".d.ts"))
			.map((file) => path.basename(file, path.extname(file)));

		console.log(`📄  Found ${existingPageFiles.length} page components: ${existingPageFiles.join(", ")}`);
	}

	for (const { route, pageName, title, description } of defaultRoutes) {
		const htmlFileName = `${pageName}.html`;
		const htmlPath = path.join("src", htmlFileName);

		if (!existsSync(htmlPath)) {
			const htmlContent = generatePageHTML(pageName, route, { title, description }, undefined, isDev);

			await Bun.write(htmlPath, htmlContent);
			console.log(`     📝  Created HTML template: ${htmlFileName} → ${route}`);
		} else {
			const htmlContent = generatePageHTML(pageName, route, { title, description }, undefined, isDev);
			await Bun.write(htmlPath, htmlContent);
			console.log(`     🔄  Updated HTML template: ${htmlFileName} → ${route}`);
		}
	}

	return defaultRoutes;
};

const cleanupGeneratedHTMLFiles = async (routesData: Array<{ pageName: string }>) => {
	console.log("\n🧹  Cleaning up generated HTML files...");

	for (const { pageName } of routesData) {
		const htmlFileName = `${pageName}.html`;
		const htmlPath = path.join("src", htmlFileName);

		if (existsSync(htmlPath)) {
			await rm(htmlPath);
			console.log(`     ✅  Deleted: ${htmlFileName}`);
		}
	}

	console.log("     🗑️  Generated HTML files cleaned up successfully");
};

console.log("\n🚀 Starting build process...\n");

const cliConfig = parseArgs();
const isDev = cliConfig.dev || false;
const outdir = cliConfig.outdir || path.join(process.cwd(), isDev ? "dev-dist" : "dist");
const indexMetadata = {
	title: "CMRU Bus - มหาวิทยาลัยราชภัฏเชียงใหม่",
	description: "CMRU Bus - ระบบจองรถรับส่ง มหาวิทยาลัยราชภัฏเชียงใหม่ จองรถรับส่งนักศึกษาและบุคลากรได้อย่างสะดวกรวดเร็ว พร้อมตรวจสอบตารางเดินรถและประวัติการจอง",
};

if (isDev) {
	console.log("🧪 Development mode");
	const indexPath = path.join("src", "index.html");
	await Bun.write(indexPath, generatePageHTML("index", "/", indexMetadata, undefined, isDev));

	console.log("     ✅  Generated index.html for development");
	console.log("     📄  index.html ready for development server");
	console.log("");
	process.exit(0);
}

const generatedRoutes = await createPageHTMLFiles(isDev);

console.log("📝  Generating index.html...");
const indexPath = path.join("src", "index.html");

if (!existsSync(indexPath)) {
	await Bun.write(indexPath, generatePageHTML("index", "/", indexMetadata, undefined, isDev));
	console.log("     ✅  Generated index.html");
} else {
	await Bun.write(indexPath, generatePageHTML("index", "/", indexMetadata, undefined, isDev));
	console.log("     �  Updated index.html");
}

if (existsSync(outdir)) {
	console.log("");
	console.log(`🗑️  Cleaning previous build at ${outdir}`);
	try {
		await rm(outdir, { recursive: true, force: true });
	} catch (error) {
		console.warn(`⚠️  Could not remove ${outdir}, proceeding anyway...`);
	}
}

const start = performance.now();

const htmlFiles = [...new Bun.Glob("**/*.html").scanSync("src")];
const entrypoints = htmlFiles.map((file) => path.resolve("src", file)).filter((dir) => !dir.includes("node_modules"));
const clientEntry = path.resolve("src", "client.tsx");
const jsEntrypoints = existsSync(clientEntry) ? [clientEntry] : [];
const allEntrypoints = [...entrypoints, ...jsEntrypoints];

console.log(`📄  Found ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"} to process`);
if (jsEntrypoints.length > 0) {
	console.log(`📄  Found ${jsEntrypoints.length} client entry ${jsEntrypoints.length === 1 ? "file" : "files"} to process`);
}
console.log(`📦  Total entry points: ${allEntrypoints.length}\n`);

const isProduction = process.env.NODE_ENV === "production" || !isDev;

const result = await Bun.build({
	entrypoints: allEntrypoints,
	outdir,
	plugins: [plugin],
	minify: isProduction
		? {
				whitespace: true,
				identifiers: true,
				syntax: true,
			}
		: false,
	target: "browser",
	sourcemap: isProduction ? cliConfig.sourcemap || "none" : "linked",
	splitting: true,
	env: "inline",
	define: {
		"process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
		"process.env.APP_VERSION": version,
	},
	naming: {
		entry: "[dir]/[name].[ext]",
		chunk: "chunks/[name]-[hash].[ext]",
		asset: "assets/[name]-[hash].[ext]",
	},
	loader: {
		".woff": "file",
		".woff2": "file",
		".eot": "file",
		".ttf": "file",
		".svg": "file",
		".png": "file",
		".jpg": "file",
		".jpeg": "file",
		".webp": "file",
		".avif": "file",
	},
	...cliConfig,
});

const end = performance.now();

const outputTable = result.outputs.map((output) => ({
	File: path.relative(process.cwd(), output.path),
	Type: output.kind,
	Size: formatFileSize(output.size),
}));

const clientScriptOutput = result.outputs.find((output) => output.path.includes("client") && output.kind === "entry-point" && output.path.endsWith(".js"));
const clientScriptPath = clientScriptOutput ? path.relative(outdir, clientScriptOutput.path) : undefined;

const clientCssOutput = result.outputs.find((output) => output.path.includes("client") && output.kind === "asset" && output.path.endsWith(".css"));
const clientCssPath = clientCssOutput ? path.relative(outdir, clientCssOutput.path) : undefined;

console.table(outputTable);
const buildTime = (end - start).toFixed(2);

if (clientScriptPath || clientCssPath) {
	console.log(`📝  Updating HTML files with client assets:`);
	if (clientScriptPath) console.log(`     🟦  Script: ${clientScriptPath}`);
	if (clientCssPath) console.log(`     🎨  CSS: ${clientCssPath}`);

	const indexHtmlPath = path.join(outdir, "index.html");
	if (existsSync(indexHtmlPath)) {
		let indexContent = await Bun.file(indexHtmlPath).text();

		if (clientCssPath) {
			const cssLinkTag = `<link rel="stylesheet" href="./${clientCssPath}">`;
			indexContent = indexContent.replace(/(<link rel="preconnect"[^>]*>\s*)/, `${cssLinkTag}\n\t\t$1`);
		}

		if (clientScriptPath) {
			const preloadTag = `<link rel="preload" href="./${clientScriptPath}" as="script" crossorigin="anonymous" />`;
			indexContent = indexContent.replace(/(<link rel="preload" href="\.\/fonts\/.*?" \/>\s*)/, `$1\t\t${preloadTag}\n\t\t`);

			const modulePreloadScript = `
			const preloadScript = document.createElement("link");
			preloadScript.rel = "modulepreload";
			preloadScript.href = "./${clientScriptPath}";
			document.head.appendChild(preloadScript);`;
			indexContent = indexContent.replace(/(}\)\(\);\s*)/, `$1${modulePreloadScript}\n\t\t`);

			const scriptTag = `<script type="module" src="./${clientScriptPath}" async></script>`;
			indexContent = indexContent.replace(/(<script>\s*document\.documentElement\.classList\.add\("js-loaded"\);\s*<\/script>)/, `${scriptTag}\n\t\t$1`);
		}

		await Bun.write(indexHtmlPath, indexContent);
		console.log("     🔄  Updated index.html with correct client assets");
	}
}

console.log("📁  Copying static assets and setting up routing...");
const staticPaths = [
	{ src: "src/fonts", dest: path.join(outdir, "fonts") },
	{ src: "src/logo.svg", dest: path.join(outdir, "logo.svg") },
	{ src: "public", dest: outdir },
];

for (const { src, dest } of staticPaths) {
	if (existsSync(src)) {
		if (src === "public") {
			const publicContents = await import("fs").then((fs) => fs.promises.readdir(src));
			for (const item of publicContents) {
				const srcPath = path.join(src, item);
				const destPath = path.join(dest, item);
				await cp(srcPath, destPath, { recursive: true });
				console.log(`     ✅  ${path.relative(process.cwd(), srcPath)} → ${path.relative(process.cwd(), destPath)}`);
			}
		} else {
			await cp(src, dest, { recursive: true });
			console.log(`     ✅  ${path.relative(process.cwd(), src)} → ${path.relative(process.cwd(), dest)}`);
		}
	}
}

console.log("");
console.log("🔗  Setting up page routing structure...");
const builtHTMLFiles = result.outputs.filter((output) => output.path.endsWith(".html")).map((output) => output.path);

for (const htmlFile of builtHTMLFiles) {
	const fileName = path.basename(htmlFile, ".html");

	if (fileName === "index") continue;

	const cleanUrlName = fileName.replace(/-page$/, "");

	const pageDir = path.join(outdir, cleanUrlName);
	if (!existsSync(pageDir)) {
		await import("fs").then((fs) => fs.promises.mkdir(pageDir, { recursive: true }));
	}

	const newPath = path.join(pageDir, "index.html");
	await cp(htmlFile, newPath);

	const htmlContent = await Bun.file(newPath).text();
	let fixedContent = htmlContent
		.replace(/href="\.\/chunks\//g, 'href="../chunks/')
		.replace(/src="\.\/chunks\//g, 'src="../chunks/')
		.replace(/href="\.\/assets\//g, 'href="../assets/')
		.replace(/src="\.\/assets\//g, 'src="../assets/')
		.replace(/href="\.\/client\./g, 'href="../client.')
		.replace(/src="\.\/client\./g, 'src="../client.')
		.replace(/href="\.\/logo\.svg"/g, 'href="../logo.svg"')
		.replace(/href="\.\/fonts\//g, 'href="../fonts/');

	if (clientScriptPath || clientCssPath) {
		if (clientCssPath) {
			const cssLinkTag = `<link rel="stylesheet" href="../${clientCssPath}">`;
			fixedContent = fixedContent.replace(/(<link rel="preconnect"[^>]*>\s*)/, `${cssLinkTag}\n\t\t$1`);
		}

		if (clientScriptPath) {
			const preloadTag = `<link rel="preload" href="../${clientScriptPath}" as="script" crossorigin="anonymous" />`;
			fixedContent = fixedContent.replace(/(<link rel="preload" href="\.\.\/fonts\/.*?" \/>\s*)/, `$1\t\t${preloadTag}\n\t\t`);

			const modulePreloadScript = `
			const preloadScript = document.createElement("link");
			preloadScript.rel = "modulepreload";
			preloadScript.href = "../${clientScriptPath}";
			document.head.appendChild(preloadScript);`;
			fixedContent = fixedContent.replace(/(}\)\(\);\s*)/, `$1${modulePreloadScript}\n\t\t`);

			const scriptTag = `<script type="module" src="../${clientScriptPath}" async></script>`;
			fixedContent = fixedContent.replace(/(<script>\s*document\.documentElement\.classList\.add\("js-loaded"\);\s*<\/script>)/, `${scriptTag}\n\t\t$1`);

			fixedContent = fixedContent.replace(/client\.tsx/g, `../${clientScriptPath}`).replace(/href="\.\.\/client\./g, `href="../${clientScriptPath.replace(".js", ".")}`);
		}
	}

	await Bun.write(newPath, fixedContent);
	await rm(htmlFile);

	console.log(`     🔗  ${fileName}.html → ${cleanUrlName}/index.html (clean URL: /${cleanUrlName}/)`);
}

const redirectsContent = `
/*    /index.html   200
/booking-page  /booking/   301
/login-page    /login/     301
/schedule-page /schedule/  301
/settings-page /settings/  301
`;

await Bun.write(path.join(outdir, "_redirects"), redirectsContent);
console.log("     ✅  Generated _redirects file for hosting platforms");

await generateSitemap(outdir);
await cleanupGeneratedHTMLFiles(generatedRoutes);

console.log("🧹  Cleaning up generated index.html...");
const generatedIndexPath = path.join("src", "index.html");
if (existsSync(generatedIndexPath)) {
	await rm(generatedIndexPath);
	console.log("     ✅  Deleted generated index.html");
}

console.log(`\n✅ Build completed in ${buildTime}ms\n`);
