import io
import os

import qrcode
import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps

from config import settings

# ---------------------------------------------------------------------------
# Canvas – portrait / almost-square card
# ---------------------------------------------------------------------------
LOGICAL_W, LOGICAL_H = 540, 720          # tall enough for all content
FINAL_W, FINAL_H = 600, 800
SUPERSAMPLE = 2
K = FINAL_W * SUPERSAMPLE / LOGICAL_W

MARGIN = 36
CORNER_RADIUS = 28

QR_PATH = "/doctor/scan"

# Palette
GRADIENT_STOPS = [(0.0, (6, 95, 70)), (0.5, (4, 120, 87)), (1.0, (2, 44, 34))]
WHITE = (255, 255, 255)
MUTED = (167, 243, 208)
DEEP = (2, 44, 34)
PILL_DARK = (2, 44, 34, 115)


def px(value: float) -> int:
    return int(round(value * K))


# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------
ASSET_FONT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "fonts"
)

_REGULAR = [
    "Inter-Regular.ttf", "Ubuntu-R.ttf", "NotoSans-Regular.ttf",
    "LiberationSans-Regular.ttf", "DejaVuSans.ttf", "arial.ttf", "Arial.ttf",
]
_FONT_FILES = {
    "regular": _REGULAR,
    "bold": [
        "Inter-Bold.ttf", "Ubuntu-B.ttf", "NotoSans-Bold.ttf",
        "LiberationSans-Bold.ttf", "DejaVuSans-Bold.ttf", "arialbd.ttf", "Arial Bold.ttf",
    ],
    "italic": [
        "Inter-Italic.ttf", "Ubuntu-RI.ttf", "NotoSans-Italic.ttf",
        "LiberationSans-Italic.ttf", "DejaVuSans-Oblique.ttf", "ariali.ttf", "Arial Italic.ttf",
    ],
    "mono": [
        "JetBrainsMono-Regular.ttf", "UbuntuMono-R.ttf", "LiberationMono-Regular.ttf",
        "DejaVuSansMono.ttf", "cour.ttf", "Courier New.ttf",
    ] + _REGULAR,
}
_FONT_CACHE = {}


def _font(size: float, bold: bool = False, italic: bool = False, mono: bool = False):
    style = "mono" if mono else "bold" if bold else "italic" if italic else "regular"
    size_px = px(size)
    key = (style, size_px)
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]

    font = None
    for name in _FONT_FILES[style]:
        for candidate in (os.path.join(ASSET_FONT_DIR, name), name):
            try:
                font = ImageFont.truetype(candidate, size_px)
                break
            except OSError:
                continue
        if font:
            break
    if font is None:
        try:
            font = ImageFont.load_default(size_px)
        except TypeError:
            font = ImageFont.load_default()

    _FONT_CACHE[key] = font
    return font


def _text(draw, xy, text, font, fill, anchor="lm"):
    try:
        draw.text(xy, text, font=font, fill=fill, anchor=anchor)
    except (ValueError, TypeError):
        draw.text(xy, text, font=font, fill=fill)


def _spaced(draw, x, y, text, font, fill, spacing=1.8):
    cx = px(x)
    for ch in text:
        _text(draw, (cx, px(y)), ch, font, fill)
        cx += draw.textlength(ch, font=font) + px(spacing)
    return (cx - px(x)) / K


def _fit(draw, text, font, max_w):
    if draw.textlength(text, font=font) / K <= max_w:
        return text
    while text and draw.textlength(text + "…", font=font) / K > max_w:
        text = text[:-1]
    return text.rstrip() + "…"


def _clean(value) -> str:
    text = str(value).strip() if value is not None else ""
    return "" if text.lower() in ("", "none", "n/a", "na", "null", "-") else text


def _id_label(id_type) -> str:
    text = _clean(id_type)
    label = text.replace("_", " ").title() if text else "National ID"
    return label.replace(" Id", " ID")


# ---------------------------------------------------------------------------
# Background
# ---------------------------------------------------------------------------
def _color_at(t: float):
    t = max(0.0, min(1.0, t))
    for (t0, c0), (t1, c1) in zip(GRADIENT_STOPS, GRADIENT_STOPS[1:]):
        if t <= t1:
            f = (t - t0) / (t1 - t0) if t1 > t0 else 0
            return tuple(int(round(c0[i] + (c1[i] - c0[i]) * f)) for i in range(3))
    return GRADIENT_STOPS[-1][1]


