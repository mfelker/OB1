// The environment for every child process the TDD adapter starts (data-model ChildEnv; research R10).

export const CREDENTIAL_VARS = ['OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ACCESS_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN'];
const CREDENTIAL_SUFFIX = /(_API_KEY|_TOKEN|_SECRET|_SERVICE_ROLE_KEY)$/;

/**
 * A copy of `baseEnv` with NODE_TEST_CONTEXT removed and credential variables set to "".
 * Blanking (not deleting) matters: the recipes' loadEnv checks `key in env`, so "" beats .env.local.
 */
export function childEnv(baseEnv = process.env) {
  const { NODE_TEST_CONTEXT: _nested, ...env } = baseEnv;
  for (const name of Object.keys(env)) if (CREDENTIAL_SUFFIX.test(name)) env[name] = '';
  for (const name of CREDENTIAL_VARS) env[name] = '';
  return env;
}
