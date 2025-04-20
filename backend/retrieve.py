from dotenv import load_dotenv
import os
import sys
import json
import numpy as np
from openai import OpenAI

# 🔧 Примусове кодування stdout у UTF-8 (для Windows)
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Завантаження .env
load_dotenv()
openai_key = os.getenv("OPENAI_API_KEY")

if not openai_key:
    raise ValueError("OPENAI_API_KEY не встановлений у .env")

# Перевірка аргументів
if len(sys.argv) < 3:
    print("⚠️ Необхідно передати question і sessionId")
    sys.exit(1)

question = sys.argv[1]
session_id = sys.argv[2]
file_path = f"user_data/user_{session_id}.json"

# ⛔ Якщо база знань порожня або не існує
if not os.path.exists(file_path):
    print("")
    sys.exit(0)

# 🧠 Читання бази знань
with open(file_path, "r", encoding="utf-8") as f:
    chunks = json.load(f)

# 📦 Підключення до OpenAI
client = OpenAI(api_key=openai_key)

# 🔎 Отримання embedding запиту
question_embedding = client.embeddings.create(
    model="text-embedding-3-small",
    input=question
).data[0].embedding

# 🔁 Косинусна схожість
def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

# 🧠 Пошук найбільш релевантних фрагментів
scored_chunks = []
for chunk in chunks:
    chunk_embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=chunk
    ).data[0].embedding

    score = cosine_similarity(question_embedding, chunk_embedding)
    scored_chunks.append((score, chunk))

scored_chunks.sort(reverse=True, key=lambda x: x[0])
top_chunks = [c[1] for c in scored_chunks[:3]]

# 🧾 Вивід
print("\n---\n".join(top_chunks))