def _gradient(width: int, height: int) -> Image.Image:
    gw = 200
    gh = max(1, int(round(gw * height / width)))
    d = 0.70710678
    length = (gw + gh) * d
    pixels = []
    for y in range(gh):
        for x in range(gw):
            t = ((x - gw / 2) * d + (y - gh / 2) * d) / length + 0.5
            pixels.append(_color_at(t))
    small = Image.new("RGB", (gw, gh))
    small.putdata(pixels)
    return small.resize((width, height), Image.BICUBIC)


# ---------------------------------------------------------------------------
# Icons
# ---------------------------------------------------------------------------
def _stroke_width(size: float) -> int:
    return max(1, px(size / 12))


def _stroke(draw, points, x, y, size, color):
    s = size / 24
    width = _stroke_width(size)
    pts = [(px(x + a * s), px(y + b * s)) for a, b in points]
    draw.line(pts, fill=color, width=width, joint="curve")
    r = width / 2
    for cx, cy in pts:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)


def _ring(draw, cx, cy, r, x, y, size, color):
    s = size / 24
    draw.ellipse(
        [
            px(x + (cx - r) * s), px(y + (cy - r) * s),
            px(x + (cx + r) * s), px(y + (cy + r) * s),
        ],
        outline=color, width=_stroke_width(size),
    )


def _box(draw, x0, y0, x1, y1, radius, x, y, size, color):
    s = size / 24
    draw.rounded_rectangle(
        [
            px(x + x0 * s), px(y + y0 * s),
            px(x + x1 * s), px(y + y1 * s),
        ],
        radius=px(radius * s), outline=color, width=_stroke_width(size),
    )


def _icon_card(d, x, y, size, color):
    _box(d, 2, 5, 22, 19, 3, x, y, size, color)
    _stroke(d, [(2, 10), (22, 10)], x, y, size, color)
    _stroke(d, [(6, 15), (10, 15)], x, y, size, color)


def _icon_shield(d, x, y, size, color):
    _stroke(
        d,
        [(12, 2.5), (20, 5.5), (20, 12), (17.5, 17), (12, 21.5),
         (6.5, 17), (4, 12), (4, 5.5), (12, 2.5)],
        x, y, size, color,
    )
    _stroke(d, [(8.5, 12), (11, 14.5), (15.5, 9.5)], x, y, size, color)


def _icon_user(d, x, y, size, color):
    _ring(d, 12, 7, 4, x, y, size, color)
    _stroke(
        d,
        [(4, 21), (4, 19), (5.3, 16.3), (8, 15), (16, 15),
         (18.7, 16.3), (20, 19), (20, 21)],
        x, y, size, color,
    )


def _icon_calendar(d, x, y, size, color):
    _box(d, 3, 4.5, 21, 21.5, 2.5, x, y, size, color)
    _stroke(d, [(16, 2.5), (16, 6.5)], x, y, size, color)
    _stroke(d, [(8, 2.5), (8, 6.5)], x, y, size, color)
    _stroke(d, [(3, 10), (21, 10)], x, y, size, color)


def _icon_pulse(d, x, y, size, color):
    _stroke(d, [(22, 12), (18, 12), (15, 21), (9, 3), (6, 12), (2, 12)], x, y, size, color)


def _icon_check(d, x, y, size, color):
    _stroke(d, [(4.5, 12.5), (9.5, 17.5), (19.5, 6.5)], x, y, size, color)


# ---------------------------------------------------------------------------
# Building blocks
# ---------------------------------------------------------------------------
def _pill(draw, x, y, w, h, fill, outline=None, outline_w=1.4):
    box = [px(x), px(y), px(x + w), px(y + h)]
    if outline:
        draw.rounded_rectangle(
            box, radius=px(h / 2), fill=fill, outline=outline, width=max(1, px(outline_w))
        )
    else:
        draw.rounded_rectangle(box, radius=px(h / 2), fill=fill)


