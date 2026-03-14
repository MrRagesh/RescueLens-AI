# 🔴 RescueLens AI

### *Real-Time Multimodal Emergency Assistant*

> **Built for Google AI Hackathon** · Powered by Gemini 1.5 Pro · Deployed on Google Cloud

---

## ✨ What Is RescueLens AI?

RescueLens AI is a next-generation AI agent that **sees through your camera**, **hears your voice**, and **responds in real time** with expert-level guidance for emergencies, troubleshooting, and everyday problem-solving.

Point your phone at a wound, a broken device, a homework problem, or an unknown plant — and receive instant, actionable AI assistance.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                                                              │
│   ┌─────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│   │ Camera Feed │  │  Voice Input  │  │  Chat Interface  │  │
│   │  (WebRTC)   │  │ (Web Speech)  │  │   (Text + TTS)   │  │
│   └──────┬──────┘  └───────┬───────┘  └────────┬─────────┘  │
│          └─────────────────┴──────────────────┘             │
│                             │                                │
│                    Next.js 14 Frontend                       │
└─────────────────────────────┼────────────────────────────────┘
                              │ HTTPS/JSON
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Google Cloud Run (FastAPI Backend)            │
│                                                             │
│   POST /analyze                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │              RescueLens Agent                        │  │
│   │                                                      │  │
│   │  1. Fuse text + voice + image into unified prompt   │  │
│   │  2. Retrieve session history from Firestore         │  │
│   │  3. Call Gemini 1.5 Pro via Google GenAI SDK        │  │
│   │  4. Persist updated history to Firestore            │  │
│   │  5. (Optional) Log image to Cloud Storage           │  │
│   └──────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │
         ┌─────────────────────┼───────────────────────┐
         │                     │                        │
         ▼                     ▼                        ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  Gemini 1.5 Pro │  │    Firestore     │  │  Cloud Storage  │
│  (Vertex AI /   │  │  (Conversation   │  │  (Image audit   │
│   AI Studio)    │  │   Memory)        │  │   trail)        │
└─────────────────┘  └──────────────────┘  └─────────────────┘
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| Python | ≥ 3.11 |
| npm / pnpm | latest |

### 1. Clone & install

```bash
git clone https://github.com/your-username/rescue-lens-ai.git
cd rescue-lens-ai
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

```bash
# Start the backend
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the dev server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## ☁️ Google Cloud Deployment

### Prerequisites

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

gcloud auth login
gcloud auth application-default login
```

### One-command deploy

```bash
# Set your project
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_API_KEY=your-gemini-api-key

# Store API key as a Secret Manager secret
gcloud secrets create rescue-lens-api-key \
    --replication-policy=automatic
echo -n "$GOOGLE_API_KEY" | gcloud secrets versions add rescue-lens-api-key --data-file=-

# Run deployment script
chmod +x cloud/deploy.sh
./cloud/deploy.sh
```

The script will:
1. Enable required Google Cloud APIs
2. Create Firestore database
3. Create Cloud Storage bucket
4. Build and push Docker image to Container Registry
5. Deploy to Cloud Run
6. Run a health check

### Manual Cloud Run deployment

```bash
# Build image
docker build -f cloud/Dockerfile -t gcr.io/$PROJECT_ID/rescue-lens-api .

# Push to registry
docker push gcr.io/$PROJECT_ID/rescue-lens-api

# Deploy
gcloud run deploy rescue-lens-api \
    --image gcr.io/$PROJECT_ID/rescue-lens-api \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
    --set-secrets "GOOGLE_API_KEY=rescue-lens-api-key:latest"
```

### Frontend deployment (Vercel — recommended)

```bash
cd frontend
npx vercel --prod
# Set NEXT_PUBLIC_API_URL to your Cloud Run URL in Vercel env settings
```

---

## 🔑 Environment Variables

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google AI Studio API key | Yes |
| `GEMINI_MODEL` | Model name (default: `gemini-1.5-pro`) | No |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | For Cloud features |
| `GCS_BUCKET_NAME` | Cloud Storage bucket for images | No |
| `PORT` | Server port (default: 8000) | No |

### Frontend

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

---

## 🧠 Gemini Integration

RescueLens uses **Gemini 1.5 Pro** via the **Google GenAI SDK** for multimodal reasoning:

### How it works

```python
# The agent builds a content list combining image + text
parts = [
    { "inline_data": { "mime_type": "image/jpeg", "data": base64_image } },
    { "text": "Is this wound infected? What should I do?" }
]

