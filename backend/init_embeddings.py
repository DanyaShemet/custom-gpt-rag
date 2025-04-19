from dotenv import load_dotenv
import os
import chromadb
from chromadb.utils import embedding_functions

# Завантаження змінних із .env
load_dotenv()
openai_key = os.getenv("CHROMA_OPENAI_API_KEY")

if not openai_key:
    raise ValueError("CHROMA_OPENAI_API_KEY is not встановлений у .env")

# Ініціалізація ChromaDB
client = chromadb.PersistentClient(path="backend/chroma_index")
embedding_function = embedding_functions.OpenAIEmbeddingFunction(api_key=openai_key)
collection = client.get_or_create_collection("faq", embedding_function=embedding_function)

# Завантаження бази знань
with open("backend/knowledge/faq.txt", "r", encoding="utf-8") as f:
    lines = f.read().split("\n\n")  # кожен абзац = окремий документ

# Додавання документів до Chroma
for i, doc in enumerate(lines):
    if doc.strip():
        collection.add(documents=[doc], ids=[str(i)])

print(f"✅ Імпортовано {len(lines)} фрагментів у ChromaDB")
