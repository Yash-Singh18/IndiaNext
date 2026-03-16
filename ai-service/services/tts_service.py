import httpx

from config.settings import settings
from services.llm_service import llm_service


async def translate_for_tts(text: str, target_lang: str = "en") -> str:
    """Use LLM to translate text to the target language for TTS."""
    if target_lang == "en":
        return text

    response = await llm_service.router_client.chat.completions.create(
        model=settings.router_llm,
        messages=[
            {
                "role": "system",
                "content": f"Translate the following text to {target_lang}. Output ONLY the translation.",
            },
            {"role": "user", "content": text},
        ],
        temperature=0,
        max_tokens=2048,
    )
    return response.choices[0].message.content.strip()


async def text_to_speech(text: str, voice_id: str = "pNInz6obpgDQGcFmaJgB") -> bytes:
    """Convert text to speech using ElevenLabs API. Returns audio bytes."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            headers={
                "xi-api-key": settings.elevenlabs_api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                },
            },
            timeout=30.0,
        )
        response.raise_for_status()
        return response.content
