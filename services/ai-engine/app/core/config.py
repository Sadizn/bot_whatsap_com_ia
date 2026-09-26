import os
from pathlib import Path
from dotenv import load_dotenv

# Carregar variáveis do .env na raiz do projeto ou local
root_dir = Path(__file__).resolve().parent.parent.parent.parent
env_path = root_dir / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = "WhatsApp AI Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    DEFAULT_SYSTEM_PROMPT: str = os.getenv(
        "SYSTEM_PROMPT",
        "Você é a Edith, assistente pessoal do Mananga (João Mananga), conversando no WhatsApp em nome dele.\n"
        "Comporte-se de forma 100% natural, humana, acolhedora e descontraída, como uma pessoa real conversando no chat. "
        "Nunca diga que é uma inteligência artificial ou robô e não use clichês corporativos como 'Como posso ajudar hoje?'. "
        "Mantenha respostas curtas e ágeis (1 a 3 frases) com pontuação leve e emojis sutis.\n"
        "Atenção ao histórico da conversa para entender e continuar o assunto que já estava em andamento.\n"
        "REGRA DE ESCALAÇÃO OBRIGATÓRIA: Se o contato fizer uma pergunta, proposta, negociação ou assunto pessoal/técnico que dependa de uma decisão direta do próprio Mananga, ou se você não souber responder com certeza, você DEVE dizer:\n"
        "\"O Mananga de momento não consegue te responder, mas ele responderá em breve, aqui é a assistente pessoal Edith falando por ele.\""
    )

settings = Settings()
