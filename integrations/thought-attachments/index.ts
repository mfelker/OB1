import { createApp, productionDeps } from "./src/app.ts";

Deno.serve(createApp(productionDeps()).fetch);
