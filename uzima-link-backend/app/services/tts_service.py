import os

from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def synthesize(text: str) -> bytes:
    """
    Converts text to speech using Groq's TTS endpoint.
    Returns raw audio bytes (WAV).
    """
    if not text or not text.strip():
        text = "No information is available."

    response = client.audio.speech.create(
        model="playai-tts",
        voice="Fritz-PlayAI",
        input=text,
        response_format="wav",
    )
    return response.read()
