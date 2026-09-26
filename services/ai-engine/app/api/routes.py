import logging
from fastapi import APIRouter, HTTPException
from app.api.models import ChatRequest, ChatResponse, ClearMemoryRequest, HealthResponse
from app.core.config import settings
from app.memory.conversation_store import conversation_store
from app.providers.gemini_provider import gemini_provider
from app.automations.registry import automation_registry

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        gemini_configured=bool(settings.GEMINI_API_KEY),
        automations_count=len(automation_registry.get_all())
    )

@router.get("/automations")
async def list_automations():
    return {
        "automations": automation_registry.get_all()
    }

@router.get("/conversations")
async def list_conversations():
    return {
        "conversations": conversation_store.get_all_conversations()
    }

@router.post("/chat", response_model=ChatResponse)
async def process_chat(req: ChatRequest):
    user_id = req.user_id
    message_text = (req.message or "").strip()

    if not message_text and not req.media:
        raise HTTPException(status_code=400, detail="Mensagem ou mídia deve ser fornecida.")

    # 1. Tentar acionar primeiro qualquer automação registrada (apenas se for texto)
    if message_text:
        automation_result = await automation_registry.process(
            text=message_text,
            user_id=user_id,
            context={
                "user_name": req.user_name,
                "is_group": req.is_group,
                **req.metadata
            }
        )

        if automation_result:
            # Registra no histórico
            conversation_store.add_message(user_id=user_id, role="user", text=message_text, user_name=req.user_name)
            conversation_store.add_message(user_id=user_id, role="assistant", text=automation_result, user_name="Edith")
            return ChatResponse(
                reply=automation_result,
                source="automation",
                user_id=user_id
            )

    # 2. Resgatar contexto recente de conversas anteriores
    history_context = conversation_store.get_history_context(user_id)
    prev_id = conversation_store.get_last_interaction_id(user_id)

    # 3. Processar via IA (Gemini com suporte a texto, áudio, imagens e histórico)
    reply_text, new_interaction_id = await gemini_provider.generate_response(
        prompt=message_text,
        user_id=user_id,
        media=req.media,
        history_context=history_context,
        previous_interaction_id=prev_id,
        system_instruction=req.system_prompt or settings.DEFAULT_SYSTEM_PROMPT,
        model=req.model or settings.DEFAULT_MODEL
    )

    # 4. Registrar mensagens no histórico persistente
    incoming_text = message_text
    if req.media:
        tag = "[Áudio de voz]" if (req.media.type == "audio" or "audio" in req.media.mime_type) else "[Foto/Imagem]"
        incoming_text = f"{tag} {message_text}".strip()

    conversation_store.add_message(user_id=user_id, role="user", text=incoming_text, user_name=req.user_name)
    conversation_store.add_message(user_id=user_id, role="assistant", text=reply_text, user_name="Edith")

    if new_interaction_id:
        conversation_store.set_last_interaction_id(user_id, new_interaction_id)

    return ChatResponse(
        reply=reply_text,
        source="ai_gemini",
        user_id=user_id
    )

@router.post("/memory/clear")
async def clear_memory(req: ClearMemoryRequest):
    conversation_store.clear(req.user_id)
    return {"message": f"Histórico de conversas do usuário {req.user_id} limpo com sucesso."}
