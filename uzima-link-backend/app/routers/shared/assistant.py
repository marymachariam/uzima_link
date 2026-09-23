from fastapi import APIRouter

import app.services.assistant_service as assistant_service
import app.schemas as schemas

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/chat", response_model=schemas.AssistantChatResponse)
def chat(data: schemas.AssistantChatRequest):
    reply = assistant_service.ask_assistant(data.message)
    return schemas.AssistantChatResponse(reply=reply)