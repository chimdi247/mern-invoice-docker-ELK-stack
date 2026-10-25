COMPOSE = docker compose

.PHONY: build up down down-v logs logs-api logs-web ps typecheck test smoke load

build:      ## build images and start everything
	$(COMPOSE) up --build -d --remove-orphans
up:
	$(COMPOSE) up -d
down:
	$(COMPOSE) down
down-v:     ## also delete all volumes (database, logs, metrics)
	$(COMPOSE) down -v
ps:
	$(COMPOSE) ps
logs:
	$(COMPOSE) logs -f --tail=100
logs-api:
	$(COMPOSE) logs -f --tail=100 api
logs-web:
	$(COMPOSE) logs -f --tail=100 web
typecheck:
	npm run typecheck && npm --prefix client run typecheck
test:       ## unit tests (backend + client)
	npm --prefix tests run test:unit
smoke:
	cd tests && npm run perf:smoke
load:
	cd tests && npm run perf:load
