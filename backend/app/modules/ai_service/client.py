"""LLM client.

Two providers behind one interface so the same prompts run locally and in the
cloud: Ollama for local dev (free, offline) and Groq for deployment, where a
laptop's localhost:11434 is unreachable. Both make real, dynamic model calls —
nothing here returns canned text.

Pick one with LLM_PROVIDER=ollama|groq in .env.
"""

import httpx

from app.core.config import settings


class LLMError(RuntimeError):
    """Raised when the upstream model cannot be reached or refuses the call."""


class OllamaClient:
    """Local Llama 3 via the Ollama daemon's native /api/generate endpoint."""

    provider = "ollama"

    def __init__(self, base_url: str | None = None, model: str | None = None):
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self.model = model or settings.ollama_model

    async def generate(self, prompt: str, system: str | None = None, *, format_json: bool = False) -> str:
        payload = {"model": self.model, "prompt": prompt, "stream": False}
        if system:
            payload["system"] = system
        if format_json:
            payload["format"] = "json"

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            return response.json().get("response", "")


class GroqClient:
    """Groq's OpenAI-compatible chat completions API, used in deployment."""

    provider = "groq"

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or settings.groq_api_key
        self.model = model or settings.groq_model
        self.base_url = settings.groq_base_url.rstrip("/")

    async def generate(self, prompt: str, system: str | None = None, *, format_json: bool = False) -> str:
        if not self.api_key:
            raise LLMError("GROQ_API_KEY is not set — the AI layer cannot reach a model.")

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {"model": self.model, "messages": messages, "temperature": 0.4}
        if format_json:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            response.raise_for_status()
            data = response.json()

        return data["choices"][0]["message"]["content"]


def build_client():
    if settings.llm_provider.lower() == "groq":
        return GroqClient()
    return OllamaClient()


llm_client = build_client()

# Back-compat alias: older modules imported this name directly.
ollama_client = llm_client