def _info_pill(draw, x, y, icon, label, value, fill=PILL_DARK,
               label_color=None, value_color=WHITE, icon_color=MUTED):
    h = 32
    label_font, value_font = _font(15), _font(15, bold=True)
    label_text = label + " "
    label_w = draw.textlength(label_text, font=label_font) / K
    value_w = draw.textlength(value, font=value_font) / K
    w = 14 + 16 + 7 + label_w + value_w + 14
    _pill(draw, x, y, w, h, fill)
    icon(draw, x + 14, y + (h - 16) / 2, 16, icon_color)
    tx, cy = x + 14 + 16 + 7, y + h / 2
    _text(draw, (px(tx), px(cy)), label_text, label_font, label_color or (*MUTED, 235))
    _text(draw, (px(tx + label_w), px(cy)), value, value_font, value_color)
    return w


# ---- Allergy chips ----
_SEVERITY_ORDER = {"severe": 0, "moderate": 1, "mild": 2}
_SEVERITY_STYLE = {
    "severe": ((127, 29, 29, 150), (254, 226, 226), (252, 165, 165)),
    "moderate": ((146, 64, 14, 150), (254, 243, 199), (252, 211, 77)),
}
_DEFAULT_STYLE = ((255, 255, 255, 42), WHITE, MUTED)
CHIP_H = 28


def _allergy_chip(draw, x, y, allergen, severity, right=None, draw_it=True):
    name_font, sev_font = _font(14, bold=True), _font(13)
    sev = _clean(severity)
    sev_text = f" · {sev.title()}" if sev else ""
    fill, text_color, dot_color = _SEVERITY_STYLE.get(sev.lower(), _DEFAULT_STYLE)
    sev_w = draw.textlength(sev_text, font=sev_font) / K
    chrome = 12 + 8 + 6 + sev_w + 12
    name = _clean(allergen) or "Unknown"
    if right is not None:
        name = _fit(draw, name, name_font, max(30, right - x - chrome))
    name_w = draw.textlength(name, font=name_font) / K
    width = chrome + name_w
    if draw_it:
        _pill(draw, x, y, width, CHIP_H, fill)
        cy = y + CHIP_H / 2
        draw.ellipse([px(x + 12), px(cy - 4), px(x + 20), px(cy + 4)], fill=dot_color)
        _text(draw, (px(x + 28), px(cy)), name, name_font, text_color)
        _text(draw, (px(x + 28 + name_w), px(cy)), sev_text, sev_font, (*text_color, 190))
    return width


def _more_chip(draw, x, y, count):
    font = _font(14, bold=True)
    text = f"+{count} more"
    w = 12 + draw.textlength(text, font=font) / K + 12
    _pill(draw, x, y, w, CHIP_H, (255, 255, 255, 34))
    _text(draw, (px(x + 12), px(y + CHIP_H / 2)), text, font, (*MUTED, 235))


def _draw_allergies(draw, allergies, x0, y, right):
    ordered = sorted(allergies, key=lambda a: _SEVERITY_ORDER.get(str(a.severity).lower(), 3))
    x = x0
    for i, a in enumerate(ordered):
        remaining = len(ordered) - i - 1
        reserve = 90 if remaining else 0
        measured = _allergy_chip(draw, x, y, a.allergen, a.severity, draw_it=False)
        if i > 0 and x + measured + reserve > right:
            _more_chip(draw, x, y, len(ordered) - i)
            return
        x += _allergy_chip(draw, x, y, a.allergen, a.severity, right=right - reserve) + 8


def _no_allergy_chip(draw, x, y):
    font = _font(14, bold=True)
    text = "No known allergies on record"
    w = 12 + 16 + 6 + draw.textlength(text, font=font) / K + 12
    _pill(draw, x, y, w, CHIP_H, (52, 211, 153, 40), outline=(52, 211, 153, 110), outline_w=1.1)
    _icon_check(draw, x + 12, y + (CHIP_H - 16) / 2, 16, (110, 231, 183))
    _text(draw, (px(x + 34), px(y + CHIP_H / 2)), text, font, (209, 250, 229))


