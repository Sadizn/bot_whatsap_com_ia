import logging
from typing import Dict, List, Optional, Any
from app.automations.base import BaseAutomation

logger = logging.getLogger(__name__)

class AutomationRegistry:
    def __init__(self):
        self._automations: Dict[str, BaseAutomation] = {}

    def register(self, automation: BaseAutomation):
        self._automations[automation.id] = automation
        logger.info(f"Automação registrada: {automation.name} ({automation.id})")

    def unregister(self, automation_id: str):
        if automation_id in self._automations:
            del self._automations[automation_id]

    def get_all(self) -> List[dict]:
        return [
            {
                "id": a.id,
                "name": a.name,
                "description": a.description
            }
            for a in self._automations.values()
        ]

    async def process(self, text: str, user_id: str, context: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Percorre as automações registradas. Se alguma for acionada (can_handle == True),
        executa e retorna o resultado. Se nenhuma for acionada, retorna None.
        """
        for automation in self._automations.values():
            try:
                if automation.can_handle(text, context):
                    logger.info(f"Executando automação '{automation.name}' para {user_id}")
                    return await automation.execute(text, user_id, context)
            except Exception as e:
                logger.error(f"Erro ao executar automação {automation.id}: {e}")
        return None

automation_registry = AutomationRegistry()
