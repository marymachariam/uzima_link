from uuid import UUID
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
import app.repository.user_repository as user_repository
import app.services.auth_service as auth_service
import app.models as models

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    token = credentials.credentials
    try:
        payload = auth_service.decode_access_token(token)
        user_id = UUID(payload.get("user_id"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = user_repository.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_role(*allowed_roles: str):
    def role_checker(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="You don't have permission to access this resource")
        return user
    return role_checker