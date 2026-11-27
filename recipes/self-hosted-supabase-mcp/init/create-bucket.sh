#!/bin/sh
# create-bucket.sh: create the private ob1-files bucket (run by the one-shot ob1-init service).
STORAGE_URL="${STORAGE_URL:-http://storage:5000}"
resp=$(mktemp)
if ! status=$(curl -sS -o "$resp" -w '%{http_code}' -X POST "$STORAGE_URL/bucket" \
  -H 'Content-Type: application/json' \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -d '{"id":"ob1-files","name":"ob1-files","public":false}'); then
  echo "create-bucket.sh: could not reach storage at $STORAGE_URL" >&2
  rm -f "$resp"
  exit 1
fi
if [ "$status" = "200" ]; then
  echo "create-bucket.sh: bucket ob1-files is ready"
elif [ "$status" = "400" ] && grep -q BucketAlreadyExists "$resp"; then
  echo "create-bucket.sh: bucket ob1-files already exists"
else
  echo "create-bucket.sh: storage answered $status: $(cat "$resp")" >&2
  rm -f "$resp"
  exit 1
fi
rm -f "$resp"
