"""
RescueLens AI — FastAPI Backend
Entry point: configures app, CORS, routes, and lifespan events.
"""

import time
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from agent import RescueLensAgent
from gemini_service import GeminiService
from models import AnalyzeRequest, AnalyzeResponse, HealthResponse

# ── Logging ──────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("rescue-lens")

# ── Singletons (shared across requests) ─────────────
gemini_service = GeminiService()
agent = RescueLensAgent(gemini_service)


# ── Lifespan (startup / shutdown) ───────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 RescueLens AI backend starting…")
    await gemini_service.initialize()
    logger.info("✅ Gemini service ready")
    yield
    logger.info("🛑 RescueLens AI backend shutting down")


# ── FastAPI app ──────────────────────────────────────
app = FastAPI(
    title="RescueLens AI API",
    description="Real-time multimodal AI assistant powered by Gemini 1.5 Pro",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://rescuelensai.vercel.app", # Explicitly allow your domain
    ],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.web\.app|https://.*\.run\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request timing middleware ─────────────────────────
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000)
    response.headers["X-Processing-Time-Ms"] = str(elapsed_ms)
    return response


# ── Global exception handler ─────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Please try again.",
            "error_type": type(exc).__name__,
        },
    )


# ════════════════════════════════════════════════════
# ROUTES
# ════════════════════════════════════════════════════

@app.api_route("/", methods=["GET", "HEAD"], tags=["meta"])
async def root():
    return {"message": "RescueLens AI API is running ✅", "version": "1.0.0"}


@app.get("/health", response_model=HealthResponse, tags=["meta"])
async def health():
    """Health check — used by Cloud Run readiness probe."""
    return HealthResponse(
        status="healthy",
        model=gemini_service.model_name,
        version="1.0.0",
    )


@app.post("/analyze", response_model=AnalyzeResponse, tags=["agent"])
async def analyze(request: AnalyzeRequest):
    """
    Main multimodal analysis endpoint.

    Accepts any combination of:
      - image     : base64-encoded JPEG/PNG
      - text      : user text message
      - voice_transcript : transcribed speech

    Returns AI-generated response from Gemini 1.5 Pro, plus session metadata.
    """
    start = time.perf_counter()

    # Generate session id if not provided
    session_id = request.session_id or str(uuid.uuid4())

    logger.info(
        "analyze request | session=%s has_image=%s has_file=%s has_text=%s has_voice=%s",
        str(session_id)[0:8],
        bool(request.image),
        bool(request.file_b64),
        bool(request.text),
        bool(request.voice_transcript),
    )

    # Delegate to agent
    result = await agent.process(
        session_id=session_id,
        text=request.text,
        image_b64=request.image,
        voice_transcript=request.voice_transcript,
        file_b64=request.file_b64,
        file_mime_type=request.file_mime_type,
    )

    elapsed_ms = round((time.perf_counter() - start) * 1000)
    logger.info("analyze done | session=%s time=%dms", str(session_id)[0:8], elapsed_ms)

    return AnalyzeResponse(
        response=result["response"],
        session_id=session_id,
        tokens_used=result.get("tokens_used"),
        model=gemini_service.model_name,
        processing_time_ms=elapsed_ms,
    )


@app.delete("/session/{session_id}", tags=["agent"])
async def clear_session(session_id: str):
    """Clear conversation memory for a given session."""
    await agent.clear_session(session_id)
    return {"message": f"Session {str(session_id)[0:8]}… cleared"}
