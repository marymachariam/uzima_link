import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def send_password_reset_email(to_email: str, reset_token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    resend.Emails.send({
        "from": "Uzima Link <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Reset your Uzima Link password",
        "html": f"""
            <p>Someone requested a password reset for your Uzima Link account.</p>
            <p><a href="{reset_link}">Click here to reset your password</a></p>
            <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
        """,
    })