from fastapi import APIRouter

from app import schemas
from app.services import assistant_service

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/chat", response_model=schemas.AssistantChatResponse)
def chat(data: schemas.AssistantChatRequest):
    reply = assistant_service.ask_assistant(data.message)
    return schemas.AssistantChatResponse(reply=reply)
