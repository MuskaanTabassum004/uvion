from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from yuvi_engine import generate_yuvi_response
from firestore_client import FirestoreClient

router = APIRouter()
firestore_client = FirestoreClient()

class ChatMessage(BaseModel):
    role: str
    content: str

class YuviChatRequest(BaseModel):
    user_id: str = "guest"
    message: str
    history: List[ChatMessage] = []
    farm_state: Dict[str, Any] = {}

@router.post("/api/v1/yuvi/chat")
async def chat_with_yuvi(request: YuviChatRequest):
    """
    Endpoint for the YUVI AI Farm Assistant.
    """
    try:
        # Fetch recent actions from DB (Memory 1 supplement)
        recent_actions = firestore_client.get_recent_user_actions(request.user_id, limit=5)
        
        # Call the YUVI Engine
        response_text = generate_yuvi_response(
            user_message=request.message,
            chat_history=[{"role": m.role, "content": m.content} for m in request.history],
            farm_state=request.farm_state,
            recent_actions=recent_actions
        )
        
        return {
            "status": "success",
            "reply": response_text
        }
    except Exception as e:
        print(f"YUVI Route Error: {e}")
        raise HTTPException(status_code=500, detail="YUVI encountered an internal error.")
