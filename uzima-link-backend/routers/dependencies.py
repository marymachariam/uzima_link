from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
import repository.user_repository as user_repository
import services.auth_service as auth_service
import models


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.replace("Bearer ", "")
    try:
        payload = auth_service.decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = user_repository.get_user_by_id(db, payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user