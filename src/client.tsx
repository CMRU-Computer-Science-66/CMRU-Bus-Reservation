import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";

const element = document.querySelector("#root")!;
const app = (
	<StrictMode>
		<App />
	</StrictMode>
);

if (import.meta.hot) {
	const root = (import.meta.hot.data.root ??= createRoot(element));
	root.render(app);
} else {
	createRoot(element).render(app);
}
