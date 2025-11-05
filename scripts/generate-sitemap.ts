import { writeFileSync } from "node:fs";
import { Readable } from "node:stream";

import { SitemapStream, streamToPromise } from "sitemap";

import { BASE_URL, ROUTE_METADATA, ROUTES } from "../src/config/routes";

interface SitemapUrl {
	description?: string;
	frequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
	lastModified?: string;
	priority?: number;
	url: string;
}

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

async function generateSitemap() {
	console.log("🗺️  Generating sitemap...");
	console.log(`📍 Base URL: ${BASE_URL}`);
	console.log("");

	const stream = new SitemapStream({ hostname: BASE_URL });
	const sitemapUrls = urls.map((url) => ({
		url: url.url,
		changefreq: url.frequency,
		priority: url.priority,
		lastmod: url.lastModified,
	}));

	const xmlString = await streamToPromise(Readable.from(sitemapUrls).pipe(stream)).then((data) => data.toString());

	writeFileSync("./dist/sitemap.xml", xmlString);

	console.log("✅ Sitemap generated successfully at dist/sitemap.xml");
	console.log("");
	console.log("📝 URLs included in sitemap:");
	for (const url of urls) {
		console.log(`   ${url.url} - ${url.description || "No description"} (Priority: ${url.priority})`);
	}
	console.log("");
	console.log(`� Total URLs: ${urls.length}`);
}

await generateSitemap();
