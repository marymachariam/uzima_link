import os
import tempfile

from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def transcribe(audio_file) -> str | None:
    """
    Transcribes an uploaded audio file using Groq's Whisper endpoint.
    `audio_file` is a file-like object (e.g. UploadFile.file).
    Returns the transcribed text, or None on failure.
    """
    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=True) as tmp:
            tmp.write(audio_file.read())
            tmp.flush()
            tmp.seek(0)

            with open(tmp.name, "rb") as f:
                transcript = client.audio.transcriptions.create(
                    file=f,
                    model="whisper-large-v3",
                )
        return transcript.text.strip() if transcript and transcript.text else None
    except Exception:
        return None
