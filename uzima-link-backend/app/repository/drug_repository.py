from datetime import datetime, timedelta
from sqlalchemy.orm import Session

import app.models as models

CACHE_MAX_AGE_DAYS = 30


def get_cached_drug(db: Session, query_name: str) -> models.Drug | None:
    drug = db.query(models.Drug).filter(models.Drug.query_name == query_name.lower().strip()).first()
    if not drug:
        return None
    if drug.fetched_at < datetime.utcnow() - timedelta(days=CACHE_MAX_AGE_DAYS):
        return None  
    return drug

def upsert_drug(db: Session, query_name: str, source: str = None, generic_name: str = None,
                brand_name: str = None, purpose: str = None, warnings: str = None,
                dosage_info: str = None) -> models.Drug:
    query_name = query_name.lower().strip()
    drug = db.query(models.Drug).filter(models.Drug.query_name == query_name).first()
    if drug:
        drug.source = source
        drug.generic_name = generic_name
        drug.brand_name = brand_name
        drug.purpose = purpose
        drug.warnings = warnings
        drug.dosage_info = dosage_info
        drug.fetched_at = datetime.utcnow()
    else:
        drug = models.Drug(
            query_name=query_name, source=source, generic_name=generic_name,
            brand_name=brand_name, purpose=purpose, warnings=warnings, dosage_info=dosage_info,
        )
        db.add(drug)
    db.commit()
    db.refresh(drug)
    return drug