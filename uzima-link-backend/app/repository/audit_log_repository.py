from uuid import UUID

from sqlalchemy.orm import Session

from app import models


def create_log(
    db: Session,
    user_id: UUID,
    action: str,
    resource_type: str = None,
    resource_id: UUID = None,
) -> models.AuditLog:
    log = models.AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
    )
    db.add(log)
    db.commit()
    return log


def get_logs_for_resource(
    db: Session, resource_type: str, resource_id: UUID, limit: int = 100
):
    return (
        db.query(models.AuditLog)
        .filter(
            models.AuditLog.resource_type == resource_type,
            models.AuditLog.resource_id == resource_id,
        )
        .order_by(models.AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
