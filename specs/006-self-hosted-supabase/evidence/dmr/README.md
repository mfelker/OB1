# T035: Docker Model Runner probe (research R5), 2026-11-26

Owner-approved. Run on the owner's Mac (Apple M4 Max, Docker Desktop 4.96.2, `docker model` v1.2.6). No key values involved (DMR needs none).

| Step | Command (abridged) | Result |
|------|--------------------|--------|
| Enable | `docker desktop enable model-runner` | `Docker Model Runner is running` |
| Catalog | `docker model search embed` | Docker Hub `ai/` catalog: `403 Forbidden`; Hugging Face results listed (for example `hf.co/Qwen/Qwen3-Embedding-0.6B-GGUF`, which has native size 1024, too small for 1536) |
| Embedding model | `docker model pull hf.co/Qwen/Qwen3-Embedding-4B-GGUF:Q4_K_M` | pulled (`huggingface.co/qwen/qwen3-embedding-4b-gguf:Q4_K_M`, 2.32 GiB, native size 2560) |
| Embeddings with `dimensions: 1536` | `POST localhost:12434/engines/v1/embeddings` | **`len 2560`**, norm 1.0 (`dimensions` ignored) |
| Embeddings without `dimensions` | same, no `dimensions` | `len 2560`, norm 1.0 |
| Chat model | `docker model pull hf.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M` | pulled |
| Chat | `POST localhost:12434/engines/v1/chat/completions` ("Reply with the single word: ready") | `ready` |
| Backend | `docker model status` | `llama.cpp  Running  llama.cpp b9879-metal`, so the Metal GPU is in use |
| From a container | `docker run --rm curlimages/curl:8.11.1 … http://model-runner.docker.internal/engines/v1/models` | both models listed |
| Network exposure (OS-010) | `lsof -iTCP:12434 -sTCP:LISTEN` | `127.0.0.1:12434` only; **not reachable from the local network** |

**Conclusion.** Docker Model Runner can't serve spec 004's embedding role here: it returns the model's native 2560 numbers whatever `dimensions` asks for, and spec 004 refuses anything that isn't 1536, even after retrying without the field. Per FR-017's fallback, DMR is documented for the **chat role only** (`CHAT_API_BASE=http://model-runner.docker.internal/engines/v1`), with embeddings through the host route. SC-011's chat-on-GPU check is part of the Mac live run (T037).
