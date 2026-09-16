from uuid import UUID
from sqlalchemy.orm import Session

import app.repository.audit_log_repository as audit_log_repository


def log_action(db: Session, user_id: UUID, action: str, resource_type: str = None, resource_id: UUID = None):
    try:
        audit_log_repository.create_log(db, user_id, action, resource_type, resource_id)
    except Exception as e:
        print(f"Audit log failed: {e}") 