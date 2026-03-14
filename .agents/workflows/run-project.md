---
description: How to run the RescueLens AI project (Backend and Frontend)
---

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/app/apikey) (already configured in `.env`)

### 1. Run the Backend
Open a terminal and navigate to the `backend` directory:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```
The backend will be available at `http://localhost:8000`.

### 2. Run the Frontend
Open a **new** terminal and navigate to the `frontend` directory:

```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:3000`.

### Troubleshooting
- If you see hydration errors, ensure you have the latest changes (I have already fixed these).
- Ensure the `.env` in the backend and `.env.local` in the frontend are properly set.
