"""
RescueLens AI — Pydantic data models
"""

from typing import Optional
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Incoming multimodal analysis request."""

    text: Optional[str] = Field(
        default=None,
        description="User text message / question",
        max_length=4096,
    )
    image: Optional[str] = Field(
        default=None,
        description="Base64-encoded image (JPEG or PNG, without data URI prefix)",
    )
    voice_transcript: Optional[str] = Field(
        default=None,
        description="Speech-to-text transcript from the browser",
        max_length=2048,
    )
    file_b64: Optional[str] = Field(
        default=None,
        description="Base64-encoded document or file data",
    )
    file_mime_type: Optional[str] = Field(
        default=None,
        description="MIME type of the uploaded file",
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Session identifier for conversation memory",
        max_length=128,
    )

    class Config:
        json_schema_extra = {
            "example": {
                "text": "What is this and is it safe to eat?",
                "image": "<base64_string>",
                "session_id": "session_1720000000_abc123",
            }
        }


class AnalyzeResponse(BaseModel):
    """AI analysis response."""

    response: str = Field(description="AI-generated response text")
    session_id: str = Field(description="Session ID used / created")
    tokens_used: Optional[int] = Field(default=None, description="Approximate token count")
    model: Optional[str] = Field(default=None, description="Model used for inference")
    processing_time_ms: Optional[int] = Field(
        default=None, description="Server-side processing time in milliseconds"
    )


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    model: str
    version: str
