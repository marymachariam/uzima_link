import os
import json
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_NAME = "gemini-3.5-flash"


def transcribe_audio(audio_file_path: str) -> str:
    """
    Takes a path to an audio file, returns the raw transcript
    in whatever language the patient spoke.
    """
    file_size = os.path.getsize(audio_file_path)
    print(f"[DEBUG] Uploading audio file: {audio_file_path}, size: {file_size} bytes")

    ext = os.path.splitext(audio_file_path)[1].lower()
    mime_map = {
        ".webm": "audio/webm",
        ".mp3": "audio/mp3",
        ".m4a": "audio/mp4",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
    }
    mime_type = mime_map.get(ext, "audio/webm")
    print(f"[DEBUG] Using mime_type: {mime_type}")

    uploaded_file = client.files.upload(
        file=audio_file_path,
        config={"mime_type": mime_type}
    )
    print(f"[DEBUG] Initial state: {uploaded_file.state.name}, reported mime: {uploaded_file.mime_type}")

    max_wait_seconds = 30
    waited = 0
    while uploaded_file.state.name == "PROCESSING" and waited < max_wait_seconds:
        time.sleep(1)
        waited += 1
        uploaded_file = client.files.get(name=uploaded_file.name)

    print(f"[DEBUG] Final state after {waited}s: {uploaded_file.state.name}")

    if uploaded_file.state.name != "ACTIVE":
        raise Exception("AUDIO_PROCESSING_FAILED")

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[
            "Transcribe this audio exactly as spoken. Return ONLY the transcript text, "
            "in the original language spoken, with no extra commentary.",
            uploaded_file
        ]
    )

    return response.text.strip()


def translate_text(text: str) -> dict:
    prompt = f"""You are a medical translator. Given this patient statement, provide:
1. An English translation
2. A Swahili translation

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{{
  "english": "...",
  "swahili": "..."
}}

Patient statement: "{text}"
"""
    response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
    cleaned = response.text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)


def extract_clinical_entities(english_text: str) -> dict:
    prompt = f"""You are an expert clinical processing assistant. Read this patient statement.
Extract all medical concepts, strip away all conversational filler, and structure them
into three lists: symptoms, conditions, medications.

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{{
  "symptoms": ["..."],
  "conditions": ["..."],
  "medications": ["..."]
}}

Patient statement: "{english_text}"
"""
    response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
    cleaned = response.text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)