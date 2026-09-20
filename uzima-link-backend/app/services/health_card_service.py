import io
import requests
import qrcode
from PIL import Image, ImageDraw, ImageFont

from config import settings

CARD_WIDTH = 500
CARD_HEIGHT = 560
GREEN = (5, 150, 105)
DARK = (15, 23, 42)
GRAY = (100, 116, 139)

PHOTO_SIZE = 140
PHOTO_X = CARD_WIDTH - 200
PHOTO_Y = 150


def _load_font(size: int, bold: bool = False):
    try:
        path = "arialbd.ttf" if bold else "arial.ttf"
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def _build_qr(system_uid: str) -> Image.Image:
    verify_url = f"{settings.FRONTEND_URL}/doctor/scan/{system_uid}"
    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(verify_url)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGB")


def _load_patient_photo(photo_url: str) -> Image.Image | None:
    """Downloads the patient's photo from Cloudinary. Returns None if unavailable
    so the card still generates cleanly for patients without a photo yet."""
    if not photo_url:
        return None
    try:
        response = requests.get(photo_url, timeout=8)
        response.raise_for_status()
        img = Image.open(io.BytesIO(response.content)).convert("RGB")
        return img.resize((PHOTO_SIZE, PHOTO_SIZE))
    except Exception as e:
        print(f"Failed to load patient photo for health card: {e}")
        return None


def generate_health_card_image(patient, allergies: list) -> Image.Image:
    card = Image.new("RGB", (CARD_WIDTH, CARD_HEIGHT), "white")
    draw = ImageDraw.Draw(card)

    draw.rectangle([0, 0, CARD_WIDTH, 120], fill=GREEN)
    draw.text((32, 40), "Uzima Link", font=_load_font(36, bold=True), fill="white")
    draw.text((32, 85), "Your health record, wherever care finds you.", font=_load_font(14), fill="white")

    # --- Patient photo ---
    photo = _load_patient_photo(patient.photo_url)
    if photo:
        card.paste(photo, (PHOTO_X, PHOTO_Y))
        draw.rectangle([PHOTO_X, PHOTO_Y, PHOTO_X + PHOTO_SIZE, PHOTO_Y + PHOTO_SIZE], outline=GRAY, width=2)
    else:
        # Placeholder box so the layout stays consistent even with no photo yet
        draw.rectangle([PHOTO_X, PHOTO_Y, PHOTO_X + PHOTO_SIZE, PHOTO_Y + PHOTO_SIZE], outline=GRAY, width=2)
        draw.text((PHOTO_X + 20, PHOTO_Y + 60), "No photo", font=_load_font(13), fill=GRAY)

    y = 150
    draw.text((32, y), patient.full_name, font=_load_font(28, bold=True), fill=DARK)
    y += 45
    draw.text((32, y), f"System ID: {patient.system_uid}", font=_load_font(16), fill=GRAY)
    y += 28
    draw.text((32, y), f"DOB: {patient.date_of_birth}   Gender: {patient.gender}", font=_load_font(16), fill=GRAY)
    y += 28
    if patient.phone_number:
        draw.text((32, y), f"Phone: {patient.phone_number}", font=_load_font(16), fill=GRAY)
        y += 28
    if patient.national_id:
        draw.text((32, y), f"{patient.id_type.replace('_', ' ').title()}: {patient.national_id}", font=_load_font(16), fill=GRAY)
        y += 28
    if patient.guardian_name:
        draw.text((32, y), f"Guardian: {patient.guardian_name} ({patient.guardian_phone or 'no phone on file'})", font=_load_font(16), fill=GRAY)
        y += 28

    y += 20
    draw.text((32, y), "Allergies", font=_load_font(20, bold=True), fill=DARK)
    y += 32
    if allergies:
        for a in allergies[:5]:
            draw.text((32, y), f"• {a.allergen} ({a.severity})", font=_load_font(16), fill=(185, 28, 28) if a.severity == "severe" else GRAY)
            y += 26
    else:
        draw.text((32, y), "No known allergies on record", font=_load_font(16), fill=GRAY)

    qr_img = _build_qr(patient.system_uid)
    qr_img = qr_img.resize((220, 220))
    card.paste(qr_img, (CARD_WIDTH - 260, CARD_HEIGHT - 260))
    draw.text((CARD_WIDTH - 260, CARD_HEIGHT - 30), "Scan to verify", font=_load_font(13), fill=GRAY)

    return card


def image_to_png_bytes(card: Image.Image) -> bytes:
    buf = io.BytesIO()
    card.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


def image_to_pdf_bytes(card: Image.Image) -> bytes:
    buf = io.BytesIO()
    card.convert("RGB").save(buf, format="PDF")
    buf.seek(0)
    return buf.read()