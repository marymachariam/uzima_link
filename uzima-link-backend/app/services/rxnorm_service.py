import requests

RXNORM_BASE = "https://rxnav.nlm.nih.gov/REST"


def fetch_drug_info(name: str) -> dict | None:
    try:
        resp = requests.get(
            f"{RXNORM_BASE}/drugs.json", params={"name": name}, timeout=5
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException:
        return None

    groups = data.get("drugGroup", {}).get("conceptGroup") or []
    for group in groups:
        for concept in group.get("conceptProperties", []):
            return {
                "generic_name": concept.get("name"),
                "brand_name": None,
                "purpose": None,
                "warnings": None,
                "dosage_info": None,
            }
    return None
