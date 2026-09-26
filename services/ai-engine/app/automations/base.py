from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class BaseAutomation(ABC):
    """
    Classe base para todas as automações do bot.
    Qualquer nova funcionalidade automatizada (agendamento, scraping, CRM, etc.)
    pode herdar desta classe e registrar-se no AutomationRegistry.
    """
    
    @property
    @abstractmethod
    def id(self) -> str:
        """Identificador único da automação (ex: 'reminder_automation')"""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Nome legível para humanos (ex: 'Agendador de Lembretes')"""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Descrição de o que a automação faz"""
        pass

    @abstractmethod
    def can_handle(self, text: str, context: Optional[Dict[str, Any]] = None) -> bool:
        """Verifica se esta automação deve processar a mensagem recebida"""
        pass

    @abstractmethod
    async def execute(self, text: str, user_id: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Executa a lógica da automação e retorna a resposta que será enviada de volta ao WhatsApp"""
        pass
