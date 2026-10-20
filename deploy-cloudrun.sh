#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Google Cloud Run Deployment Script for LuminaMath Moldova (luminamath.md)
# Connected to Neon.tech Serverless PostgreSQL Pooler (eu-central-1)
# ============================================================================

# Load local .env if present (not committed to Git)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

PROJECT_ID="${PROJECT_ID:-dvc-lab-486908}"
SERVICE_NAME="luminamath-md"
REGION="${REGION:-europe-west1}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "⚠️  ERROR: DATABASE_URL is not set. Add it to .env or export DATABASE_URL=..."
  exit 1
fi

if [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "⚠️  ERROR: ADMIN_PASSWORD is not set. Add it to .env or export ADMIN_PASSWORD=..."
  exit 1
fi

echo "🚀 Building and deploying ${SERVICE_NAME} to Google Cloud Run (${REGION}, Project: ${PROJECT_ID})..."

gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 2 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 15 \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=${DATABASE_URL},ADMIN_PASSWORD=${ADMIN_PASSWORD}" \
  --quiet

echo "✅ Deployment complete!"
