/**
 * A baseline environment for `loadSettings`, with placeholder values only.
 * None of these is a real key or a reachable host.
 */
import type { GetEnv } from "../../src/types.ts";

export const BRAIN_KEY = "test-brain-key-placeholder";
export const SUPABASE_URL = "http://supabase.internal:8000";
export const SERVICE_ROLE_KEY = "test-service-role-key-placeholder";
export const PUBLIC_BASE_URL = "https://brain.example.test";
export const EMBEDDING_API_BASE = "http://embeddings.test/v1";
export const EMBEDDING_API_KEY = "test-embedding-key-placeholder";
export const EMBEDDING_MODEL = "openai/text-embedding-3-small";
export const VISION_API_BASE = "http://vision.test/v1";
export const VISION_API_KEY = "test-vision-key-placeholder";
export const VISION_MODEL = "test/vision-model";

/** Every placeholder secret value, for "no secret appears anywhere" assertions. */
export const SECRET_VALUES = [BRAIN_KEY, SERVICE_ROLE_KEY, EMBEDDING_API_KEY, VISION_API_KEY];

/** The baseline: required settings set, vision configured, every optional setting at its default. */
export function baseEnv(): Record<string, string> {
  return {
    MCP_ACCESS_KEY: BRAIN_KEY,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY,
    PUBLIC_BASE_URL,
    EMBEDDING_API_BASE,
    EMBEDDING_API_KEY,
    EMBEDDING_MODEL,
    VISION_API_BASE,
    VISION_API_KEY,
    VISION_MODEL,
  };
}

/** A `GetEnv` over the baseline. An override of `undefined` unsets that variable. */
export function envGetter(overrides: Record<string, string | undefined> = {}): GetEnv {
  const env: Record<string, string | undefined> = { ...baseEnv(), ...overrides };
  return (name) => env[name];
}
