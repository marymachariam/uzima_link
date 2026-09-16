import requests

DAILYMED_BASE = "https://dailymed.nlm.nih.gov/dailymed/services/v2"


def fetch_drug_info(name: str) -> dict | None:
    try:
        resp = requests.get(
            f"{DAILYMED_BASE}/spls.json", params={"drug_name": name}, timeout=5
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException:
        return None

    entries = data.get("data") or []
    if not entries:
        return None

    entry = entries[0]
    return {
        "generic_name": entry.get("title"),
        "brand_name": None,
        "purpose": None,
        "warnings": None,
        "dosage_info": None,
    }