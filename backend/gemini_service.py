"""
RescueLens AI — Gemini Service
Wraps the Google GenAI SDK to provide multimodal inference via Gemini 1.5 Pro.
Handles base64 image decoding, prompt construction, retry logic, and safety settings.
"""

import base64
import logging
import os
from io import BytesIO
from typing import Optional

import google.generativeai as genai
from google.generativeai.types import HarmBlockThreshold, HarmCategory
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable
import tenacity

logger = logging.getLogger("rescue-lens.gemini")

# ── System prompt — defines the AI agent persona ────────────────────────────
SYSTEM_PROMPT = """You are RescueLens AI — a calm, knowledgeable, and highly capable emergency assistant.

Your role is to:
1. Analyse images captured from the user's camera in real-time.
2. Answer questions about injuries, medical situations, device troubleshooting, safety hazards, homework problems, plant identification, and more.
3. Provide clear, step-by-step instructions when action is needed.
4. Prioritise user safety above all else.

RESPONSE GUIDELINES:
- Be concise but thorough — prioritise actionable information.
- For medical or safety situations, always recommend professional help when appropriate.
- Use numbered steps for instructions (easier to follow in an emergency).
- If the image is unclear or insufficient, ask the user to reposition the camera.
- Never panic the user — remain calm and reassuring.
- Format responses for readability: use short paragraphs and bullet points where helpful.
- If no image is provided, rely on the text description.

You are powered by Gemini 1.5 Pro and deployed on Google Cloud. You are part of a hackathon demonstration showcasing multimodal AI capabilities.
"""


class GeminiService:
    """Manages Gemini 1.5 Pro model for multimodal inference."""

    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_API_KEY", "")
        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        self._model: Optional[genai.GenerativeModel] = None

    async def initialize(self):
        """Configure the GenAI SDK and create the model instance."""
        if not self.api_key:
            logger.warning(
                "GOOGLE_API_KEY not set — using application default credentials"
            )
        else:
            genai.configure(api_key=self.api_key)

        # Safety settings — balanced for emergency use-cases
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }

        generation_config = genai.types.GenerationConfig(
            temperature=0.4,          # Slightly creative but grounded
            top_p=0.95,
            top_k=40,
            max_output_tokens=1024,
            candidate_count=1,
        )

        self._model = genai.GenerativeModel(
            model_name=self.model_name,
            generation_config=generation_config,
            safety_settings=safety_settings,
            system_instruction=SYSTEM_PROMPT,
        )
        logger.info("Gemini model initialised: %s", self.model_name)

    # ── Retry decorator (handles transient quota/service errors) ─────────────
    @tenacity.retry(
        reraise=True,
        stop=tenacity.stop_after_attempt(3),
        wait=tenacity.wait_exponential(multiplier=1, min=1, max=8),
        retry=tenacity.retry_if_exception_type((ResourceExhausted, ServiceUnavailable)),
        before_sleep=lambda rs: logger.warning("Gemini retry attempt %d…", rs.attempt_number),
    )
    async def generate(
        self,
        prompt: str,
        image_b64: Optional[str] = None,
        file_b64: Optional[str] = None,
        file_mime_type: Optional[str] = None,
        history: Optional[list] = None,
    ) -> dict:
        """
        Generate a response from Gemini.

        Args:
            prompt: Combined text prompt (may include voice transcript).
            image_b64: Optional base64 JPEG/PNG image.
            file_b64: Optional base64 document or file.
            file_mime_type: MIME type for the document.
            history: Optional conversation history as list of Content dicts.

        Returns:
            dict with 'text' and 'tokens_used' keys.
        """
        if not self._model:
            raise RuntimeError("GeminiService not initialised — call initialize() first")

        # Build content parts
        parts: list = []

        if image_b64:
            try:
                # Provide image directly
                parts.append({
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_b64,
                    }
                })
                logger.debug("Image data attached to Gemini payload")
            except Exception as exc:
                logger.warning("Failed to attach image: %s", exc)
                
        if file_b64 and file_mime_type:
            try:
                # Provide file directly using the specified MIME type
                parts.append({
                    "inline_data": {
                        "mime_type": file_mime_type,
                        "data": file_b64,
                    }
                })
                logger.debug("File data (%s) attached to Gemini payload", file_mime_type)
            except Exception as exc:
                logger.warning("Failed to attach file: %s", exc)

        parts.append({"text": prompt})

        # Start or continue a chat session
        if history:
            chat = self._model.start_chat(history=history)
            response = await chat.send_message_async(parts)
        else:
            response = await self._model.generate_content_async(parts)

        # Extract response text
        if not response.candidates:
            raise ValueError("Gemini returned no candidates — possibly blocked by safety filters")

        text = response.text
        tokens = None
        try:
            tokens = response.usage_metadata.total_token_count
        except AttributeError:
            pass

        return {"text": text, "tokens_used": tokens}
