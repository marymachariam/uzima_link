import os
import shutil
import random
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import initialize_database, get_db_connection
import ai_code
import lookup

# Initialize the database file tables right when the server starts
initialize_database()

app = FastAPI(title="Uzima Link API Engine")

# Permit connection requests from your Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/patients/search")
async def search_patient(term: str):
    """Endpoint: Searches for a patient. Used on Kiosk intake or Doctor dashboard."""
    patient = lookup.find_patient_by_identity(term)
    if not patient:
        return {"status": "NOT_FOUND"}
    
    # If found, fetch their complete clinical timeline across all hospitals
    history = lookup.get_patient_timeline(patient["patient_id"])
    return {"status": "FOUND", "profile": patient, "history": history}

@app.post("/api/intake/audio")
async def audio_intake(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    facility_id: str = Form(...)
):
    """Endpoint: Receives browser audio data and executes the extraction-write sequence."""
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 1. Trigger the isolated Module 2 AI processing layer
        ai_data = ai_code.extract_clinical_data(temp_file)
        
        # 2. Open a database transaction script channel
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 3. Create a unique visit entry record row
        visit_id = f"vst_{random.randint(100000, 999999)}"
        cursor.execute(
            "INSERT INTO visits (visit_id, patient_id, facility_id, raw_transcript) VALUES (?, ?, ?, ?)",
            (visit_id, patient_id, facility_id, ai_data.get("raw_transcript", ""))
        )
        
        # 4. Insert parsed symptoms loop into clinical entities
        for symptom in ai_data.get("symptoms", []):
            cursor.execute(
                "INSERT INTO clinical_entities (entity_id, visit_id, type, extracted_term) VALUES (?, ?, ?, ?)",
                (f"ent_{random.randint(100000, 999999)}", visit_id, "symptom", symptom)
            )
            
        conn.commit()
        conn.close()
        
        return {"status": "SUCCESS", "visit_id": visit_id, "structured_data": ai_data}
        
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)
