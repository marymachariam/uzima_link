import requests

OPENFDA_URL = "https://api.fda.gov/drug/label.json"


def fetch_drug_info(name: str) -> dict | None:
    """
    Queries openFDA's real drug label database by brand or generic name.
    Returns None if nothing is found — never invents an answer.
    """
    params = {"search": f'openfda.brand_name:"{name}" openfda.generic_name:"{name}"', "limit": 1}
    try:
        response = requests.get(OPENFDA_URL, params=params, timeout=8)
        response.raise_for_status()
        data = response.json()
    except Exception:
        return None

    results = data.get("results")
    if not results:
        return None

    result = results[0]
    openfda = result.get("openfda", {})

    return {
        "generic_name": ", ".join(openfda.get("generic_name", [])) or None,
        "brand_name": ", ".join(openfda.get("brand_name", [])) or None,
        "purpose": " ".join(result.get("purpose", [])) or " ".join(result.get("indications_and_usage", [])) or None,
        "warnings": " ".join(result.get("warnings", [])) or None,
        "dosage_info": " ".join(result.get("dosage_and_administration", [])) or None,
    }