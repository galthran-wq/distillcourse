.PHONY: up down logs deploy backup restore-drill

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

backup:
	docker compose exec backup /backup.sh

restore-drill:
	./ops/restore-drill.sh
