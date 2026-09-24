import secrets
from datetime import datetime, timedelta
from uuid import UUID

from jose import jwt
from passlib.context import CryptContext

from config import settings

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _stringify_uuids(data: dict) -> dict:
    return {k: (str(v) if isinstance(v, UUID) else v) for k, v in data.items()}


def create_access_token(data: dict) -> str:
    to_encode = _stringify_uuids(data.copy())
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def generate_email_verification_token() -> str:
    return secrets.token_urlsafe(32)


def hash_otp(code: str) -> str:
    import hashlib

    return hashlib.sha256(code.encode()).hexdigest()


def generate_otp() -> str:
    return f"{secrets.randbelow(1000000):06d}"


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        masked = local[0] + "*" * max(len(local) - 1, 1)
    else:
        visible = min(4, len(local) - 2)
        masked = local[:visible] + "*" * (len(local) - visible)
    return f"{masked}@{domain}"
