import tempfile
import os

from groq import AsyncGroq

from config.settings import settings


async def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe audio blob using Whisper large-v3 via Groq."""
    client = AsyncGroq(api_key=settings.groq_api_key_stt)

    # Write to temp file (Groq API needs a file-like object)
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(audio_bytes)
        temp_path = f.name

    try:
        with open(temp_path, "rb") as audio_file:
            transcription = await client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
                language="hi",
                response_format="text",
            )
        return transcription.strip()
    finally:
        os.unlink(temp_path)
