#!/bin/sh
# One-shot job: creates the "Invoice App logs" data view and the saved searches in Kibana. Idempotent.
set -eu
KB="${KIBANA_URL:-http://kibana:5601}"

echo "waiting for Kibana at $KB ..."
until curl -fsS "$KB/api/status" >/dev/null 2>&1; do sleep 5; done

curl -fsS -X POST "$KB/api/data_views/data_view" \
  -H 'kbn-xsrf: true' -H 'Content-Type: application/json' --data-binary @/setup/data-view.json
echo
curl -fsS -X POST "$KB/api/saved_objects/_import?overwrite=true" \
  -H 'kbn-xsrf: true' -F file=@/setup/saved-objects.ndjson
echo
curl -fsS -X POST "$KB/api/kibana/settings" \
  -H 'kbn-xsrf: true' -H 'Content-Type: application/json' \
  -d '{"changes":{"defaultIndex":"invoice-logs","timepicker:timeDefaults":"{\"from\":\"now-1h\",\"to\":\"now\"}"}}'
echo
echo "kibana ready: $KB/app/discover"
