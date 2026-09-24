from datetime import datetime

import requests

from app.repository import facility_repository

KMHFR_API_URL = "https://api.kmhfr.health.go.ke/api/facilities/facilities/"


def sync_facilities_from_kmhfr(db, max_pages: int = 5):
    """
    Pulls facilities from the live KMHFR API and upserts them locally.
    Runs on a daily schedule (see main.py) so facility data stays current
    without you manually pushing anything.
    """
    page = 1
    total_synced = 0

    while page <= max_pages:
        try:
            response = requests.get(
                KMHFR_API_URL, params={"page": page, "page_size": 100}, timeout=15
            )
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"KMHFR sync failed on page {page}: {e}")
            break

        results = data.get("results", [])
        if not results:
            break

        for item in results:
            kmhfr_code = str(item.get("code") or item.get("id"))
            name = item.get("name")
            facility_type = (
                item.get("facility_type", {}).get("name")
                if isinstance(item.get("facility_type"), dict)
                else item.get("facility_type")
            )
            county = (
                item.get("county", {}).get("name")
                if isinstance(item.get("county"), dict)
                else item.get("county")
            )
            sub_county = (
                item.get("sub_county", {}).get("name")
                if isinstance(item.get("sub_county"), dict)
                else item.get("sub_county")
            )

            if not kmhfr_code or not name:
                continue

            existing = facility_repository.get_facility_by_kmhfr_code(db, kmhfr_code)
            if existing:
                facility_repository.update_facility_from_sync(
                    db,
                    existing,
                    name=name,
                    facility_type=facility_type,
                    county=county,
                    sub_county=sub_county,
                )
            else:
                facility_repository.create_facility(
                    db,
                    name=name,
                    kmhfr_code=kmhfr_code,
                    facility_type=facility_type,
                    county=county,
                    sub_county=sub_county,
                    source="kmhfr_sync",
                )
            total_synced += 1

        page += 1

    print(
        f"KMHFR sync complete: {total_synced} facilities processed at {datetime.utcnow().isoformat()}"
    )
    return total_synced
