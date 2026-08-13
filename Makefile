.PHONY: up down logs deploy reindex backup restore-drill

# The same file docker compose substitutes from, so a build and the index that
# describes it cannot disagree about which lessons exist. `?=` keeps compose's
# own default for a file that does not set it.
-include .env
CONTENT_PREVIEW ?= 1
export CONTENT_PREVIEW

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

# Deployment is manual and lives here rather than in CI: one VPS, one operator.
# Reindexing is part of it, not a step to remember afterwards: a build that
# renames an h2 or unpublishes a lesson leaves `documents` naming anchors the
# page no longer has, and the tutor hands out locators that scroll nowhere.
deploy:
	git pull --ff-only
	docker compose build
	docker compose up -d --remove-orphans
	$(MAKE) reindex
	docker compose ps

# Node is required here, not just docker: the export runs the site's own MDX
# pipeline, which is the only way an indexed anchor and a page anchor cannot
# diverge. uv too, wherever a lab lesson exists — the labs are rebuilt rather
# than assumed, so the answer keys the API grades against are the ones the
# notebooks on the mirror were generated from.
reindex:
	npm run export-index
	npm run build-labs
	docker compose cp index.json backend:/tmp/index.json
	docker compose exec -T backend rm -rf /tmp/labs-private
	if [ -d labs-dist/private ]; then docker compose cp labs-dist/private backend:/tmp/labs-private; fi
	docker compose exec -T backend python -m app.content.ingest /tmp/index.json /tmp/labs-private

backup:
	docker compose exec backup /backup.sh

restore-drill:
	./ops/restore-drill.sh
