import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AnalyzeRequest {
  text?: string;
  image?: string;           // base64 encoded JPEG
  voice_transcript?: string;
  file_b64?: string;
  file_mime_type?: string;
  session_id?: string;
}

export interface AnalyzeResponse {
  response: string;
  session_id: string;
  tokens_used?: number;
  model?: string;
  processing_time_ms?: number;
}

export interface HealthResponse {
  status: string;
  model: string;
  version: string;
}

// Main analysis endpoint — supports multimodal input
export async function analyzeMultimodal(
  payload: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const { data } = await axios.post<AnalyzeResponse>(
    `${API_BASE}/analyze`,
    payload,
    {
      headers: { "Content-Type": "application/json" },
      timeout: 60_000,
    }
  );
  return data;
}

// Health check
export async function healthCheck(): Promise<HealthResponse> {
  const { data } = await axios.get<HealthResponse>(`${API_BASE}/health`, {
    timeout: 5_000,
  });
  return data;
}

// Generate a random session ID
export const generateSessionId = () =>
  `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
