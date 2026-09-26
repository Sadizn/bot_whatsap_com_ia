import logging
import base64
from typing import Optional, List, Any
from app.core.config import settings
from app.api.models import MediaPayload

logger = logging.getLogger(__name__)

# Modelos recomendados em ordem de disponibilidade, velocidade e quotas
RECOMMENDED_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.7-flash"
]

class GeminiProvider:
    def __init__(self):
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY não configurada no .env ou configurações.")
            return

        try:
            from google import genai
            self.client = genai.Client(api_key=api_key)
            logger.info("Cliente Google GenAI inicializado com sucesso.")
        except ImportError:
            logger.error("Pacote google-genai não instalado.")
        except Exception as e:
            logger.error(f"Erro ao inicializar cliente Google GenAI: {e}")

    async def generate_response(
        self,
        prompt: str,
        user_id: Optional[str] = None,
        media: Optional[MediaPayload] = None,
        history_context: Optional[str] = None,
        previous_interaction_id: Optional[str] = None,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None
    ) -> tuple[str, Optional[str]]:
        """
        Gera resposta inteligente usando Google Gemini com suporte a:
        - Conversação multi-turno e histórico de contexto
        - Multimodal nativo (Áudios PTT e Imagens do WhatsApp)
        - Failover automático entre modelos (3.5-flash-lite / 3.8-flash)
        """
        if not self.client and settings.GEMINI_API_KEY:
            self._initialize_client()

        if not self.client:
            return (
                "Opa! Parece que a chave da API do Gemini ainda não foi configurada. "
                "Configure-a no arquivo .env ou pelo Dashboard.",
                None
            )

        from google.genai import types

        instruction = system_instruction or settings.DEFAULT_SYSTEM_PROMPT

        # Montar lista de modelos candidatos
        requested = model or settings.DEFAULT_MODEL
        if any(v in requested for v in ["2.5", "2.0", "1.5"]):
            requested = "gemini-3.5-flash-lite"

        candidate_models = [requested]
        for m in RECOMMENDED_MODELS:
            if m not in candidate_models:
                candidate_models.append(m)

        # Preparar conteúdos
        contents = []

        # 1. Se houver mídia (imagem ou áudio)
        if media and media.data:
            try:
                media_bytes = base64.b64decode(media.data)
                part = types.Part.from_bytes(data=media_bytes, mime_type=media.mime_type)
                contents.append(part)
                logger.info(f"Mídia decodificada com sucesso: {media.type} ({media.mime_type}, {len(media_bytes)} bytes)")
            except Exception as e:
                logger.error(f"Erro ao decodificar mídia Base64: {e}")

        # 2. Injetar histórico recente da conversa para manter a continuidade do assunto
        if history_context and history_context.strip():
            contents.append(
                f"[Histórico recente desta conversa para seu contexto]:\n{history_context.strip()}\n"
                f"[Fim do histórico recente]"
            )

        # 3. Adicionar o texto/pergunta do usuário
        clean_prompt = prompt.strip() if prompt else ""
        if clean_prompt:
            contents.append(f"Contato: {clean_prompt}")
        elif media:
            if "audio" in media.mime_type or media.type == "audio":
                contents.append("Por favor, ouça este áudio e responda como a Edith no WhatsApp.")
            else:
                contents.append("Por favor, veja esta imagem enviada pelo contato e responda como a Edith no WhatsApp.")

        for current_model in candidate_models:
            try:
                config = types.GenerateContentConfig(
                    system_instruction=instruction,
                    temperature=0.7
                )

                response = self.client.models.generate_content(
                    model=current_model,
                    contents=contents,
                    config=config
                )

                if response and response.text:
                    return response.text.strip(), None

            except Exception as e:
                err_msg = str(e)
                logger.warning(f"Tentativa com modelo '{current_model}' falhou: {err_msg}")
                # Continua o loop para o próximo modelo candidato (ex: gemini-3.5-flash-lite se o 3.8 bater quota)

        logger.error("Todos os modelos candidatos falharam na geração de resposta.")
        return (
            "Opa, deu uma oscilação aqui na minha conexão agora há pouco. Pode me mandar de novo?",
            None
        )

gemini_provider = GeminiProvider()
