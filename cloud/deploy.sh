#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  RescueLens AI — Google Cloud Deployment Script              ║
# ║  Deploys backend to Cloud Run and frontend to Firebase        ║
# ╚══════════════════════════════════════════════════════════════╝

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-your-gcp-project-id}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="rescue-lens-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
GCS_BUCKET="${GCS_BUCKET_NAME:-rescue-lens-images}"
MIN_INSTANCES=0
MAX_INSTANCES=10
MEMORY="1Gi"
CPU="1"

# Colours
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

log()    { echo -e "${CYAN}[deploy]${NC} $*"; }
success(){ echo -e "${GREEN}[  ok  ]${NC} $*"; }
warn()   { echo -e "${YELLOW}[ warn ]${NC} $*"; }
err()    { echo -e "${RED}[error ]${NC} $*" >&2; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────
log "Checking prerequisites…"
command -v gcloud >/dev/null 2>&1 || err "gcloud CLI not found. Install: https://cloud.google.com/sdk"
command -v docker  >/dev/null 2>&1 || err "Docker not found."

[ "$PROJECT_ID" = "your-gcp-project-id" ] && err "Set GOOGLE_CLOUD_PROJECT env var first"
[ -z "${GOOGLE_API_KEY:-}" ]              && warn "GOOGLE_API_KEY not set — model calls will fail"

# ── Auth & project ────────────────────────────────────────────
log "Configuring gcloud project: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"
gcloud auth configure-docker --quiet

# ── Enable required APIs ──────────────────────────────────────
log "Enabling required Google Cloud APIs…"
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    firestore.googleapis.com \
    storage.googleapis.com \
    aiplatform.googleapis.com \
    --quiet
success "APIs enabled"

# ── Create Firestore database (if not exists) ─────────────────
log "Ensuring Firestore database exists…"
gcloud firestore databases create \
    --location="${REGION}" \
    --quiet 2>/dev/null || warn "Firestore database already exists (OK)"

# ── Create GCS bucket (if not exists) ─────────────────────────
log "Ensuring Cloud Storage bucket: gs://${GCS_BUCKET}"
gsutil mb -p "${PROJECT_ID}" -l "${REGION}" "gs://${GCS_BUCKET}" 2>/dev/null \
    || warn "Bucket already exists (OK)"
gsutil lifecycle set cloud/gcs-lifecycle.json "gs://${GCS_BUCKET}" 2>/dev/null || true

# ── Docker build & push ───────────────────────────────────────
log "Building Docker image: ${IMAGE_NAME}"
docker build \
    --file cloud/Dockerfile \
    --tag "${IMAGE_NAME}:latest" \
    --tag "${IMAGE_NAME}:$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
    .
success "Image built"

log "Pushing image to Container Registry…"
docker push "${IMAGE_NAME}:latest"
success "Image pushed"

# ── Deploy to Cloud Run ───────────────────────────────────────
log "Deploying ${SERVICE_NAME} to Cloud Run in ${REGION}…"
gcloud run deploy "${SERVICE_NAME}" \
    --image="${IMAGE_NAME}:latest" \
    --platform=managed \
    --region="${REGION}" \
    --allow-unauthenticated \
    --memory="${MEMORY}" \
    --cpu="${CPU}" \
    --min-instances="${MIN_INSTANCES}" \
    --max-instances="${MAX_INSTANCES}" \
    --timeout=60 \
    --concurrency=80 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GCS_BUCKET_NAME=${GCS_BUCKET},GEMINI_MODEL=gemini-1.5-pro,ENV=production" \
    --set-secrets="GOOGLE_API_KEY=rescue-lens-api-key:latest" \
    --quiet

# Fetch the service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --platform=managed \
    --region="${REGION}" \
    --format="value(status.url)")

success "Backend deployed: ${SERVICE_URL}"

# ── Health check ──────────────────────────────────────────────
log "Running health check…"
HEALTH_RESPONSE=$(curl -sf "${SERVICE_URL}/health" || echo "FAILED")
if echo "${HEALTH_RESPONSE}" | grep -q "healthy"; then
    success "Health check passed ✅"
else
    warn "Health check returned: ${HEALTH_RESPONSE}"
fi

# ── Output summary ────────────────────────────────────────────
echo ""
echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 RescueLens AI — Deployment Complete${NC}"
echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo -e "  ${CYAN}Backend URL${NC}   : ${SERVICE_URL}"
echo -e "  ${CYAN}Project${NC}       : ${PROJECT_ID}"
echo -e "  ${CYAN}Region${NC}        : ${REGION}"
echo -e "  ${CYAN}GCS Bucket${NC}    : gs://${GCS_BUCKET}"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "  1. Set NEXT_PUBLIC_API_URL=${SERVICE_URL} in your frontend .env"
echo -e "  2. Deploy frontend: cd frontend && npm run build"
echo -e "  3. (Optional) Deploy frontend to Firebase Hosting or Vercel"
echo ""
