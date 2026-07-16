import os
import json
import sqlite3
import time
from google import genai
from google.genai import types

# ==========================================
# 0. CONFIGURATION
# ==========================================
AUDIO_FILE = "test1.mp3"  
GEMINI_API_KEY = "AQ.Ab8RN6L8EhX710ZDh3ZYnrlBXuvEk5m9AvjhjPrU45XW0j8eBA"  # Put your real Gemini key here
DATABASE_FILE = "uzima_data.db"

print("🚀 Starting Kenyan Multi-Language AI Voice Pipeline...")

# Initialize Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)

# ==========================================
# 1. STEP ONE: UPLOAD AUDIO TO GEMINI CLOUD
# ==========================================
print(f"\n[Step 1/3] Uploading '{AUDIO_FILE}' to Google Cloud Media Manager...")
try:
    audio_upload = client.files.upload(file=AUDIO_FILE)
    print(f"👉 Upload complete. File URI: {audio_upload.uri}")
    
    print("⏳ Waiting for cloud audio processing...")
    while audio_upload.state.name == "PROCESSING":
        time.sleep(2)
        audio_upload = client.files.get(name=audio_upload.name)
        
    if audio_upload.state.name == "FAILED":
        raise Exception("Audio processing failed on Google servers.")
    print("👉 Audio file is ready for analysis!")
except Exception as e:
    print(f"❌ Step 1 Failed! Error: {e}")
    exit()

# ==========================================
# 2. STEP TWO: TRANSCRIBE & DUAL-TRANSLATE
# ==========================================
print("\n[Step 2/3] Asking Gemini to translate and generate dual-language JSON...")
try:
    prompt = """
    Listen to this audio file carefully. It may be in English, Swahili, or a local vernacular language (like Kikuyu, Luo, Kamba, Luhya, etc.).
    
    Execute the following actions:
    1. Transcribe the audio exactly as spoken in its original language under 'raw_transcript'.
    2. Extract 'person_named' if any person is mentioned.
    3. Translate the extracted timeframe into BOTH Swahili and English.
    4. Translate the extracted task/action description into BOTH Swahili and English.
    
    Return your response strictly as a single JSON object matching this exact structure:
    {
      "raw_transcript": "original text here",
      "person_named": "name here or null",
      "time_mentioned": {
        "english": "time in english",
        "swahili": "muda kwa kiswahili"
      },
      "task_description": {
        "english": "task description in english",
        "swahili": "maelezo ya jukumu kwa kiswahili"
      }
    }
    
    Do not add any explanations, introductory remarks, markdown code blocks, or trailing text.
    """
    
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=[audio_upload, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json", 
            temperature=0.0                       
        ),
    )
    
    # Anti-crash string filtering
    clean_text_response = response.text.strip()
    if clean_text_response.startswith("```"):
        clean_text_response = clean_text_response.strip("`").replace("json", "", 1).strip()
    
    structured_json = json.loads(clean_text_response)
    print("👉 Success! Gemini generated the dual-language payload.")
    print(json.dumps(structured_json, indent=2))
except Exception as e:
    print(f"❌ Step 2 Failed! Error: {e}")
    exit()
finally:
    print("🧹 Cleaning up remote cloud files...")
    try:
        client.files.delete(name=audio_upload.name)
    except Exception as cleanup_error:
        print(f"⚠️ Warning: Cloud file cleanup failed: {cleanup_error}")

# ==========================================
# 3. STEP THREE: DATABASE STORAGE (LOCAL)
# ==========================================
print("\n[Step 3/3] Saving multi-language data into the local database...")
try:
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS voice (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            json_data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute(
        "INSERT INTO voice (json_data) VALUES (?)", 
        (json.dumps(structured_json),)
    )
    
    conn.commit()
    conn.close()
    print(f"👉 Success! Saved to database file: '{DATABASE_FILE}'")
    print("\n🎉 DUAL-LANGUAGE PIPELINE FUNCTIONAL!")
except Exception as e:
    print(f"❌ Step 3 Failed! Database write error: {e}")
