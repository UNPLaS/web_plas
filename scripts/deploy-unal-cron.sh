#!/usr/bin/env bash
# Despliegue por polling: descarga dist-unal.tar.gz del release rolling
# `unal-deploy` y lo publica en DocumentRoot si cambió.
#
# Uso en el servidor (ejemplo):
#   mkdir -p ~/bin ~/logs ~/.plas-deploy
#   install -m 755 deploy-unal-cron.sh ~/bin/deploy-unal-cron.sh
#   crontab -e  →  */10 * * * * ~/bin/deploy-unal-cron.sh >> ~/logs/deploy-plas.log 2>&1
#
set -euo pipefail

REPO="${PLAS_DEPLOY_REPO:-UNPLaS/web_plas}"
TAG="${PLAS_DEPLOY_TAG:-unal-deploy}"
ASSET="${PLAS_DEPLOY_ASSET:-dist-unal.tar.gz}"
DEST="${PLAS_DEPLOY_DEST:-/var/www/html/plas}"
STATE_DIR="${PLAS_DEPLOY_STATE:-$HOME/.plas-deploy}"
LOCK_FILE="${STATE_DIR}/deploy.lock"
ETAG_FILE="${STATE_DIR}/last-etag"

URL="https://github.com/${REPO}/releases/download/${TAG}/${ASSET}"

mkdir -p "$STATE_DIR"

# Evita dos deploys a la vez
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "$(date -Is) skip: another deploy is running"
  exit 0
fi

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

HEADERS="$TMP/headers.txt"
ARCHIVE="$TMP/$ASSET"
OUT="$TMP/out"

# Solo baja el cuerpo si el ETag cambió (o no hay ETag previo)
CURL_ARGS=(-fsSL -D "$HEADERS" -o "$ARCHIVE")
if [[ -f "$ETAG_FILE" ]]; then
  OLD_ETAG="$(<"$ETAG_FILE")"
  if [[ -n "$OLD_ETAG" ]]; then
    CURL_ARGS+=(-H "If-None-Match: ${OLD_ETAG}")
  fi
fi

HTTP_CODE="$(curl -w '%{http_code}' "${CURL_ARGS[@]}" "$URL" || true)"

if [[ "$HTTP_CODE" == "304" ]]; then
  echo "$(date -Is) up to date (304)"
  exit 0
fi

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "$(date -Is) error: download failed HTTP ${HTTP_CODE} from ${URL}" >&2
  exit 1
fi

NEW_ETAG="$(awk -F': ' 'BEGIN{IGNORECASE=1} tolower($1)=="etag"{gsub(/\r/,"",$2); print $2; exit}' "$HEADERS" || true)"

mkdir -p "$OUT"
tar -xzf "$ARCHIVE" -C "$OUT"

rsync -a --delete --omit-dir-times --no-perms "$OUT/" "${DEST}/"

if [[ -n "$NEW_ETAG" ]]; then
  printf '%s\n' "$NEW_ETAG" > "$ETAG_FILE"
else
  # Fallback si el CDN no manda ETag: hash del archivo
  sha256sum "$ARCHIVE" | awk '{print $1}' > "$ETAG_FILE"
fi

echo "$(date -Is) deployed OK → ${DEST}"
