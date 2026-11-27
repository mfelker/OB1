# Contract: phone upload page and its HTTP routes

One static file, `upload-page.html`, in the integration folder (research R5).

- **Self-hosted**: the integration serves it at `GET <function URL>/upload` as `text/html`.
- **Cloud**: the owner publishes the file once to a static host after setting its API address. That address is written **in the file** and never read from the link. The integration hands out the published address from the `UPLOAD_PAGE_URL` setting.

## The link

`<page address>#t=<token>`. The token is random, single-use and valid until the attachment's upload deadline. It sits in the fragment, so the page's host never receives it. The page needs no access key, shell or app (FR-002).

## What the owner sees

1. The file name expected, the accepted types and the size limit, and one file picker accepting `image/jpeg,image/png,image/webp,application/pdf` (R7).
2. Upload progress.
3. Finishing runs automatically and its outcome is shown: "Captioned: …" (first 300 characters), "Saved N passages", "Scanned PDF: text search won't cover it yet", "Not captioned: <reason>", "Refused: <reason>" or "Failed: <reason>" (FR-024, SC-011).
4. If the token has been used or has expired: "This link has expired or was already used. Ask your assistant for a new one" (spec edge case, SC-017).

## Routes the page calls

These routes accept only the page token; the brain key is never needed or accepted here. They return JSON, and CORS allows only the origin of `UPLOAD_PAGE_URL` (or the same origin on self-hosted).

| Route | Behaviour |
|-------|-----------|
| `POST <function URL>/page/start` with `{ token }` | For a valid, unused, unexpired token: returns the expected type, the size limit and a fresh signed upload link for this attachment only. Otherwise `410` with the expired or used message. |
| `POST <function URL>/page/finish` with `{ token }` | Uses up the token, then finishes **this attachment only**, with the same outcomes as `finish_attachment`. A second call with the same token gets `410`. It never affects any other attachment (FR-024, SC-011). |

A request with no token, or with a token for another attachment, changes nothing.
