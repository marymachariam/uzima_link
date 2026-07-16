import json
import time
from google import genai
from google.genai import types

GEMINI_API_KEY = "AQ.Ab8RN6L8EhX710ZDh3ZYnrlBXuvEk5m9AvjhjPrU45XW0j8eBA"
client = genai.Client(api_key=GEMINI_API_KEY)

def extract_clinical_data(audio_file_path: str) -> dict:
    """Uploads audio to Gemini cloud and extracts structured medical data."""
    print(f"[Module 2 AI] Uploading {audio_file_path} to Google Cloud...")
    audio_upload = client.files.upload(file=audio_file_path)
    
    while audio_upload.state.name == "PROCESSING":
        time.sleep(1)
        audio_upload = client.files.get(name=audio_upload.name)
        
    if audio_upload.state.name == "FAILED":
        raise Exception("Google Cloud audio processing failed.")
        
    prompt = """
    Listen to this medical intake audio file carefully. The patient may be speaking in English, Swahili, 
    or a localized Kenyan dialect/Sheng vernacular.
    
    Extract:
    1. Original native transcript ('raw_transcript').
    2. Symptoms translated to English list ('symptoms').
    3. Pre-existing chronic conditions translated to English list ('pre_existing_conditions').
    4. Active medications listed in English ('active_medications').
    
    Return response strictly as a JSON object matching this structure:
    {
      "raw_transcript": "string",
      "symptoms": ["array"],
      "pre_existing_conditions": ["array"],
      "active_medications": ["array"]
    }
    Do not add markdown blocks or explanations.
    """
    
    print(" [Module 2 AI] Generating clinical analysis from Gemini...")
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=[audio_upload, prompt],
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1),
    )
    
    # Clean up the cloud file footprint
    try:
        client.files.delete(name=audio_upload.name)
    except Exception as e:
        print(f"[Module 2 AI] Warning: Cloud file deletion note: {e}")
        
    clean_res = response.text.strip().strip("`").replace("json", "", 1).strip()
    return json.loads(clean_res)
