from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Literal
import phonenumbers
from phonenumbers import NumberParseException


class PatientRegister(BaseModel):
    full_name: str
    date_of_birth: str
    gender: str
    phone_number: str
    id_type: str = "none"
    national_id: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 10:
            raise ValueError("Password must be at least 10 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v):
        try:
            parsed = phonenumbers.parse(v, None)
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError("Invalid phone number")
            return phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.E164
            )
        except NumberParseException:
            raise ValueError(
                "Invalid phone number format. Use international format e.g. +254712345678"
            )


class PatientLoginStart(BaseModel):
    method: Literal["email", "phone", "national_id"]
    value: str
    password: str


class PatientLoginChooseChannel(BaseModel):
    national_id: str
    password: str
    channel: Literal["email", "phone"]


class PatientLoginVerify(BaseModel):
    method: Literal["email", "phone", "national_id"]
    value: str
    otp: str


class LoginOtpSentOut(BaseModel):
    message: str


class DoctorRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    national_id: str
    phone_number: str
    facility_name: str
    facility_registration_number: str

    @field_validator("phone_number")
    @classmethod
    def valid_phone(cls, v):
        try:
            parsed = phonenumbers.parse(v, None)
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError("Invalid phone number")
            return phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.E164
            )
        except NumberParseException:
            raise ValueError(
                "Invalid phone number format. Use international format e.g. +254712345678"
            )

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 10:
            raise ValueError("Password must be at least 10 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class FrontdeskRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    invite_code: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 10:
            raise ValueError("Password must be at least 10 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    verified: Optional[bool] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 10:
            raise ValueError("Password must be at least 10 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class VerifyEmailRequest(BaseModel):
    token: str


class RegistrationPendingOut(BaseModel):
    message: str
    email_verification_sent: bool


class ResendVerificationRequest(BaseModel):
    email: EmailStr
    
class StaffLoginVerify(BaseModel):
    email: EmailStr
    otp: str
