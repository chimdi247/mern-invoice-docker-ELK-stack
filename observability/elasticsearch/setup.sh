#!/bin/sh
# One-shot job: installs the index lifecycle policy (14 day retention) and the mapping template for
# invoice-logs-* BEFORE Fluent Bit creates the first daily index. Idempotent.
set -eu
ES="${ELASTICSEARCH_URL:-http://elasticsearch:9200}"

echo "waiting for Elasticsearch at $ES ..."
until curl -fsS "$ES/_cluster/health" >/dev/null 2>&1; do sleep 3; done

curl -fsS -X PUT "$ES/_ilm/policy/invoice-logs-14d" \
  -H 'Content-Type: application/json' --data-binary @/setup/ilm-policy.json
echo
curl -fsS -X PUT "$ES/_index_template/invoice-logs" \
  -H 'Content-Type: application/json' --data-binary @/setup/index-template.json
echo
echo "elasticsearch ready"
