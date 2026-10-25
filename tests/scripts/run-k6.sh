#!/usr/bin/env bash
# Usage: ./tests/scripts/run-k6.sh <smoke|load|stress|spike|soak|breakpoint|pdf> [extra k6 args]
# Applies the test overlay (auto-verified accounts, lifted rate limits), runs k6 inside the compose network and
# streams the results to Mimir -> Grafana dashboard "Invoice App - k6 Load Test".
set -euo pipefail
cd "$(dirname "$0")/../.."

TEST="${1:?usage: run-k6.sh <smoke|load|stress|spike|soak|breakpoint|pdf> [k6 args]}"; shift || true
COMPOSE=(docker compose -f docker-compose.yml -f tests/docker-compose.tests.yml)

"${COMPOSE[@]}" up -d api web          # recreates the api only if the overlay changed its environment
echo "waiting for the API to be healthy..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' invoice-api 2>/dev/null)" = "healthy" ]; do sleep 2; done

"${COMPOSE[@]}" run --rm k6 run \
  -o experimental-prometheus-rw \
  --tag "testid=${TEST}-$(date +%Y%m%d-%H%M%S)" \
  "$@" "/scripts/${TEST}.js"

echo
echo "Dashboard: http://localhost:3000/d/invoice-k6"
echo "Restore production settings with: docker compose up -d api"
