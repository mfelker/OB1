/**
 * The Supabase-backed Store (spec 007 seams): PostgREST and RPC calls for the database half, the Storage
 * API for the file half. supabase-js runs over the injected `fetch`, so tests never touch a network.
 * Stream Q owns this file and schema.sql together: tests/schema_drift_test.ts checks every RPC name and
 * parameter sent here against schema.sql.
 */
import { createClient } from "@supabase/supabase-js";
import type { R, Settings, Store } from "./types.ts";

const notYet = (): Promise<never> => Promise.reject(new Error("not implemented"));

export function createSupabaseStore(
  url: string,
  serviceRoleKey: string,
  settings: Settings,
  fetch: typeof globalThis.fetch,
): Store {
  const db = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch },
  });
  void settings;

  return {
    async thoughtExists(id) {
      const { data } = await db.from("thoughts").select("id").eq("id", id).limit(1);
      return { data: (data ?? []).length > 0 } as R<boolean>;
    },
    insertNote: notYet,
    matchThoughts: notYet,
    findThoughtsExact: notYet,
    embeddingDimension: notYet,
    createAttachment: notYet,
    getAttachment: notYet,
    findPending: notYet,
    findByHash: notYet,
    setDeclaration: notYet,
    listByParent: notYet,
    attachmentForDerived: notYet,
    orphans: notYet,
    attachmentForPageToken: notYet,
    consumePageToken: notYet,
    claim: notYet,
    release: notYet,
    writeDerived: notYet,
    setState: notYet,
    removalPreview: notYet,
    removeAttachment: notYet,
    signUpload: notYet,
    objectInfo: notYet,
    download: notYet,
    deleteObject: notYet,
    signDownload: notYet,
  };
}
