import io

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from app.core.dependencies import require_role
import app.repository.drug_repository as drug_repository
import app.services.openfda_service as openfda_service
import app.services.rxnorm_service as rxnorm_service
import app.services.dailymed_service as dailymed_service
import app.services.youtube_service as youtube_service
import app.services.ocr_service as ocr_service
import app.services.speech_service as speech_service
import app.services.tts_service as tts_service
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/patient/medicine", tags=["patient-medicine"])

PPB_REGISTRY_URL = "https://products.pharmacyboardkenya.org/ppb_admin/pages/public_view_retention_products.php"
GENERAL_NOTE = (
    "This is general drug information, not confirmation that a specific package is genuine. "
    f"To check if a product is officially registered in Kenya, search the PPB registry: {PPB_REGISTRY_URL}"
)

# Order matters: tried in sequence until one returns a match
SOURCES = [
    ("openfda", openfda_service.fetch_drug_info),
    ("rxnorm", rxnorm_service.fetch_drug_info),
    ("dailymed", dailymed_service.fetch_drug_info),
]


@router.get("/check", response_model=schemas.DrugInfoOut)
def check_medicine(
    name: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    cached = drug_repository.get_cached_drug(db, name)
    if cached:
        video_url = youtube_service.find_explainer_video(cached.generic_name or name)
        return schemas.DrugInfoOut(
            query=name,
            found=True,
            generic_name=cached.generic_name,
            brand_name=cached.brand_name,
            purpose=cached.purpose,
            warnings=cached.warnings,
            dosage_info=cached.dosage_info,
            source=cached.source,
            note=GENERAL_NOTE,
            video_url=video_url,
        )

    for source_name, fetch_fn in SOURCES:
        try:
            result = fetch_fn(name)
        except Exception:

            continue

        if result:
            saved = drug_repository.upsert_drug(db, query_name=name, source=source_name, **result)
            video_url = youtube_service.find_explainer_video(saved.generic_name or name)
            return schemas.DrugInfoOut(
                query=name,
                found=True,
                generic_name=saved.generic_name,
                brand_name=saved.brand_name,
                purpose=saved.purpose,
                warnings=saved.warnings,
                dosage_info=saved.dosage_info,
                source=saved.source,
                note=GENERAL_NOTE,
                video_url=video_url,
            )

    return schemas.DrugInfoOut(
        query=name,
        found=False,
        generic_name=None,
        brand_name=None,
        purpose=None,
        warnings=None,
        dosage_info=None,
        source=None,
        note=GENERAL_NOTE,
        video_url=None,
    )


@router.post("/check-by-image", response_model=schemas.DrugInfoOut)
def check_medicine_by_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    image_bytes = file.file.read()
    candidate_name = ocr_service.extract_drug_name_candidate(image_bytes)

    if not candidate_name:
        return schemas.DrugInfoOut(
            query="",
            found=False,
            generic_name=None,
            brand_name=None,
            purpose=None,
            warnings=None,
            dosage_info=None,
            source=None,
            note="Could not read a drug name from the image. Please try a clearer photo or type the name instead.",
            video_url=None,
        )

    return check_medicine(name=candidate_name, db=db, user=user)


@router.post("/check-by-voice", response_model=schemas.DrugInfoOut)
def check_medicine_by_voice(
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    transcript = speech_service.transcribe(audio.file)

    if not transcript:
        return schemas.DrugInfoOut(
            query="",
            found=False,
            generic_name=None,
            brand_name=None,
            purpose=None,
            warnings=None,
            dosage_info=None,
            source="",
            note="Could not understand the audio. Please try again or type the name instead.",
            video_url=None,
        )

    return check_medicine(name=transcript, db=db, user=user)


@router.get("/check/audio")
def check_medicine_audio(
    name: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("patient")),
):
    result = check_medicine(name=name, db=db, user=user)

    if not result.found:
        text_to_speak = f"Sorry, no information was found for {name}."
    else:
        parts = [p for p in [result.purpose, result.dosage_info] if p]
        text_to_speak = " ".join(parts) if parts else f"No detailed information available for {name}."

    audio_bytes = tts_service.synthesize(text_to_speak)
    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")