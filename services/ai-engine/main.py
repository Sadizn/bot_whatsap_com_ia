import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router as api_router
from app.automations.registry import automation_registry
from app.automations.plugins.status_plugin import StatusAutomation

# Configuração de Logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_engine")

# Inicialização do App FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Motor assíncrono de Inteligência Artificial e Automações para WhatsApp"
)

# Configuração de CORS (permite que o Dashboard e Gateway acessem)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar plugins de automação padrão
automation_registry.register(StatusAutomation())

# Rotas
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router)  # Também acessível sem prefixo para conveniência

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
