import time
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

class ConversationStore:
    def __init__(self, ttl_seconds: int = 86400 * 7, max_messages_per_user: int = 20):
        """
        Armazenamento de histórico e memória de conversas.
        TTL padrão: 7 dias de retenção de contexto.
        """
        self.ttl = ttl_seconds
        self.max_messages = max_messages_per_user
        
        # Diretório para persistência em disco
        self.data_dir = Path(__file__).resolve().parent.parent.parent / "data"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.storage_file = self.data_dir / "chat_history.json"
        
        self._conversations: Dict[str, dict] = self._load_from_disk()

    def _load_from_disk(self) -> Dict[str, dict]:
        if self.storage_file.exists():
            try:
                with open(self.storage_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Erro ao carregar chat_history.json: {e}")
        return {}

    def _save_to_disk(self):
        try:
            with open(self.storage_file, "w", encoding="utf-8") as f:
                json.dump(self._conversations, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Erro ao salvar chat_history.json: {e}")

    def get_last_interaction_id(self, user_id: str) -> Optional[str]:
        if user_id in self._conversations:
            return self._conversations[user_id].get("interaction_id")
        return None

    def set_last_interaction_id(self, user_id: str, interaction_id: str):
        if user_id not in self._conversations:
            self._conversations[user_id] = {
                "last_active": time.time(),
                "messages": []
            }
        self._conversations[user_id]["last_active"] = time.time()
        self._conversations[user_id]["interaction_id"] = interaction_id
        self._save_to_disk()

    def add_message(self, user_id: str, role: str, text: str, user_name: Optional[str] = None):
        """
        Registra uma mensagem (user ou assistant) no histórico persistente do usuário.
        """
        if user_id not in self._conversations:
            self._conversations[user_id] = {
                "last_active": time.time(),
                "user_name": user_name or "Contato",
                "messages": []
            }
        
        entry = self._conversations[user_id]
        entry["last_active"] = time.time()
        if user_name:
            entry["user_name"] = user_name
            
        if "messages" not in entry:
            entry["messages"] = []

        entry["messages"].append({
            "role": role,
            "text": text,
            "timestamp": time.time()
        })

        # Manter apenas as últimas max_messages
        if len(entry["messages"]) > self.max_messages:
            entry["messages"] = entry["messages"][-self.max_messages:]

        self._save_to_disk()

    def get_history_context(self, user_id: str, max_turns: int = 10) -> str:
        """
        Gera um resumo formatado do histórico recente para enriquecer o prompt da IA.
        """
        if user_id not in self._conversations:
            return ""
            
        messages = self._conversations[user_id].get("messages", [])
        if not messages:
            return ""

        # Pega as últimas N mensagens (exceto a que acabou de chegar)
        recent = messages[-max_turns:]
        lines = []
        for m in recent:
            author = "Contato" if m.get("role") == "user" else "Edith"
            lines.append(f"{author}: {m.get('text', '')}")

        return "\n".join(lines)

    def get_all_conversations(self) -> List[dict]:
        """
        Retorna lista de conversas ativas com última mensagem para exibição no Dashboard.
        """
        result = []
        for uid, data in self._conversations.items():
            msgs = data.get("messages", [])
            last_msg = msgs[-1] if msgs else {}
            result.append({
                "user_id": uid,
                "user_name": data.get("user_name", "Contato"),
                "last_active": data.get("last_active", 0),
                "messages_count": len(msgs),
                "last_message": last_msg.get("text", ""),
                "last_role": last_msg.get("role", "")
            })
        result.sort(key=lambda x: x["last_active"], reverse=True)
        return result

    def clear(self, user_id: str):
        if user_id in self._conversations:
            del self._conversations[user_id]
            self._save_to_disk()

conversation_store = ConversationStore()
