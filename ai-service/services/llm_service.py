from groq import AsyncGroq

from config.settings import settings


class LLMService:
    def __init__(self):
        self._main_client = None
        self._router_client = None

    @property
    def main_client(self) -> AsyncGroq:
        if self._main_client is None:
            self._main_client = AsyncGroq(api_key=settings.groq_api_key_main)
        return self._main_client

    @property
    def router_client(self) -> AsyncGroq:
        if self._router_client is None:
            self._router_client = AsyncGroq(api_key=settings.groq_api_key_router)
        return self._router_client

    async def route_query(self, query: str) -> str:
        """Classify query intent: 'rag', 'general', or 'greeting'."""
        response = await self.router_client.chat.completions.create(
            model=settings.router_llm,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a query router. Classify the user's query into exactly one category:\n"
                        "- 'rag': needs information from uploaded documents\n"
                        "- 'general': general knowledge question or task\n"
                        "- 'greeting': a greeting or casual chitchat\n"
                        "Respond with ONLY the category word, nothing else."
                    ),
                },
                {"role": "user", "content": query},
            ],
            temperature=0,
            max_tokens=10,
        )
        route = response.choices[0].message.content.strip().lower()
        if route not in ("rag", "general", "greeting"):
            route = "rag"  # default to RAG for safety
        return route

    async def rewrite_query(self, query: str, history: list[dict]) -> list[str]:
        """Generate multiple query variants for better retrieval."""
        history_text = ""
        if history:
            last_turns = history[-4:]  # last 2 exchanges
            history_text = "\n".join(
                f"{m['role']}: {m['content']}" for m in last_turns
            )

        response = await self.router_client.chat.completions.create(
            model=settings.router_llm,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Generate 3 different search queries to find relevant documents for the user's question. "
                        "Each query should approach the topic from a different angle. "
                        "Output ONLY the queries, one per line, no numbering or prefixes."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Conversation history:\n{history_text}\n\nCurrent question: {query}"
                    if history_text
                    else query,
                },
            ],
            temperature=0.7,
            max_tokens=200,
        )
        queries = [
            q.strip()
            for q in response.choices[0].message.content.strip().split("\n")
            if q.strip()
        ]
        # Always include original query
        return [query] + queries[:3]

    async def generate_stream(self, system_prompt: str, user_message: str, history: list[dict]):
        """Stream response tokens from the main LLM."""
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        stream = await self.main_client.chat.completions.create(
            model=settings.main_llm,
            messages=messages,
            temperature=0.3,
            max_tokens=2048,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    async def compress_context(self, context: str, query: str) -> str:
        """Compress context to fit within token limits."""
        response = await self.router_client.chat.completions.create(
            model=settings.router_llm,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Compress the following context while preserving all information relevant "
                        "to answering the user's question. Remove redundancies and irrelevant details. "
                        "Keep source references intact."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Question: {query}\n\nContext to compress:\n{context}",
                },
            ],
            temperature=0,
            max_tokens=settings.max_context_tokens,
        )
        return response.choices[0].message.content.strip()

    async def generate_simple(self, system_prompt: str, user_message: str, history: list[dict]):
        """Non-streaming generation for greetings/general."""
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        response = await self.main_client.chat.completions.create(
            model=settings.main_llm,
            messages=messages,
            temperature=0.5,
            max_tokens=1024,
        )
        return response.choices[0].message.content


llm_service = LLMService()
