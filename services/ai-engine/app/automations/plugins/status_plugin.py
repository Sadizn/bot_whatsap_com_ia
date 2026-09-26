from typing import Optional, Dict, Any
from datetime import datetime
from app.automations.base import BaseAutomation

class StatusAutomation(BaseAutomation):
    @property
    def id(self) -> str:
        return "system_status"

    @property
    def name(self) -> str:
        return "Verificação de Status do Sistema"

    @property
    def description(self) -> str:
        return "Responde a comandos como '!status' ou '!ping' informando a saúde do bot."

    def can_handle(self, text: str, context: Optional[Dict[str, Any]] = None) -> bool:
        t = text.strip().lower()
        return t in ["!status", "!ping", "ping", "/status"]

    async def execute(self, text: str, user_id: str, context: Optional[Dict[str, Any]] = None) -> str:
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        return (
            f"🤖 *Status do Sistema*: ONLINE 🟢\n"
            f"⏱️ *Data/Hora*: {now_str}\n"
            f"🧠 *Motor de IA*: Ativo\n"
            f"✨ Digite qualquer pergunta para conversar com a IA!"
        )
