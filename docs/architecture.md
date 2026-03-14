# RescueLens AI — Architecture Documentation

## System Overview

RescueLens AI is a real-time multimodal AI assistant consisting of three main layers:

1. **Frontend** (Next.js 14 + TypeScript)
2. **Backend** (Python FastAPI on Cloud Run)
3. **AI + Cloud Services** (Gemini 1.5 Pro + Firestore + Cloud Storage)

---

## Data Flow

### Standard text + image analysis

```
User opens camera                  (browser MediaDevices API)
        │
        ▼
User clicks "Analyze Frame"        (base64 JPEG captured)
        │
        ▼
User types or speaks question      (Web Speech API → transcript)
        │
        ▼
Frontend sends POST /analyze       (JSON: {text, image, session_id})
        │
        ▼
FastAPI receives request           (Pydantic validation)
        │
        ▼
Agent._build_prompt()              (fuse text + voice transcript)
        │
        ▼
Agent._get_history()               (Firestore session lookup)
        │
        ▼
GeminiService.generate()           (Google GenAI SDK call)
        │                          (parts: [inline_image, text])
        ▼
Gemini 1.5 Pro (Google Cloud)      (multimodal inference)
        │
        ▼
Agent._save_turn()                 (Firestore history update)
        │
Agent._log_image()                 (Cloud Storage upload — async)
        │
        ▼
FastAPI returns AnalyzeResponse    (JSON: {response, session_id, …})
        │
        ▼
Frontend renders AI message        (ChatBox component)
        │
        ▼
Browser speaks response            (Web Speech Synthesis API)
```

---

## Component Details

### Frontend Components

| Component | Responsibility |
|-----------|----------------|
| `CustomCursor` | Animated neon cursor with ripple on click |
| `HeroBackground` | Canvas particle system with mouse repulsion |
| `Navbar` | Fixed nav with scroll detection + mobile menu |
| `ThemeToggle` | localStorage-persisted dark/light toggle |
| `CameraFeed` | WebRTC camera with snapshot, flip, and HUD |
| `VoiceInput` | Web Speech API + AudioContext waveform viz |
| `ChatBox` | Scrollable message list with typing indicator |

### Backend Modules

| Module | Responsibility |
|--------|----------------|
| `main.py` | FastAPI app, CORS, middleware, route definitions |
| `agent.py` | Orchestration: prompt building, memory, cloud I/O |
| `gemini_service.py` | GenAI SDK wrapper, retry logic, safety config |
| `models.py` | Pydantic schemas for request/response validation |

---

## Session Memory Design

Each user session gets a unique `session_id` (UUID generated client-side).

```
Firestore collection: sessions
  Document ID: session_id
  Fields:
    - history: [{role: "user", parts: [{text: "..."}]}, ...]  (max 20 turns)
    - updated_at: ISO timestamp
    - session_id: string
```

The conversation history is injected into each Gemini request as a `chat` session,
giving the model full context of what was discussed before.

---

## Multimodal Input Fusion

When a user sends both an image and text, the agent builds a parts array:

```python
parts = [
    {"inline_data": {"mime_type": "image/jpeg", "data": base64_image}},
    {"text": "Is this wound infected? What should I do?"}
]
```

Gemini 1.5 Pro processes both simultaneously — not sequentially. This enables
true cross-modal reasoning (e.g. "the red inflammation visible around the cut suggests…").

---

## Security Considerations

- API key stored in GCP Secret Manager (never in env vars directly)
- Non-root Docker user for container runtime
- CORS restricted to known frontend origins
- Pydantic validates all inputs (max length, type checking)
- Images auto-deleted from Cloud Storage after 30 days
- Safety filters configured on Gemini to block harmful content

---

## Scaling

Cloud Run auto-scales from 0 to 10 instances based on request load.
- Min 0: zero cost when idle
- Max 10: handles hackathon demo bursts
- Concurrency 80: each instance handles up to 80 concurrent requests
- FastAPI is async throughout: no blocking I/O
