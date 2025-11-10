/* eslint-disable no-var */
import { serve } from "bun";

import index from "./index.html";

const server = serve({
	port: Bun.env.PORT ? Number.parseInt(Bun.env.PORT) : 6614,
	routes: {
		"/*": index,
	},
	development: Bun.env.NODE_ENV !== "production" && {
		hmr: true,
		console: true,
	},
});

declare global {
	var __LAST_LOG_TIME__: number | undefined;
}

const currentTime = Date.now();
const lastLogTime = global.__LAST_LOG_TIME__ || 0;

if (currentTime - lastLogTime > 30) {
	global.__LAST_LOG_TIME__ = currentTime;
	console.log("🔧 Environment Configuration:");
	console.log(`  🔌 PORT: ${Bun.env.PORT || 6614}`);
	console.log(`  🌐 API_URL: ${Bun.env.API_URL || "http://localhost:3000"}`);
	console.log(`  📦 APP_VERSION: ${Bun.env.APP_VERSION || "development"}`);
	console.log(`  🔐 ENCRYPTION_PIN: ${Bun.env.ENCRYPTION_PIN || "default"}`);
	console.log(`\n`);
	console.log(`🚀 Server running at ${server.url}\n`);
}
