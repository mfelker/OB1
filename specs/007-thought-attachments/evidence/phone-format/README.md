# Phone photo format probe, 2026-11-26

Device: owner's iPhone, over Tailscale, to the Mac's tailnet address. Page served by supabase/edge-runtime:v1.79.2. The type is sniffed from the file's magic bytes.

```text
RESULT box1: name=image.jpg declared=image/jpeg sniffed=JPEG bytes=1341216
RESULT box2: name=image.jpg declared=image/jpeg sniffed=JPEG bytes=1585439
RESULT box3: name=image.jpg declared=image/jpeg sniffed=JPEG bytes=1250599
```

Box accept values: 1 = image/jpeg,image/png,image/webp,application/pdf; 2 = image/*,application/pdf; 3 = image/jpeg,image/png,image/webp.

The camera format was confirmed by the owner as **High Efficiency** (HEIC). iOS Safari therefore transcoded HEIC to JPEG for every `accept` variant tested, including `image/*`.
