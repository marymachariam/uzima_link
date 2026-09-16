import requests

from config import settings

GROQ_BASE_URL = "https://api.groq.com/openai/v1/audio"
MODEL = "whisper-large-v3"


def _call_groq(endpoint: str, file_obj, filename: str) -> str:
    headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
    files = {"file": (filename, file_obj, "application/octet-stream")}
    data = {"model": MODEL}

    response = requests.post(f"{GROQ_BASE_URL}/{endpoint}", headers=headers, files=files, data=data, timeout=30)
    response.raise_for_status()
    return response.json().get("text", "").strip()


def transcribe_audio(file_obj, filename: str) -> str:
    """Returns the transcript in the original spoken language."""
    return _call_groq("transcriptions", file_obj, filename)


def translate_audio_to_english(file_obj, filename: str) -> str:
    """Returns an English translation directly from audio, regardless of spoken language."""
    return _call_groq("translations", file_obj, filename)


def translate_text(text: str, target_language: str = "Swahili") -> str:
    """Text-to-text translation via Groq's LLM — used after Whisper produces an English transcript."""
    headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": f"Translate the user's message into {target_language}. Respond with only the translation, nothing else."},
            {"role": "user", "content": text},
        ],
        "temperature": 0,
    }
    response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=20)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()