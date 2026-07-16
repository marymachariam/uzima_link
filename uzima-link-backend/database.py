import sqlite3

DB_FILE = "uzima_production.db"

def get_db_connection():
    """Establishes and returns a unique local database connection channel."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Access columns by name strings
    return conn

def initialize_database():
    """Constructs the core relational database tables from scratch."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Patients Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        patient_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        national_id TEXT UNIQUE
    );
    """)
    
    # Create Visits Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS visits (
        visit_id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        facility_id TEXT NOT NULL,
        raw_transcript TEXT NOT NULL,
        visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    );
    """)
    
    # Create Clinical Entities Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clinical_entities (
        entity_id TEXT PRIMARY KEY,
        visit_id TEXT NOT NULL,
        type TEXT CHECK(type IN ('symptom', 'condition', 'medication')) NOT NULL,
        extracted_term TEXT NOT NULL,
        FOREIGN KEY (visit_id) REFERENCES visits(visit_id)
    );
    """)
    
    conn.commit()
    conn.close()
    print("[Module 1] Database tables initialized successfully.")

if __name__ == "__main__":
    initialize_database()
