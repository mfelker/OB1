#!/bin/sh
# create-bucket.sh: create the private ob1-files bucket (run by the one-shot ob1-init service).
STORAGE_URL="${STORAGE_URL:-http://storage:5000}"
resp=$(mktemp)
status=$(curl -sS -o "$resp" -w '%{http_code}' -X POST "$STORAGE_URL/bucket" \
  -H 'Content-Type: application/json' \
  -d '{"id":"ob1-files","name":"ob1-files","public":false}')
if [ "$status" = "200" ]; then
  echo "create-bucket.sh: bucket ob1-files is ready"
elif [ "$status" = "400" ] && grep -q BucketAlreadyExists "$resp"; then
  echo "create-bucket.sh: bucket ob1-files already exists"
fi
rm -f "$resp"
