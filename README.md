# 🧠 GPT-RAG бот із підтримкою PDF + SessionId + S3 + Auto-Cleanup

Цей проєкт — готовий до деплою GPT-базований чат-бот, який:
- працює тільки на основі локальної бази знань
- дозволяє завантажити кілька PDF в межах однієї сесії
- очищає всі файли через 24 години

## 📦 Технології
- Node.js (Express)
- Python (OpenAI Embedding + Cosine Similarity)
- AWS S3 (для PDF)
- Render (хостинг)
- OpenAI API



```mermaid
graph TD
    A[👤 Користувач відкриває сайт] --> B{SessionId існує?}
B -- Ні --> C[Генеруємо новий sessionId та зберігаємо в localStorage]
B -- Так --> D[Використовуємо існуючий sessionId]

D --> E[⬆️ Завантаження PDF через /upload]
C --> E

E --> F[💾 Зберігаємо PDF в S3 pdfs/user_sessionId/...]
F --> G[📄 Витягуємо текст з PDF]
G --> H[🧩 Ділимо на фрагменти по 500 симв.]
H --> I[📁 Додаємо до user_data/user_sessionId.json]

A --> J[❓ Користувач ставить питання POST /api/chat]
J --> K[🚀 Node запускає retrieve.py з question + sessionId]
K --> L[🐍 Python читає user_data/user_sessionId.json]
L --> M[📡 Отримує embedding з OpenAI]
M --> N[🧠 Пошук схожих фрагментів cosine similarity]
N --> O[📦 Повернення top-3 фрагментів у Node]
O --> P[🤖 GPT генерує відповідь на основі контексту]
P --> Q[📤 Відправка відповіді користувачу]

subgraph Автоочистка
R[🧹 Перевірка user_data/ кожні 60 хв]
R --> S[🗑 Видалення json-файлів >24 год]
T[📅 S3 lifecycle rule] --> U[🗑 Автовидалення PDF через 1 день]
end

```

