# T046 (Supabase Cloud half): live verification

**When and where.** Run 2026-11-26 from the owner's laptop on hotel Wi-Fi, using:

- a throwaway Supabase Cloud project, `ob1-selfhosted-llm-test` (`jwejhhssrpukkhcdmwhw`, us-east-2), with the `docs/01` schema at `vector(1536)` pasted into the SQL Editor;
- Supabase CLI 3.4.0, deploying with `--no-verify-jwt`;
- function code from `contrib/mfelker/self-hosted-llm` @ `e765921`, the same code as the self-hosted run;
- Ollama 0.40.18 on the laptop (`qwen3-embedding:4b`, `llama3.1:8b`).

The CLI asked for confirmation before each hosted change (`HostedMutationConsentRequiredError` in agent mode). The owner approved `--yes` for this throwaway project only.

| Criterion | Result | File |
|-----------|--------|------|
| SC-013, part 1: model server only on a private network (`EMBEDDING_API_BASE=http://10.0.20.58:11434/v1`) | 401 without the key. With the key: 503, every model check failed naming the base (a timeout after 60 s, because private-network packets are dropped) | `01-sc013-private-network.txt` |
| SC-013, part 2 / FR-019 worked example: Caddy enforcing `Authorization: Bearer <key>` on `127.0.0.1:8443`, published by Tailscale Funnel over HTTPS; secrets point at the Funnel URL with `EMBEDDING_API_KEY`, and chat inherits base and key (Q11) | 200, all 7 checks pass in 8 s, no `key_over_http` warning (HTTPS) | `02-sc013-https-key.txt` |
| SC-007, Cloud half: the same code as the self-hosted run, no change | Six tools via `?key=` and via the `x-brain-key` header; a wrong key gets `-32001`; two captures; exact search at 100.0%; paraphrase search finds the right thought; list and stats work | `03-sc007-cloud-round-trip.txt` |
| SC-009 on Cloud: 768-dimension model | 503 naming 768 and 1536; capture refused; no row added; the restored model passes again | `04-sc009-cloud.txt` |

## Incident during the run (no exposure), and what changed

The first Funnel test returned **HTTP 200 for a wrong key**. Funnel was turned off at once, then the cause was investigated:

- **Cause.** The Caddy site address was `http://127.0.0.1:8443`. The tunnel forwards its own public hostname in `Host`, so no site matched, and Caddy answers an unmatched host with an **empty 200**. Every response was 0 bytes, even with the right key, so nothing reached Ollama.
- **Fix.** The site was changed to `http://:8443` with `bind 127.0.0.1`. An earlier bind problem, where the first config listened on all interfaces, was also caught and fixed before Funnel was ever enabled.
- **Re-verification.** Before re-enabling Funnel, the path was re-tested through a tailnet-only `tailscale serve`: no key 401, wrong key 401, right key 200 with a 1536-number embedding. The same results held publicly before Cloud used it.
- **A false alarm in the tests.** One re-test loop wrongly reported 401 for the right key. zsh does not split `${H:+-H "$H"}` into two words, so the header was never sent. The checks were re-run with explicit `-H` flags.

The README gained:

- the tested tunnel variant (a catch-all site plus a loopback bind);
- a check that distinguishes the empty 200 from a real model list;
- the private-address timeout in Troubleshooting;
- "recreate, not restart" for the self-hosted stack (commit `73ee726`).

## Teardown (done)

- Funnel off; the owner's pre-existing tailnet-only `/household` serve is untouched.
- Caddy stopped; the public URL no longer answers.
- The Cloud function was deleted (its URL returns 404), and the five custom secrets were unset.
- The proxy key, access key and secrets files were deleted from disk.
- The owner deletes the throwaway project, and optionally turns the tailnet-wide Funnel permission back off.

**Not covered:** SC-001 (setup in 30 minutes from the README alone) was not timed. It needs a first-time reader, which an agent that wrote the README cannot be.
