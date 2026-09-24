import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    BREVO_API_KEY = os.getenv("BREVO_API_KEY")
    BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
    BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "Uzima Link")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    AFRICASTALKING_USERNAME = os.getenv("AFRICASTALKING_USERNAME")
    AFRICASTALKING_API_KEY = os.getenv("AFRICASTALKING_API_KEY")
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
    ADMIN_NOTIFICATION_EMAIL = os.getenv("ADMIN_NOTIFICATION_EMAIL")


settings = Settings()
