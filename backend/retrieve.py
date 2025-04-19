from dotenv import load_dotenv
import os
import sys

# 🔧 Примусове кодування stdout у UTF-8 (для Windows)
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

import chromadb
from chromadb.utils import embedding_functions

# Завантаження .env
load_dotenv()
openai_key = os.getenv("CHROMA_OPENAI_API_KEY")

if not openai_key:
    raise ValueError("CHROMA_OPENAI_API_KEY is not встановлений у .env")

# Перевірка аргументів
if len(sys.argv) < 3:
    print("⚠️ Необхідно передати question і sessionId")
    sys.exit(1)

question = sys.argv[1]
session_id = sys.argv[2]
collection_name = f"user_{session_id}"

# Ініціалізація клієнта
client = chromadb.PersistentClient(path="backend/chroma_index")
embedding_function = embedding_functions.OpenAIEmbeddingFunction(api_key=openai_key)

# Отримання колекції
try:
    collection = client.get_collection(name=collection_name, embedding_function=embedding_function)
except Exception:
    print("⚠️ Колекцію не знайдено або вона порожня.")
    sys.exit(0)

# Запит
results = collection.query(query_texts=[question], n_results=3)
chunks = results.get("documents", [[]])[0]

# Вивід фрагментів
print("\n---\n".join(chunks))
