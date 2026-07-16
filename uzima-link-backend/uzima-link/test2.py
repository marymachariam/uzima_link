import os
import json
import sqlite3
import time
from google import genai
from google.genai import types

# ==========================================
# 0. CONFIGURATION
# ==========================================
AUDIO_FILE = "test2.m4a"  # Your verified audio target file
GEMINI_API_KEY = "AQ.Ab8RN6L8EhX710ZDh3ZYnrlBXuvEk5m9AvjhjPrU45XW0j8eBA"
DATABASE_FILE = "uzima.db"

print("🚀 Starting Uzima Link Cloud-Native Medical Audio Pipeline...")

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
    print("👉 Audio file is ready for clinical analysis!")
except Exception as e:
    print(f"❌ Step 1 Failed! Error: {e}")
    exit()

# ==========================================
# 2. STEP TWO: CLINICAL PROCESSING
# ==========================================
print("\n[Step 2/3] Extracting and translating clinical data points...")
try:
    # We update the prompt to look for symptoms, medical history, and prescriptions
    prompt = """
    Listen to this medical intake audio file carefully. The patient may be speaking in English, Swahili, 
    or a localized Kenyan dialect/Sheng vernacular.
    
    Execute the following actions:
    1. Transcribe the audio exactly as spoken in its original native language under 'raw_transcript'.
    2. Extract all patient symptoms mentioned, and translate them into a clean English list under 'symptoms'.
    3. Identify any pre-existing chronic illnesses, conditions, or past diseases mentioned, translating them to standard English clinical terms under 'pre_existing_conditions'.
    4. Extract any active medications, prescriptions, or drugs the patient mentions they are currently taking under 'active_medications'.
    
    Return your response strictly as a single JSON object matching this exact structure:
    {
      "raw_transcript": "original native text here",
      "symptoms": ["list", "of", "extracted", "symptoms", "in", "english"],
      "pre_existing_conditions": ["list", "of", "conditions", "in", "english"],
      "active_medications": ["list", "of", "medications", "in", "english"]
    }
    
    Do not add any explanations, introductory remarks, markdown code blocks, or trailing text.
    """
    
    response = client.models.generate_content(
        model='gemini-3.5-flash', # Using the stable production flash engine
        contents=[audio_upload, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json", 
            temperature=0.1                       
        ),
    )
    
    clean_text_response = response.text.strip()
    if clean_text_response.startswith("```"):
        clean_text_response = clean_text_response.strip("`").replace("json", "", 1).strip()
    
    structured_json = json.loads(clean_text_response)
    print("👉 Success! Gemini generated the clinical JSON payload.")
    print(json.dumps(structured_json, indent=2))
except Exception as e:
    print(f"❌ Step 2 Failed! Error: {e}")
    exit()
finally:
    print("扫 Cleaning up remote cloud files...")
    try:
        client.files.delete(name=audio_upload.name)
    except Exception as cleanup_error:
        print(f"⚠️ Warning: Cloud file cleanup failed: {cleanup_error}")

# ==========================================
# 3. STEP THREE: STRUCTURAL STORAGE
# ==========================================
print("\n[Step 3/3] Saving data directly into Uzima Relational Tables...")
try:
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Ensure our production table is initialized
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sample_triage_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_text TEXT,
            symptoms_json TEXT,
            conditions_json TEXT,
            meds_json TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute(
        "INSERT INTO sample_triage_log (raw_text, symptoms_json, conditions_json, meds_json) VALUES (?, ?, ?, ?)", 
        (
            structured_json.get("raw_transcript"),
            json.dumps(structured_json.get("symptoms")),
            json.dumps(structured_json.get("pre_existing_conditions")),
            json.dumps(structured_json.get("active_medications"))
        )
    )
    
    conn.commit()
    conn.close()
    print(f"👉 Success! Saved clinical records to database file: '{DATABASE_FILE}'")
    print("\n🎉 UZIMA LINK MEDICAL LOOP IS FULLY FUNCTIONAL!")
except Exception as e:
    print(f"❌ Step 3 Failed! Database write error: {e}")

#To give reuslts to the doctor in either swahili, or engish, so it will jsut as the doctor hwo do you want to view the results or soemhting
#Also to save if the pattiens did say anything, to show no sysmptoms we identiefied or smoehting, 
#If the patient is saying irrelevant it be like please repeat that again