import { test } from 'node:test';
import assert from 'node:assert/strict';
import { childEnv } from '../lib/tdd-env.mjs';

const NAMED = ['OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ACCESS_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN'];

test('U21 childEnv: NODE_TEST_CONTEXT removed; credential vars set to ""; others kept', () => {
  const base = {
    PATH: '/usr/bin:/bin',
    HOME: '/home/someone',
    NODE_TEST_CONTEXT: 'child-v8',
    OPENAI_API_KEY: 'fake-openai-value',
    GH_TOKEN: 'fake-gh-value',
    MY_SERVICE_API_KEY: 'fake-1',
    DEPLOY_TOKEN: 'fake-2',
    WEBHOOK_SECRET: 'fake-3',
    OTHER_SERVICE_ROLE_KEY: 'fake-4',
    TOKENIZER_MODEL: 'kept',
    SECRET_SAUCE_DIR: 'kept',
    API_KEY_FILE: 'kept',
  };
  const env = childEnv(base);
  assert.ok(!('NODE_TEST_CONTEXT' in env));
  // The named list is blanked even when absent, so `key in env` beats .env.local in the recipes' loadEnv.
  for (const name of NAMED) assert.equal(env[name], '', name);
  for (const name of ['MY_SERVICE_API_KEY', 'DEPLOY_TOKEN', 'WEBHOOK_SECRET', 'OTHER_SERVICE_ROLE_KEY']) assert.equal(env[name], '', name);
  assert.equal(env.PATH, '/usr/bin:/bin');
  assert.equal(env.HOME, '/home/someone');
  assert.equal(env.TOKENIZER_MODEL, 'kept');
  assert.equal(env.SECRET_SAUCE_DIR, 'kept');
  assert.equal(env.API_KEY_FILE, 'kept');
  assert.equal(base.NODE_TEST_CONTEXT, 'child-v8', 'the base env is not mutated');
  assert.equal(base.OPENAI_API_KEY, 'fake-openai-value');
});
