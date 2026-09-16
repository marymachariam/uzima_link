"""
One-time seed: loads a downloaded KMHFR facilities CSV into the database.
This version reports exactly why any row was skipped, for debugging.
"""
import sys
import csv

from database import SessionLocal
import app.repository.facility_repository as facility_repository

COLUMN_MAP = {
    "code": "Code",
    "name": "Name",
    "facility_type": "Facility type",
    "county": "County",
    "sub_county": "Sub county",
}


def seed_from_csv(filepath: str):
    db = SessionLocal()
    created = 0
    skipped_missing_field = 0
    skipped_duplicate = 0
    skipped_error = 0

    try:
        with open(filepath, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=1):
                code = (row.get(COLUMN_MAP["code"]) or "").strip()
                name = (row.get(COLUMN_MAP["name"]) or "").strip()

                if not code or not name:
                    skipped_missing_field += 1
                    continue

                if facility_repository.get_facility_by_kmhfr_code(db, code):
                    skipped_duplicate += 1
                    continue

                try:
                    facility_repository.create_facility(
                        db, name=name, kmhfr_code=code,
                        facility_type=(row.get(COLUMN_MAP["facility_type"]) or "").strip() or None,
                        county=(row.get(COLUMN_MAP["county"]) or "").strip() or None,
                        sub_county=(row.get(COLUMN_MAP["sub_county"]) or "").strip() or None,
                        source="kmhfr_seed",
                    )
                    created += 1
                except Exception as e:
                    db.rollback()
                    skipped_error += 1
                    if skipped_error <= 5:  
                        print(f"Row {i} (code={code!r}) failed: {e}")

        print(f"\nDone.")
        print(f"Created: {created}")
        print(f"Skipped (missing code/name): {skipped_missing_field}")
        print(f"Skipped (already exists): {skipped_duplicate}")
        print(f"Skipped (error): {skipped_error}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.seed_facilities path/to/file.csv")
        sys.exit(1)
    seed_from_csv(sys.argv[1])