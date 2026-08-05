#!/usr/bin/env bash
# Restores the newest dump the backup container wrote into a throwaway Postgres
# with an empty volume, and checks the schema and the migration history came
# back. A backup nobody has restored is not a backup.
set -euo pipefail

cd "$(dirname "$0")/.."

# backups/last/<db>-latest.sql.gz is the symlink the backup container repoints
# after every successful dump, whatever the rotation slot.
DUMP=$(ls -1 backups/last/*-latest.sql.gz 2>/dev/null | head -1 || true)
if [ -z "$DUMP" ]; then
	echo "no dump under backups/last/ — run 'make backup' first" >&2
	exit 1
fi

CONTAINER=distillcourse-restore-drill
TARGET_DB=restore_drill
cleanup() { docker rm -f -v "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

echo "restoring $DUMP"
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=drill postgres:17 >/dev/null

for _ in $(seq 60); do
	docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
	sleep 1
done
docker exec "$CONTAINER" pg_isready -U postgres >/dev/null

docker exec "$CONTAINER" createdb -U postgres "$TARGET_DB"
gunzip -c "$DUMP" | docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -q -o /dev/null -U postgres -d "$TARGET_DB"

TABLES=$(docker exec "$CONTAINER" psql -U postgres -d "$TARGET_DB" -tAc \
	"SELECT string_agg(tablename, ',' ORDER BY tablename) FROM pg_tables WHERE schemaname = 'public'")
echo "restored tables: $TABLES"

for required in alembic_version users; do
	case ",$TABLES," in
	*",$required,"*) ;;
	*)
		echo "restore drill FAILED: table '$required' missing" >&2
		exit 1
		;;
	esac
done

REVISION=$(docker exec "$CONTAINER" psql -U postgres -d "$TARGET_DB" -tAc "SELECT version_num FROM alembic_version")
echo "restore drill OK: schema at migration $REVISION"
