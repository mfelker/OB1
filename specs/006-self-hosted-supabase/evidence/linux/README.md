# T038: Linux live acceptance run (SC-010, Linux half), 2026-11-27 UTC

**When and where**
- The machine was a throwaway Proxmox VE 9.2.10 LXC container, CT 135 `ob1-006-linux`:
  - unprivileged, with `features: nesting=1`;
  - Debian 13 (trixie), kernel 6.17.4-2-pve;
  - 4 vCPU and 4 GB RAM.
- The owner chose an LXC with nesting over a VM, knowingly against their lab baseline, and the reason is recorded in the CT's notes. Docker ran with `nesting=1` alone; `keyctl` was not needed.
- Docker Engine 29.10.1 and **Compose v5.8.0 (R2)**, both from Docker's Debian repository. `/bin/sh` is **dash**.
- The code was a shallow clone of `mfelker/OB1` at branch `contrib/mfelker/self-hosted-supabase` `0c357be`, following quickstart.md V1–V12.
- No key value appears in any file here. Every file was scanned against all 36 values of 12 or more characters in the run's `.env`. Only the non-secret settings `COMPOSE_FILE`, `EMBEDDING_API_BASE` and `EMBEDDING_MODEL` matched.

**Model server**
- The Linux host had no model server of its own. It used the owner's Mac Ollama 0.40.18, with the same pair as the Mac run (`qwen3-embedding:4b` and `llama3.1:8b`).
- An SSH reverse tunnel carried it into the CT, listening on the Docker bridge address `172.17.0.1:11434`. The containers reached it as `host.docker.internal`.
- That is a host process listening on the host, which is the case `host-gateway` exists for. So **R12 is answered yes**:
  - a probe container got `200` from `http://host.docker.internal:11434/api/tags` (`02-start.txt`);
  - the stack's own `functions` container passed every model check (V3).
- Claude Code (V4) ran on the Mac and reached the CT's gateway through the same SSH session (Mac `127.0.0.1:18000` → CT `localhost:8000`).

| Step | Criterion | Result | File |
|------|-----------|--------|------|
| V1 | Story 1 setup, FR-002, FR-019 | Under **dash**: `clone`, `secrets` and `model-settings` completed, `function-link` present, exit 0. Checkout `git status` clean. | `01-setup.txt` |
| V2 | US1.1, FR-004, SC-006, FR-006 | Exactly `db rest api-gw functions storage` healthy. `ob1-init` exited 0 (`bucket ob1-files is ready`). The schema init ran. The R12 probe returned 200. | `02-start.txt` |
| V3 | US1.2, SC-003 | Setup check `ok: true`, all 7 checks pass, HTTP 200. | `03-setup-check.txt` |
| V4 | US1.3, SC-003, SC-001 | Claude Code `claude mcp add` → **✔ Connected**, 6 tools. The capture is stored at 1536 dimensions with `embedding_model` `qwen3-embedding:4b`. The reworded search returns it as result 1 (76.6%). | `04-mcp-round-trip.txt` |
| V5 | Story 2, SC-005, FR-009 | 1.9 MB PDF and 4.7 MB photo: upload 200 and byte-identical download. A second upload without upsert is refused (409 in a 400); with `x-upsert: true` it returns 200. No credentials and the public URL both get 400. The bucket is private. | `05-storage.txt` |
| V6 | US1.4, US1.6, SC-007 | The re-run reports everything `already present`. The simulated interrupted run reports `model-settings: completed`, with 7 of 7 names back. The key-line hash is identical across all three runs, and the checkout stays clean. | `06-rerun-resume.txt` |
| V7 | Story 3, SC-006, OS-009 | UI add-on: Studio 401 without login and 200 with it, listing `thoughts` and `ob1-files`. It stops on its own, and the setup check stays ok. OS-009 matches the Mac and the README: starting only `studio meta` also starts `db`, not the gateway. | `07-ui-addon.txt` |
| V8 | US1.5, US2.3, SC-004 | `down` + `up`: thoughts and both files intact. Then a **full reboot of the machine** (`pct reboot 135`), which is stronger than the Mac's Docker Desktop restart. The five services came back by themselves, with no manual Docker command. One thought row, setup check ok, the reworded search finds it (76.6%), and both files are byte-identical. | `08-persistence.txt` |
| V9 | SC-009, FR-021 | A second throwaway function (a scratch override outside the repo) answered `{"hello":"ob1"}` next to 004's, and 004's setup check stayed ok. After removal: `hello-ob1` 503, 004 ok, checkout clean. | `09-second-function.txt` |
| V10 | SC-011 | Not run: Docker Model Runner was dropped (FR-017 and SC-011 amended after the Mac run). | none |
| V11 | SC-008 | OB1 gate review checks with the upstream title, run on this host with bash: **15 of 15 pass**. The first attempt failed "Metadata valid" only because `jq` wasn't installed; the script reads a missing `jq` as invalid JSON. That is host tooling, recorded in the file. | `11-gate.txt` |
| V12 | FR-020 | `pg_dump` via `docker compose exec`: exit 0. The dump (290 KB) has `CREATE TABLE public.thoughts` and the stored row. | `12-dump.txt` |

**SC-001 timing**
- From the start of V1 to the V4 round trip took 855 s.
- About 9 minutes of that was `setup.sh`'s shallow clone of the Supabase repository. It came from GitHub at about 1 MB/s, while the same link fetched a CDN file at 16 MB/s.
- The whole first `docker compose up -d` took 91 s, from 01:31:51Z to 01:33:22Z (`02-start.txt`). That includes pulling the images (4.65 GB stored) and the database's first boot. Pull time and start time weren't recorded separately.

**Not covered here**
- Docker Model Runner (V10, dropped).
- A Linux host running its own model server. The model server was remote, through the tunnel; the stack's side of `host.docker.internal` is the same either way.
- A VM or bare-metal Linux. This was an unprivileged LXC with nesting.

**Teardown**
- `docker compose --profile ui --profile images down -v` in the CT.
- Then CT 135 was destroyed along with its firewall file and disk.
- The Claude Code connector `ob1-006-linux` was removed, the SSH tunnel stopped, and the throwaway SSH key deleted.
