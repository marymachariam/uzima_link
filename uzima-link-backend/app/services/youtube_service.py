import os
import requests

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


def find_explainer_video(drug_name: str) -> str | None:
    """
    Searches YouTube for an explainer video about the given drug.
    Returns a video URL, or None if nothing found or the API key is missing.
    """
    if not YOUTUBE_API_KEY or not drug_name:
        return None

    try:
        resp = requests.get(
            YOUTUBE_SEARCH_URL,
            params={
                "part": "snippet",
                "q": f"{drug_name} medicine explained",
                "type": "video",
                "maxResults": 1,
                "safeSearch": "strict",
                "key": YOUTUBE_API_KEY,
            },
            timeout=5,
        )
        resp.raise_for_status()
        items = resp.json().get("items", [])
        if items:
            video_id = items[0]["id"]["videoId"]
            return f"https://www.youtube.com/watch?v={video_id}"
    except requests.RequestException:
        return None

    return None