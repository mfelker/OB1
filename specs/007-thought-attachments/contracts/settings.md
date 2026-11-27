# Contract: settings

Environment variables for the Edge Function (constitution Principle II: secrets only from the environment). Defaults apply when a variable is unset.

| Setting | Default | Meaning | Requirements |
|---------|---------|---------|--------------|
| `MCP_ACCESS_KEY` | none (required) | The brain's existing access key | FR-018, R13 |
| `EMBEDDING_API_BASE` | `https://openrouter.ai/api/v1` | OpenAI-compatible embeddings endpoint; same name as specs 004 and 006 | FR-007, R3 |
| `EMBEDDING_API_KEY` | `OPENROUTER_API_KEY` | Key for it | R3 |
| `EMBEDDING_MODEL` | `openai/text-embedding-3-small` | Must be the brain's model (the core default) | FR-007 |
| `EMBEDDING_BATCH_SIZE` | 64 | Passages per embedding request; 1 disables batching | R3 |
| `VISION_API_BASE`, `VISION_API_KEY`, `VISION_MODEL` | unset | OpenAI-compatible vision endpoint. If unset, photos end `not_captioned` | FR-006, R4 |
| `ATTACHMENTS_BUCKET` | `ob1-files` | Private bucket | R12 |
| `MAX_IMAGE_MB` | 10 | Image size cap | FR-017, R1 |
| `MAX_PDF_MB` | 25 | PDF size cap | FR-017, R1 |
| `MAX_PDF_PAGES` | 50 | PDF page cap for inline processing | FR-013, FR-017, R1 |
| `PASSAGE_MAX_CHARS` | 1500 | Largest passage, source line included | FR-005, FR-025 |
| `SCANNED_MIN_CHARS_PER_PAGE` | 20 | Below this average, a PDF is `scanned` | FR-010, R2 |
| `UPLOAD_LINK_MINUTES` | 60 | Upload window for the direct link and the page | FR-001, R8 |
| `DOWNLOAD_LINK_SECONDS` | 600 | Download link lifetime | FR-014 |
| `BUSY_SECONDS` | 410 | Busy-mark expiry; one default on every platform (T005 Q1). Cloud owners may lower it to 160 for faster recovery after a killed run | FR-026, R10 |
| `PUBLIC_BASE_URL` | `SUPABASE_PUBLIC_URL`, else `SUPABASE_URL` | Address put in every returned link; on 006, an address the phone can reach | R6 |
| `UPLOAD_PAGE_URL` | `<function URL>/upload` | Where the phone page lives; on Cloud, the owner's published copy | R5 |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by the platform. No setting value is ever written into a thought, an attachment record or a log line (FR-009).