# Gemini 1.5 Pro processes both modalities simultaneously
response = await model.generate_content_async(parts)
```

### Why Gemini 1.5 Pro?

- **1M token context window** — handles long conversation history
- **Native multimodal** — processes image + text in a single request
- **Fast inference** — sub-second responses for real-time feel
- **Safety filters** — configurable for emergency use-cases

---

## 🏛️ Google Cloud Services Used

| Service | Usage |
|---------|-------|
| **Cloud Run** | Serverless backend deployment, auto-scaling |
| **Firestore** | Persistent conversation memory per session |
| **Cloud Storage** | Image audit trail, generated visual guides |
| **Container Registry** | Docker image storage |
| **Secret Manager** | Secure API key management |
| **Vertex AI** | (Optional) Model serving alternative |

---

## 📁 Project Structure

```
rescue-lens-ai/
│
├── frontend/
│   ├── components/
│   │   ├── CameraFeed.tsx      # Webcam capture with HUD overlay
│   │   ├── ChatBox.tsx         # Scrollable AI conversation UI
│   │   ├── CustomCursor.tsx    # Animated neon cursor
│   │   ├── HeroBackground.tsx  # Particle canvas animation
│   │   ├── Navbar.tsx          # Responsive navigation
│   │   ├── ThemeToggle.tsx     # Dark/light mode switcher
│   │   └── VoiceInput.tsx      # Speech recognition + waveform
│   │
│   ├── pages/
│   │   ├── _app.tsx            # Global layout, fonts, transitions
│   │   ├── index.tsx           # Landing page (Hero + Features)
│   │   └── interact.tsx        # Live AI agent interface
│   │
│   ├── styles/
│   │   └── globals.css         # CSS variables, neon effects, animations
│   │
│   ├── hooks/
│   │   └── useTheme.ts         # Theme state management
│   │
│   ├── utils/
│   │   └── api.ts              # Typed API client (axios)
│   │
│   └── package.json
│
├── backend/
│   ├── main.py                 # FastAPI app, routes, middleware
│   ├── agent.py                # AI agent (prompt fusion + memory)
│   ├── gemini_service.py       # Google GenAI SDK wrapper
│   ├── models.py               # Pydantic request/response models
│   ├── requirements.txt
│   └── .env.example
│
├── cloud/
│   ├── Dockerfile              # Multi-stage production Docker build
│   ├── deploy.sh               # One-command GCP deployment
│   ├── cloudrun-service.yaml   # Declarative Cloud Run config
│   └── gcs-lifecycle.json      # Storage auto-cleanup policy
│
└── README.md
```

---

## 🎮 Reproducible Testing / Demo Instructions

1. **Open** `http://localhost:3000`
2. **Browse** the landing page — note particle animations, feature cards, and theme toggle
3. **Click** "Start Live AI" to enter the agent interface
4. **Allow** camera and microphone permissions
5. **Point** your camera at any object
6. **Click** "Analyze Frame" to capture
7. **Type or speak** your question (e.g. *"What is this?"*)
8. **Receive** AI response as text + voice output

### Demo scenarios to try

| Scenario | How to demo |
|----------|-------------|
| First Aid | Point at a bandage or wound image, ask "How do I treat this?" |
| Device Repair | Show a circuit board, ask "What component is this?" |
| Homework | Hold up a math problem, ask "Solve this step by step" |
| Plant ID | Show a plant, ask "What species is this and is it toxic?" |
| Safety Check | Show an electrical panel, ask "Is this safe?" |

---

## 🏆 Hackathon Compliance

| Requirement | Implementation |
|-------------|----------------|
| ✅ Gemini model | Gemini 1.5 Pro via Google GenAI SDK |
| ✅ Google GenAI SDK | `google-generativeai` Python package |
| ✅ Google Cloud deployment | Cloud Run (serverless, auto-scaling) |
| ✅ Google Cloud service | Firestore + Cloud Storage + Cloud Run |
| ✅ Multimodal inputs | Camera (image) + Voice + Text |
| ✅ Multimodal outputs | Text + Voice (TTS) + Visual guides |

---

## 📜 License

MIT — Built for demonstration and hackathon purposes.

---

*Made with ❤️ using Gemini 1.5 Pro and Google Cloud*