def _build_qr(system_uid: str, max_px: int) -> Image.Image:
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
    qr.add_data(f"{settings.FRONTEND_URL}{QR_PATH}/{system_uid}")
    qr.make(fit=True)
    qr.box_size = max(1, max_px // qr.modules_count)
    return qr.make_image(fill_color=DEEP, back_color="white").convert("RGB")


def _load_patient_photo(photo_url, size: int):
    if not photo_url:
        return None
    try:
        response = requests.get(photo_url, timeout=8)
        response.raise_for_status()
        img = Image.open(io.BytesIO(response.content)).convert("RGB")
        return ImageOps.fit(img, (size, size), method=Image.LANCZOS)
    except Exception as e:
        print(f"Failed to load patient photo for health card: {e}")
        return None


# ---------------------------------------------------------------------------
# Main card – portrait layout
# ---------------------------------------------------------------------------
def generate_health_card_image(patient, allergies: list) -> Image.Image:
    allergies = allergies or []
    W, H = px(LOGICAL_W), px(LOGICAL_H)
    right = LOGICAL_W - MARGIN
    card = _gradient(W, H)
    d = ImageDraw.Draw(card, "RGBA")

    # Soft sheen
    d.polygon([(px(280), 0), (W, 0), (W, px(200))], fill=(255, 255, 255, 12))

    # ---- Header ----
    d.rounded_rectangle([px(MARGIN), px(28), px(MARGIN + 44), px(72)], radius=px(10), fill=(255, 255, 255, 40))
    _icon_card(d, MARGIN + 10, 38, 22, WHITE)
    _text(d, (px(MARGIN + 56), px(40)), "Uzima Link", _font(22, bold=True), WHITE)
    _spaced(d, MARGIN + 56, 60, "OFFICIAL MEDICAL ID", _font(11), (*MUTED, 210), spacing=1.6)

    # Verified badge – top right, smaller
    badge_font = _font(13, bold=True)
    badge_text = "Verified"
    badge_w = 14 + 16 + 6 + d.textlength(badge_text, font=badge_font) / K + 14
    badge_x = right - badge_w
    _pill(d, badge_x, 34, badge_w, 32, (255, 255, 255, 36), outline=(255, 255, 255, 80))
    _icon_shield(d, badge_x + 12, 40, 18, (209, 250, 229))
    _text(d, (px(badge_x + 34), px(50)), badge_text, badge_font, (236, 253, 245))

    # ---- Avatar + Name block ----
    ax, ay, ad = MARGIN, 92, 78
    d.ellipse([px(ax), px(ay), px(ax + ad), px(ay + ad)], fill=(255, 255, 255, 40))
    photo = _load_patient_photo(getattr(patient, "photo_url", None), px(ad))
    if photo:
        mask = Image.new("L", photo.size, 0)
        ImageDraw.Draw(mask).ellipse([0, 0, photo.size[0] - 1, photo.size[1] - 1], fill=255)
        card.paste(photo, (px(ax), px(ay)), mask)
    else:
        _icon_user(d, ax + 21, ay + 21, 36, WHITE)
    d.ellipse([px(ax), px(ay), px(ax + ad), px(ay + ad)],
              outline=(255, 255, 255, 100), width=max(1, px(2.2)))

    name = _clean(getattr(patient, "full_name", None)) or "Unknown patient"
    size = 24
    name_font = _font(size, bold=True)
    max_name_w = right - (ax + ad + 16)
    while d.textlength(name, font=name_font) / K > max_name_w and size > 16:
        size -= 1
        name_font = _font(size, bold=True)
    _text(d, (px(ax + ad + 16), px(108)), name, name_font, WHITE)

    uid = _clean(getattr(patient, "system_uid", None)) or "N/A"
    _text(d, (px(ax + ad + 16), px(138)), f"ID: {uid}", _font(15, mono=True), (*MUTED, 230))

    # ---- Info pills (wrap to two rows if needed) ----
    pill_y = 188
    pill_x = MARGIN
    gap = 8

    dob = _clean(getattr(patient, "date_of_birth", None)) or "N/A"
    w = _info_pill(d, pill_x, pill_y, _icon_calendar, "DOB:", dob)
    pill_x += w + gap

    gender = _clean(getattr(patient, "gender", None))
    if gender:
        w = _info_pill(d, pill_x, pill_y, _icon_user, "Gender:", gender.title())
        pill_x += w + gap

    blood = _clean(getattr(patient, "blood_group", None)) or _clean(getattr(patient, "blood_type", None))
    if blood:
        # if it doesn't fit on the same line, move to next line
        remaining = right - pill_x
        test_w = 14 + 16 + 7 + d.textlength("Blood: ", font=_font(15)) / K + d.textlength(blood, font=_font(15, bold=True)) / K + 14
        if test_w > remaining and pill_x > MARGIN + 10:
            pill_x = MARGIN
            pill_y += 40
        _info_pill(d, pill_x, pill_y, _icon_pulse, "Blood:", blood)

    # ---- Detail rows (stacked – much better for narrow card) ----
    y = pill_y + 52
    label_font = _font(12, bold=True)
    value_font = _font(16, bold=True)

    def detail_row(label, value, y_pos):
        _spaced(d, MARGIN, y_pos, label, label_font, (*MUTED, 190), spacing=1.4)
        _text(d, (px(MARGIN), px(y_pos + 20)), _fit(d, value, value_font, right - MARGIN), value_font, WHITE)
        return y_pos + 48

    phone = _clean(getattr(patient, "phone_number", None)) or "No phone on record"
    y = detail_row("PHONE", phone, y)

    national_id = _clean(getattr(patient, "national_id", None)) or "Not provided"
    id_label = _id_label(getattr(patient, "id_type", None)).upper()
    y = detail_row(id_label, national_id, y)

    guardian_name = _clean(getattr(patient, "guardian_name", None))
    guardian_phone = _clean(getattr(patient, "guardian_phone", None))
    if guardian_name and guardian_phone:
        guardian = f"{guardian_name} ({guardian_phone})"
    else:
        guardian = guardian_name or guardian_phone or "None on record"
    y = detail_row("GUARDIAN", guardian, y)

    # ---- Allergies ----
    y += 8
    has_allergies = len(allergies) > 0
    _spaced(d, MARGIN, y, "CRITICAL ALLERGIES", label_font,
            (252, 165, 165, 230) if has_allergies else (*MUTED, 190), spacing=1.4)
    y += 22
    if has_allergies:
        _draw_allergies(d, allergies, MARGIN, y, right)
    else:
        _no_allergy_chip(d, MARGIN, y)
    y += 42

    # ---- Divider ----
    d.line([(px(MARGIN), px(y)), (px(right), px(y))],
           fill=(255, 255, 255, 35), width=max(1, px(1.2)))
    y += 18

    # ---- Footer: QR + text ----
    tile = 86
    d.rounded_rectangle([px(MARGIN), px(y), px(MARGIN + tile), px(y + tile)],
                        radius=px(12), fill=WHITE)
    qr_img = _build_qr(uid, px(tile - 14))
    card.paste(
        qr_img,
        (px(MARGIN) + (px(tile) - qr_img.width) // 2,
         px(y) + (px(tile) - qr_img.height) // 2),
    )

    # Text next to QR
    text_x = MARGIN + tile + 16
    mid = y + tile / 2
    _text(d, (px(text_x), px(mid - 14)), "Scan to verify", _font(16, bold=True), WHITE)
    _text(d, (px(text_x), px(mid + 10)), "Emergency clinical records",
          _font(13, italic=True), (*MUTED, 200))

    # ---- Finish ----
    card = card.resize((FINAL_W, FINAL_H), Image.LANCZOS)
    mask = Image.new("L", (FINAL_W * 4, FINAL_H * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, FINAL_W * 4 - 1, FINAL_H * 4 - 1],
        radius=int(CORNER_RADIUS * 1.2 * 4),
        fill=255,
    )
    card.putalpha(mask.resize((FINAL_W, FINAL_H), Image.LANCZOS))
    return card


def image_to_png_bytes(card: Image.Image) -> bytes:
    buf = io.BytesIO()
    card.save(buf, format="PNG", dpi=(300, 300))
    return buf.getvalue()


def image_to_pdf_bytes(card: Image.Image) -> bytes:
    page = Image.new("RGB", card.size, (255, 255, 255))
    page.paste(card, (0, 0), card if card.mode == "RGBA" else None)
    buf = io.BytesIO()
    page.save(buf, format="PDF", resolution=300)
    return buf.getvalue()