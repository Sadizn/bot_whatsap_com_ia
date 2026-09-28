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

    # 3. Determinar System Prompt específico (Chat Privado vs Grupo)
    default_prompt = settings.DEFAULT_GROUP_SYSTEM_PROMPT if req.is_group else settings.DEFAULT_SYSTEM_PROMPT
    prompt_to_use = req.system_prompt or default_prompt

    # 4. Processar via IA (Gemini com suporte a texto, áudio, imagens e histórico)
    reply_text, new_interaction_id = await gemini_provider.generate_response(
        prompt=message_text,
        user_id=user_id,
        media=req.media,
        history_context=history_context,
        previous_interaction_id=prev_id,
        system_instruction=prompt_to_use,
        model=req.model or settings.DEFAULT_MODEL,
        api_key=req.api_key
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

from pydantic import BaseModel

class MusicResolveRequest(BaseModel):
    query: str

@router.post("/music/resolve")
async def resolve_music(req: MusicResolveRequest):
    query = (req.query or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query de busca vazia.")
    
    import yt_dlp
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'default_search': 'ytsearch1'
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(query, download=False)
            if info and 'entries' in info and len(info['entries']) > 0:
                info = info['entries'][0]
            
            if not info:
                raise HTTPException(status_code=404, detail="Nenhum resultado encontrado.")
            
            return {
                "success": True,
                "title": info.get("title") or query,
                "artist": info.get("uploader") or info.get("channel") or "YouTube Music",
                "duration": info.get("duration_string") or "03:30",
                "views": str(info.get("view_count", "")),
                "url": info.get("webpage_url") or query,
                "thumbnail": info.get("thumbnail"),
                "audioUrl": info.get("url")
            }
    except Exception as e:
        logger.error(f"Erro ao extrair áudio com yt-dlp: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao extrair áudio: {str(e)}")

