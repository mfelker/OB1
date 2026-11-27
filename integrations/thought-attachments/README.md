# Thought Attachments

> Attach PDF manuals and photos to thoughts, and find them through the normal Open Brain search.

## What It Does

This integration adds a second remote MCP connector, the Edge Function `thought-attachments`, next to your core Open Brain connector. Through it your AI can attach a PDF or a photo to a thought. The file is kept in a private Supabase Storage bucket. Then:

- **A PDF with a text layer** is cut into passages. Each passage is saved as an ordinary thought that starts with a source line such as `From dishwasher-manual.pdf, pages 12–13 (attachment a1b2c3d4)`.
- **A photo** is described by a vision model. The caption is saved as an ordinary thought with a source line.

These derived thoughts are embedded with your brain's own embedding model, so the core connector's `search_thoughts` finds them with no changes. The original file stays retrievable through a short-lived download link. Derived thoughts carry the fields of the [ingestion metadata contract](../../docs/ingestion-metadata-contract.md).

It works on both platforms: Supabase Cloud, and the self-hosted stack from [spec 006's recipe](../../recipes/self-hosted-supabase-mcp/). Only the settings and the deploy step differ.

The AI sees seven tools: `find_thought`, `attach_file`, `finish_attachment`, `get_attachment`, `list_attachments`, `remove_attachment` and `find_orphan_attachments`. That adds to your AI's context weight; see the [MCP Tool Audit & Optimization Guide](../../docs/05-tool-audit.md) and [Tool Surface Area](#tool-surface-area) below.

## Prerequisites

- A working Open Brain on **Supabase Cloud** (following [Getting Started](../../docs/01-getting-started.md)) or on the **self-hosted stack** from [`recipes/self-hosted-supabase-mcp`](../../recipes/self-hosted-supabase-mcp/). Both give you a `thoughts` table and a private bucket named `ob1-files`, or setup creates the bucket for you.
- The **Supabase CLI** (Cloud only).
- Your brain's **access key** (`MCP_ACCESS_KEY`).
- Your brain's **embedding settings**. The integration must use the same model and vector size as your brain; it checks the size and fails loudly on a mismatch rather than writing thoughts that search can't find. The core default is OpenRouter with `openai/text-embedding-3-small`.
- A **vision-capable model endpoint** (OpenAI-compatible), if you want photo captions: Ollama `qwen2.5vl:7b` on the host for self-hosted, or any OpenRouter vision model for Cloud. Without one, photos are stored but not captioned.
- A phone, if you want to upload from it. On self-hosted it must be on the same network as the stack (or on your tailnet).
- Sample files to try: a PDF manual of 50 pages or fewer with selectable text, and a photo.

## Credential Tracker

Copy this block into a text editor and fill it in as you go. Record names and places only; never paste real keys into a file you commit.

```text
THOUGHT ATTACHMENTS -- CREDENTIAL TRACKER
-----------------------------------------

FROM YOUR OPEN BRAIN SETUP
  Project URL (Cloud):        ____________   (for example https://YOUR-PROJECT-REF.supabase.co)
  Access key (MCP_ACCESS_KEY): ____________
  Embedding API base:         ____________
  Embedding API key:          ____________   (OPENROUTER_API_KEY on Cloud)
  Embedding model:            ____________

YOU CHOOSE DURING SETUP
  Vision API base:            ____________   (for example http://host.docker.internal:11434/v1)
  Vision API key:             ____________   (blank for Ollama)
  Vision model:               ____________   (for example qwen2.5vl:7b)
  Public address (self-hosted): ____________ (the address your phone reaches, for example http://192.168.1.20:8000)
  Upload page address (Cloud): ____________  (where you publish upload-page.html)

CONNECTOR URL (assembled at the end)
  https://YOUR-PROJECT-REF.supabase.co/functions/v1/thought-attachments?key=YOUR-ACCESS-KEY

-----------------------------------------
```

## Steps

### Configure

The function reads these settings from its environment. Only `MCP_ACCESS_KEY` is required; the rest have defaults. A numeric setting that is not a positive number (or not a whole number where one is needed) makes every call return a named settings error, which never repeats the value.

| Setting | Default | What it does |
|---------|---------|--------------|
| `MCP_ACCESS_KEY` | none (required) | Your brain's access key. A missing or wrong key in a call gets an authorization error and changes nothing |
| `EMBEDDING_API_BASE` | `https://openrouter.ai/api/v1` | OpenAI-compatible embeddings endpoint (same name as specs 004 and 006) |
| `EMBEDDING_API_KEY` | `OPENROUTER_API_KEY` | Key for it |
| `EMBEDDING_MODEL` | `openai/text-embedding-3-small` | Must be your brain's model |
| `EMBEDDING_BATCH_SIZE` | `64` | Passages per embedding request; `1` turns batching off |
| `VISION_API_BASE`, `VISION_API_KEY`, `VISION_MODEL` | unset | OpenAI-compatible vision endpoint. If unset, photos end as `not_captioned` |
| `ATTACHMENTS_BUCKET` | `ob1-files` | The private bucket |
| `MAX_IMAGE_MB` | `10` | Image size cap (decimals such as `7.5` are accepted; 1 MB is 1,048,576 bytes) |
| `MAX_PDF_MB` | `25` | PDF size cap |
| `MAX_PDF_PAGES` | `50` | PDF page cap |
| `PASSAGE_MAX_CHARS` | `1500` | Largest passage, source line included |
| `SCANNED_MIN_CHARS_PER_PAGE` | `20` | Below this average, a PDF counts as scanned |
| `UPLOAD_LINK_MINUTES` | `60` | How long an upload link and the phone page stay valid |
| `DOWNLOAD_LINK_SECONDS` | `600` | How long a download link stays valid |
| `BUSY_SECONDS` | `410` | How long a running finish, rebuild or remove blocks others on the same attachment. On Cloud you may lower it to `160` for faster recovery after a killed run |
| `PUBLIC_BASE_URL` | `SUPABASE_PUBLIC_URL`, else `SUPABASE_URL` | The address put in every link the function returns. On self-hosted, set it to an address your phone can reach |
| `UPLOAD_PAGE_URL` | `PUBLIC_BASE_URL` + `/functions/v1/thought-attachments/upload` | Where the phone upload page lives. On Cloud, set it to your published copy (see [Upload from your phone](#upload-from-your-phone)) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` come from the platform. No setting value is ever written into a thought, an attachment record or a log line.

**Done when:** you have decided your embedding, vision and public-address values and noted them in the tracker.

### Set up the database

This adds one table for attachment records, the functions that write and remove derived thoughts, the grants and row-level security, and, if missing, the private bucket. It only adds to your schema; it never alters or drops the `thoughts` table's existing columns. It adds `thoughts.content_fingerprint` and its index only if your brain lacks them, using the same names as the core guide.

1. **Supabase Cloud:** open the SQL editor, paste the contents of `integrations/thought-attachments/schema.sql` and run it.
2. **Self-hosted:** from `recipes/self-hosted-supabase-mcp/`, run the file through the recipe's `psql` route:

   ```bash
   docker compose exec -T db psql -U postgres < ../../integrations/thought-attachments/schema.sql
   ```

3. Run the verification query at the end of `schema.sql`. It lists the table, its grants, row-level security and the private bucket.

**Done when:** the verification query shows the `thought_attachments` table with row-level security on, no access for the public roles, and the bucket `ob1-files` as private.

### Deploy to Supabase Cloud

Skip this section on the self-hosted stack.

1. Link the folder to your project (use your own project ref):

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. Set the settings that differ from the defaults. `MCP_ACCESS_KEY`, `OPENROUTER_API_KEY`, `SUPABASE_URL` and the service role key are already there from the core setup. Example for a vision model on OpenRouter:

   ```bash
   supabase secrets set VISION_API_BASE=https://openrouter.ai/api/v1 VISION_API_KEY=YOUR_OPENROUTER_KEY VISION_MODEL=YOUR_VISION_MODEL
   ```

3. Deploy. The function checks its own access key, so deploy it without Supabase's JWT check, as the core server is:

   ```bash
   supabase functions deploy thought-attachments --no-verify-jwt
   ```

**Done when:** `supabase functions list` shows `thought-attachments` as active.

### Deploy on spec 006's stack

Skip this section on Supabase Cloud. Nothing in the recipe's own files changes; you add two files of your own next to it, in `recipes/self-hosted-supabase-mcp/`.

1. Create `thought-attachments.env` with the settings that differ from the defaults. Do not commit this file; it can hold a vision key.

   ```text
   PUBLIC_BASE_URL=http://YOUR-MACHINE-ADDRESS:8000
   VISION_API_BASE=http://host.docker.internal:11434/v1
   VISION_MODEL=qwen2.5vl:7b
   ```

   `MCP_ACCESS_KEY` and the `EMBEDDING_*` settings are already passed to the functions service by the recipe. Compose does not take them from `supabase/docker/.env` for a file of your own, so repeat any other setting from the table above here.

2. Create `docker-compose.override.yml`. Compose reads it automatically next to the recipe's `docker-compose.yml`:

   ```yaml
   services:
     functions:
       env_file:
         - thought-attachments.env
       volumes:
         - ../../integrations/thought-attachments:/home/deno/functions/thought-attachments:ro
   ```

3. Recreate the functions service so it picks up the mount and the settings (a plain restart keeps the old settings):

   ```bash
   docker compose up -d --force-recreate functions
   ```

As the recipe warns, every function on this stack is reachable without a Supabase JWT and sees the service role key, so each one checks its own access key. This function does. Do not expose port 8000 beyond networks you trust.

**Done when:** `docker compose ps` shows `functions` healthy, and the connector URL from the next step answers.

### Connect your AI client

Add the function as a second connector, the same way as the core one (Claude Desktop: Settings, Connectors, Add custom connector, paste the URL). The URL is the function's address with your access key:

- Cloud: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/thought-attachments?key=YOUR-ACCESS-KEY`
- Self-hosted: `http://YOUR-MACHINE-ADDRESS:8000/functions/v1/thought-attachments?key=YOUR-ACCESS-KEY`

For Claude Code:

```bash
claude mcp add --transport http thought-attachments "CONNECTOR_URL"
```

Cloud-hosted clients such as claude.ai connectors cannot reach a self-hosted stack that is only on your machine or network.

**Done when:** your client lists the seven attachment tools.

### Attach a manual

1. Capture a thought with the core connector, for example "Dishwasher: service manual lives in the garage".
2. Ask your AI to find it with `find_thought` (by meaning, or `exact` for a text match). It returns the thought's id, first line and capture date.
3. Ask it to attach your PDF to that thought with `attach_file`. It gives the thought id, the file name, the type `application/pdf` and the exact size in bytes. You can instead give a `note` and let the integration save it as a new thought and use that as the parent. The result holds an upload command: a ready-to-run `curl` line. Run it from the folder holding the file:

   ```bash
   curl -X PUT -H "Content-Type: application/pdf" --data-binary @dishwasher-manual.pdf "UPLOAD_URL_FROM_THE_RESULT"
   ```

   The file's bytes never pass through the AI. The upload link accepts one file and expires after `UPLOAD_LINK_MINUTES`.
4. Ask the AI to run `finish_attachment`. It checks the stored file's real type and exact size against what was declared, cuts out the text and writes the passages. Its result shows the state `processed` and the passage count.
5. Search with the core connector, in words from inside the manual. A passage comes back with its source line, for example `From dishwasher-manual.pdf, pages 12–13 (attachment a1b2c3d4)`.

**Done when:** the attachment is `processed` and a core search returns a passage from your PDF with its source line.

### Upload from your phone

Instead of the command, you can have the AI create an upload link for your phone: ask it to attach a photo and open the result's `page_link` on the phone. The page needs no app, shell or access key. It shows the accepted types and size limit, uploads one file, finishes the attachment itself and shows the outcome, for example the photo's caption. The link works once, expires after `UPLOAD_LINK_MINUTES`, and can only affect its own attachment. If the page says it is waiting, another finish is running; it retries by itself.

To start with a note, ask the AI to attach a photo "with the note: the filters are on this shelf". It saves the note as a thought, uses it as the parent, and returns the page link. If the file is then refused or the link expires unused, that note is removed with the attachment unless another attachment uses it.

**On self-hosted**, the function serves the page itself. Set `PUBLIC_BASE_URL` to an address your phone can reach, such as the machine's LAN address or its tailnet address, and recreate the functions service. The phone must be on the same network (or the tailnet) as the stack. `localhost` would send the phone to itself. Reaching the stack from anywhere else is not covered yet (fork issue 29).

**On Supabase Cloud, publish the page once.** Cloud rewrites HTML served by an Edge Function to plain text, so the function cannot serve the page itself. Instead you publish one static file:

1. Open `integrations/thought-attachments/upload-page.html` and fill in its single API-address line with your function address, `https://YOUR-PROJECT-REF.supabase.co/functions/v1/thought-attachments`. The address is fixed in the file and never read from a link, so a crafted link cannot send a photo anywhere else. A copy with the line left blank will fail visibly against the host it was published on.
2. Publish the file to any free static host. It holds no secrets, and the one-time token travels in the link's `#fragment`, which the host never receives.
3. Set `UPLOAD_PAGE_URL` to the published address and redeploy or update the secret:

   ```bash
   supabase secrets set UPLOAD_PAGE_URL=https://YOUR-STATIC-HOST/upload-page.html
   ```

   The function then answers the page's requests only for that origin.

**Photos and HEIC.** The file picker accepts JPEG, PNG, WebP and PDF. On an iPhone, Safari hands over a JPEG even when the camera is set to High Efficiency. If a HEIC file does get through, it is refused before upload with a message to share it as JPEG: in the Photos app choose Share, then Options, then Most Compatible (or send it to yourself as a JPEG), or on Android pick a JPEG version.

**Vision model.** Photo captions need `VISION_API_BASE`, `VISION_API_KEY` and `VISION_MODEL`.

- Ollama on the host (self-hosted): `VISION_API_BASE=http://host.docker.internal:11434/v1`, `VISION_MODEL=qwen2.5vl:7b`, no key needed. Pull the model first with `ollama pull qwen2.5vl:7b`.
- OpenRouter (Cloud): `VISION_API_BASE=https://openrouter.ai/api/v1`, your key, and any vision model you choose.

The photo goes to the model as an embedded image, so the model server does not need to reach your storage.

**Done when:** a photo taken on your phone shows its caption on the page, and a core search for something in the photo returns the caption thought.

### Get a file back

A search result's source line names the attachment by its 8-character short id, for example `(attachment a1b2c3d4)`. Ask your AI to fetch the file with `get_attachment` and that short id (the full id works too). It returns the file name, type, size, page count, state, how many derived thoughts it has, and a download link that works for 10 minutes (`DOWNLOAD_LINK_SECONDS`). After that the link is refused; ask again for a new one. There is no link for an attachment that is still waiting for its upload or was refused.

To see which attachments belong to a thought, or which one is behind a search result, use `list_attachments` with the thought's id or the derived thought's id. It lists each attachment's id, short id, file name, type, size, state and derived count.

**Done when:** the downloaded file is byte-identical to your original.

## Expected Outcome

- The schema check shows the attachments table with row-level security on and the private bucket.
- The AI lists seven tools on the `thought-attachments` connector.
- A sample PDF ends `processed` with a passage count, and a core search in words from the manual returns its passage with the source line.
- A photo uploaded from your phone through the page ends `processed`, the page shows its caption, and a core search finds the caption.
- A file fetched through `get_attachment` is byte-identical to the original, and the link stops working after 10 minutes.
- A core `list_thoughts` filtered to type `observation` shows none of the passages, and `thought_stats` counts them under `reference`.

Tested with: Supabase Cloud ____ (placeholder), self-hosted stack from spec 006 ____ (placeholder), Deno ____, `unpdf` 2.2.2, vision model ____, embedding model ____.

Related reading: the [ingestion metadata contract](../../docs/ingestion-metadata-contract.md), [Getting Started](../../docs/01-getting-started.md) and the [self-hosted Supabase recipe](../../recipes/self-hosted-supabase-mcp/).

## Troubleshooting

See the entries below once this section is complete.

## Tool Surface Area

> This integration exposes MCP tools, which add to your AI's context weight. See the [MCP Tool Audit & Optimization Guide](../../docs/05-tool-audit.md) for strategies on managing your tool count as your Open Brain grows.

Seven tools: `find_thought`, `attach_file`, `finish_attachment`, `get_attachment`, `list_attachments`, `remove_attachment` and `find_orphan_attachments`. To keep the count low, enable only this connector when you attach files, and use the core connector for everyday search.
