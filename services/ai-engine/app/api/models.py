from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class MediaPayload(BaseModel):
    data: str = Field(..., description="Dados da mídia em Base64")
    mime_type: str = Field(..., description="MIME type da mídia (ex: image/jpeg, audio/ogg)")
    type: str = Field("unknown", description="Tipo de mídia: 'image', 'audio', etc.")

class ChatRequest(BaseModel):
    user_id: str = Field(..., description="Identificador único do usuário do WhatsApp (número/JID)")
    message: Optional[str] = Field("", description="Texto da mensagem enviada pelo usuário")
    media: Optional[MediaPayload] = Field(None, description="Mídia anexada (áudio ou imagem em base64)")
    user_name: Optional[str] = Field(None, description="Nome de exibição do usuário se disponível")
    is_group: bool = Field(False, description="Indica se a mensagem veio de um grupo")
    system_prompt: Optional[str] = Field(None, description="Instruções de sistema customizadas")
    model: Optional[str] = Field(None, description="Modelo de IA solicitado")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadados extras")

class ChatResponse(BaseModel):
    reply: str
    source: str = Field(..., description="Origem da resposta: 'automation' ou 'ai_gemini'")
    automation_id: Optional[str] = None
    user_id: str

class ClearMemoryRequest(BaseModel):
    user_id: str

class HealthResponse(BaseModel):
    status: str
    version: str
    gemini_configured: bool
    automations_count: int
