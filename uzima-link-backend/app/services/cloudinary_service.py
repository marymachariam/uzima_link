import cloudinary
import cloudinary.uploader

from config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def upload_patient_photo(file_obj, patient_id: str) -> str:
    """Uploads a patient photo and returns the secure URL."""
    result = cloudinary.uploader.upload(
        file_obj,
        folder="uzima_link/patient_photos",
        public_id=patient_id,
        overwrite=True,
        resource_type="image",
    )
    return result["secure_url"]

def upload_staff_photo(file_obj, user_id: str) -> str:
    result = cloudinary.uploader.upload(
        file_obj,
        folder="uzima_link/staff_photos",
        public_id=user_id,
        overwrite=True,
        resource_type="image",
    )
    return result["secure_url"]

def upload_kyc_selfie(file_obj, patient_id: str) -> str:
    result = cloudinary.uploader.upload(
        file_obj,
        folder="uzima_link/kyc_selfies",
        public_id=patient_id,
        overwrite=True,
        resource_type="image",
    )
    return result["secure_url"]

def upload_doctor_kyc_selfie(file_obj, user_id: str) -> str:
    result = cloudinary.uploader.upload(
        file_obj,
        folder="uzima_link/doctor_kyc_selfies",
        public_id=user_id,
        overwrite=True,
        resource_type="image",
    )
    return result["secure_url"]


def upload_doctor_kyc_id_document(file_obj, user_id: str) -> str:
    result = cloudinary.uploader.upload(
        file_obj,
        folder="uzima_link/doctor_kyc_id_documents",
        public_id=user_id,
        overwrite=True,
        resource_type="image",
    )
    return result["secure_url"]