#!/usr/bin/env bash
set -euo pipefail
# Usage: ./deploy.sh <docker_image_tag>
TAG="${1:?Pass image tag, e.g. v0.3.1 or sha-abc123}"

# Decide next color by reading/storing a marker file
STATE_FILE=".active_color"
if [[ -f "$STATE_FILE" ]]; then
  ACTIVE=$(cat "$STATE_FILE")
else
  ACTIVE=green
fi
if [[ "$ACTIVE" == "green" ]]; then
  NEXT=blue
else
  NEXT=green
fi

echo "Current: $ACTIVE, deploying new: $NEXT with tag: $TAG"

# Pull new image and start the NEXT stack (isolated service name)
export TODOAPP_IMAGE_TAG="$TAG"
docker compose -f docker-compose.yml -f docker-compose.$NEXT.yml pull
docker compose -f docker-compose.yml -f docker-compose.$NEXT.yml up -d

# Smoke test the NEXT stack through nginx internal routing to that color
# NGINX routes by upstream name; here we probe the service directly.
echo "Running smoke test against $NEXT..."
docker run --rm --network todoapp_default curlimages/curl:8.10.1 \
  -fsS http://$NEXT:8080/ > /dev/null

# If OK, flip nginx to the NEXT color and reload
echo "Switching Nginx to $NEXT..."
sed -i "s/proxy_pass http:\/\/\(blue\|green\):8080;/proxy_pass http:\/\/$NEXT:8080;/" ./nginx/conf.d/app.conf
docker compose exec -T nginx nginx -s reload

# Stop the old one to free resources
echo "$NEXT" > "$STATE_FILE"
docker compose -f docker-compose.yml -f docker-compose.$ACTIVE.yml down

echo "Deploy complete. Active color: $NEXT"