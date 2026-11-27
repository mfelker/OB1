// Stub: throws until its stream replaces it (tasks.md "Seams").
import type { Hono } from "npm:hono@4.9.2";
import type { Deps, Services } from "./types.ts";

/** The page's routes (contracts/upload-page.md), as a Hono sub-app. */
export function pageRoutes(deps: Deps, services: Services): Hono {
  throw new Error("not implemented");
}
