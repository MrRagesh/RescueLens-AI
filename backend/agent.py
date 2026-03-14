"""
RescueLens AI — Agent
Orchestrates:
  - Prompt construction (text + voice + image fusion)
  - Firestore conversation memory (per session)
  - Cloud Storage logging (optional — for analysis audit trail)
  - Gemini inference via GeminiService
"""

import logging
import os
import json
import uuid
import datetime
from typing import Optional, Any, Dict, List

from gemini_service import GeminiService  # type: ignore

logger = logging.getLogger("rescue-lens.agent")

# ── Optional Google Cloud imports ─────────────────────────────────────────────
try:
    from google.cloud import firestore, storage  # type: ignore
    CLOUD_ENABLED = True
    logger.info("Google Cloud libraries loaded ✓")
except ImportError:
    CLOUD_ENABLED = False
    logger.warning(
        "google-cloud-firestore / storage not installed — "
        "running without persistent memory (local dict fallback)"
    )

# Maximum messages to keep in context window per session
MAX_HISTORY_MESSAGES = 20


class RescueLensAgent:
    """
    Main AI agent for RescueLens.

    Responsibilities:
      1. Fuse multimodal inputs into a coherent prompt.
      2. Retrieve and persist conversation history.
      3. Invoke Gemini for inference.
      4. Optionally log analysed images to Cloud Storage.
    """

    def __init__(self, gemini_service: GeminiService):
        self._gemini = gemini_service
        self._local_memory: Dict[str, List[Dict[str, Any]]] = {}   # fallback in-memory store

        # Firestore client (if available)
        self._db: Any = None
        if CLOUD_ENABLED:
            try:
                self._db = firestore.AsyncClient(
                    project=os.environ.get("GOOGLE_CLOUD_PROJECT")
                )
                logger.info("Firestore client initialised")
            except Exception as exc:
                logger.warning("Firestore init failed: %s — using local memory", exc)

        # Cloud Storage client (if available)
        self._storage_bucket: Any = None
        if CLOUD_ENABLED:
            bucket_name = os.environ.get("GCS_BUCKET_NAME")
            if bucket_name:
                try:
                    gcs = storage.Client(
                        project=os.environ.get("GOOGLE_CLOUD_PROJECT")
                    )
                    self._storage_bucket = gcs.bucket(bucket_name)
                    logger.info("Cloud Storage bucket: %s", bucket_name)
                except Exception as exc:
                    logger.warning("Cloud Storage init failed: %s", exc)

    # ════════════════════════════════════════════════
    # PUBLIC API
    # ════════════════════════════════════════════════

    async def process(
        self,
        session_id: str,
        text: Optional[str] = None,
        image_b64: Optional[str] = None,
        voice_transcript: Optional[str] = None,
        file_b64: Optional[str] = None,
        file_mime_type: Optional[str] = None,
    ) -> dict:
        """
        Process a multimodal turn and return the AI response.

        Returns:
            dict with keys: response, tokens_used
        """
        # 1. Build unified prompt
        prompt = self._build_prompt(text, voice_transcript, bool(image_b64), bool(file_b64))

        # 2. Retrieve conversation history
        history = await self._get_history(session_id)

        # 3. Invoke Gemini
        result = await self._gemini.generate(
            prompt=prompt,
            image_b64=image_b64,
            file_b64=file_b64,
            file_mime_type=file_mime_type,
            history=history if history else None,
        )

        ai_text = result["text"]

        # Remove markdown bold/italic asterisks requested by user
        ai_text = ai_text.replace("*", "")

        # 4. Persist turn to memory
        await self._save_turn(session_id, prompt, ai_text)

        # 5. Optionally log image to Cloud Storage
        if image_b64 and self._storage_bucket:
            await self._log_image(session_id, image_b64)

        return {
            "response": ai_text,
            "tokens_used": result.get("tokens_used"),
        }

    async def clear_session(self, session_id: str):
        """Delete all history for a session."""
        self._local_memory.pop(session_id, None)

        if self._db:
            try:
                doc_ref = self._db.collection("sessions").document(session_id)
                await doc_ref.delete()
            except Exception as exc:
                logger.warning("Failed to clear Firestore session: %s", exc)

    # ════════════════════════════════════════════════
    # PRIVATE HELPERS
    # ════════════════════════════════════════════════

    def _build_prompt(
        self,
        text: Optional[str],
        voice_transcript: Optional[str],
        has_image: bool,
        has_file: bool,
    ) -> str:
        """
        Fuse text + voice transcript into one coherent prompt.
        Adds context hints when an image or file is present.
        """
        parts = []

        if voice_transcript:
            parts.append(f"[Voice input]: {voice_transcript.strip()}")

        if text:
            parts.append(text.strip())

        if not parts:
            if has_image and has_file:
                parts.append("Please analyse the attached camera image and uploaded file.")
            elif has_image:
                parts.append("Please analyse the image I'm showing you and describe what you see.")
            elif has_file:
                parts.append("Please analyse the attached file.")
            else:
                parts.append("Hello! How can you help me?")

        prompt = "\n".join(parts)

        if has_image and not any("image" in p.lower() for p in parts):
            prompt = prompt + "\n\n(Refer to the attached camera image in your response.)"
            
        if has_file and not any("file" in p.lower() or "document" in p.lower() for p in parts):
            prompt = prompt + "\n\n(Refer to the uploaded file/document attached to this message.)"

        return prompt

    async def _get_history(self, session_id: str) -> list:
        """
        Retrieve the recent conversation history for a session.
        Returns a list of Gemini-compatible Content dicts.
        """
        # Try Firestore first
        if self._db:
            try:
                doc = await self._db.collection("sessions").document(session_id).get()
                if doc.exists:
                    data = doc.to_dict()
                    return data.get("history", [])[-MAX_HISTORY_MESSAGES:]
            except Exception as exc:
                logger.warning("Firestore get_history failed: %s", exc)

        # Fallback: local dict
        memory = self._local_memory.get(session_id)
        if memory is None:
            return []
        return memory[-MAX_HISTORY_MESSAGES:]  # type: ignore

    async def _save_turn(self, session_id: str, user_prompt: str, ai_response: str):
        """Append the latest turn to conversation history."""
        new_messages = [
            {"role": "user",  "parts": [{"text": user_prompt}]},
            {"role": "model", "parts": [{"text": ai_response}]},
        ]

        # Update local memory
        existing = self._local_memory.get(session_id)
        if existing is None:
            existing = []
        self._local_memory[session_id] = (
            existing + new_messages
        )[-MAX_HISTORY_MESSAGES * 2:]  # type: ignore

        # Persist to Firestore
        if self._db:
            try:
                history = self._local_memory[session_id]
                await self._db.collection("sessions").document(session_id).set(
                    {
                        "history": history,
                        "updated_at": datetime.datetime.utcnow().isoformat(),
                        "session_id": session_id,
                    },
                    merge=True,
                )
            except Exception as exc:
                logger.warning("Firestore save_turn failed: %s", exc)

    async def _log_image(self, session_id: str, image_b64: str):
        """
        Upload the analysed image to Cloud Storage for audit / replay.
        Path: images/{session_id}/{timestamp}.jpg
        """
        try:
            import base64
            image_bytes = base64.b64decode(image_b64)
            timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4().hex)
            blob_name = f"images/{session_id}/{timestamp}_{unique_id[:8]}.jpg"  # type: ignore
            blob = self._storage_bucket.blob(blob_name)
            blob.upload_from_string(image_bytes, content_type="image/jpeg")
            logger.debug("Image uploaded to GCS: %s", blob_name)
        except Exception as exc:
            logger.warning("GCS image upload failed (non-critical): %s", exc)
