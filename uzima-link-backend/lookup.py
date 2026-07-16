from database import get_db_connection

def find_patient_by_identity(search_term: str):
    """Searches for an existing patient record via phone number or national ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    term = search_term.strip()
    
    cursor.execute("SELECT * FROM patients WHERE phone = ? OR national_id = ?", (term, term))
    row = cursor.fetchone()
    conn.close()
    
    return dict(row) if row else None

def get_patient_timeline(patient_id: str) -> list:
    """Retrieves all past medical visits and their AI entities for a patient."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date DESC", (patient_id,))
    visits = [dict(r) for r in cursor.fetchall()]
    
    for visit in visits:
        cursor.execute("SELECT type, extracted_term FROM clinical_entities WHERE visit_id = ?", (visit["visit_id"],))
        visit["entities"] = [dict(r) for r in cursor.fetchall()]
        
    conn.close()
    return visits
