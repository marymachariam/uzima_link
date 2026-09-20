import os
import requests
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

_video_cache: dict[str, str] = {} 


def find_explainer_video(drug_name: str) -> str | None:
    """
    Searches YouTube for an explainer video about the given drug.
    Returns a video URL, or None if nothing found or the API key is missing.
    """
    if not YOUTUBE_API_KEY or not drug_name:
        return None

    cache_key = drug_name.lower().strip()
    if cache_key in _video_cache:
        return _video_cache[cache_key]

    try:
        resp = requests.get(
            YOUTUBE_SEARCH_URL,
            params={
                "part": "snippet",
                "q": f"{drug_name} medicine explained",
                "type": "video",
                "videoEmbeddable": "true",
                "maxResults": 1,
                "safeSearch": "strict",
                "key": YOUTUBE_API_KEY,
            },
            timeout=5,
        )
        resp.raise_for_status()
        items = resp.json().get("items", [])
        if items:
            url = f"https://www.youtube.com/watch?v={items[0]['id']['videoId']}"
            _video_cache[cache_key] = url
            return url
    except (requests.RequestException, KeyError, IndexError, ValueError):
        return None

    return None