from dotenv import load_dotenv
import os
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

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

# Пошук по запиту
query = sys.argv[1] if len(sys.argv) > 1 else ""
if not query:
    print("⚠️ Порожній запит")
    sys.exit(1)

results = collection.query(query_texts=[query], n_results=3)

# Вивід знайдених фрагментів
chunks = results.get("documents", [[]])[0]
print("\n---\n".join(chunks))
