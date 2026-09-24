import base64
import os

from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

VISION_MODEL = "llama-3.2-11b-vision-preview"


def extract_drug_name_candidate(image_bytes: bytes) -> str | None:
    """
    Sends the image directly to a Groq vision model and asks it to identify
    the drug name from the packaging. Returns the drug name string, or None
    if nothing could be identified.
    """
    try:
        b64_image = base64.b64encode(image_bytes).decode("utf-8")

        response = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Look at this photo of a medicine package or pill. "
                                "Identify the drug/medicine name shown on it. "
                                "Reply with ONLY the drug name (brand or generic), "
                                "nothing else. If you cannot identify a drug name, "
                                "reply with exactly: UNKNOWN"
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"},
                        },
                    ],
                }
            ],
            temperature=0,
            max_tokens=50,
        )

        answer = response.choices[0].message.content.strip()

        if not answer or answer.upper() == "UNKNOWN":
            return None

        return answer

    except Exception:
        return None
