.PHONY: up down logs deploy reindex backup restore-drill

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

# Deployment is manual and lives here rather than in CI: one VPS, one operator.
deploy:
	git pull --ff-only
	docker compose build
	docker compose up -d --remove-orphans
	docker compose ps

# Node is required here, not just docker: the export runs the site's own MDX
# pipeline, which is the only way an indexed anchor and a page anchor cannot
# diverge. CONTENT_PREVIEW must match the frontend build or the index and the
# site disagree about which lessons exist.
reindex:
	CONTENT_PREVIEW=$${CONTENT_PREVIEW:-1} npm run export-index -- index.json
	docker compose cp index.json backend:/tmp/index.json
	docker compose exec -T backend python -m app.content.ingest /tmp/index.json

backup:
	docker compose exec backup /backup.sh

restore-drill:
	./ops/restore-drill.sh
