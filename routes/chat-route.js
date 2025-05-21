import express from 'express'
import OpenAI from 'openai'
import { cosineSimilarityNorm, normalizeEmbedding } from '../dist/utils/cosine-similarity.js'
import { authMiddleware } from '../middleware/auth.js'
import { Document } from '../models/documents.js'
import { Chat } from '../models/chat.js'
import { getEmbedding } from '../dist/utils/get-embeding.js'

const router = express.Router()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

router.use(authMiddleware)

router.post('/chat', async (req, res, next) => {
  try {
    const { question } = req.body
    if (!question) {
      throw { status: 400, message: 'Потрібно question.' }
    }

    // Витягуємо всі документи користувача
    const docs = await Document.find({ userId: req.user.id })

    if (!docs.length) {
      return res.json({ reply: 'У вас ще немає бази знань. Завантажте PDF.' })
    }

    const questionEmbeddingRaw = await getEmbedding(question)
    const questionEmbedding = normalizeEmbedding(questionEmbeddingRaw)

    const allChunks = docs.flatMap((doc) => doc.chunks)

    const scoredChunks = allChunks.map(({ text, embedding }) => {
      const score = cosineSimilarityNorm(questionEmbedding, embedding)
      return { text, score }
    })

    const topChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.text)

    const context = topChunks.join('\n---\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content:
            'Відповідай лише на основі наданого контексту. Якщо не знаєш — скажи, що не знаєш. Не вигадуй.',
        },
        {
          role: 'user',
          content: `Контекст:\n${context}\n\nПитання: ${question}`,
        },
      ],
    })

    res.json({ reply: completion.choices[0].message.content })
  } catch (err) {
    next(err)
  }
})
router.post('/chats', async (req, res, next) => {
  try {
    const chat = await Chat.create({
      userId: req.user.id,
      title: req.body?.title || 'Новий чат',
    })

    res.json({ chatId: chat._id, title: chat.title })
  } catch (err) {
    next(err)
  }
})

router.get('/chats', async (req, res, next) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })

    res.json({ data: chats })
  } catch (err) {
    next(err)
  }
})

router.get('/chats/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const chat = await Chat.findById(id)

    if (!chat) {
      return res.status(400).json({ message: 'Чат не знайдено або немає доступу' })
    }

    res.json(chat)
  } catch (err) {
    next(err)
  }
})

router.put('/chats/:id', async (req, res, next) => {
  try {
    const { title } = req.body
    const { id } = req.params

    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: 'Некоректна назва чату' })
    }

    const chat = await Chat.findById(id)

    if (!chat || chat.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Чат не знайдено або немає доступу' })
    }

    chat.title = title.trim()

    await chat.save()

    res.json({ chat })
  } catch (err) {
    next(err)
  }
})

router.delete('/chats/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const chat = await Chat.findById(id)

    if (!chat || chat.userId.toString() !== req.user.id) {
      throw { status: 404, message: 'Чат не знайдено або немає доступу' }
    }

    await Chat.findByIdAndDelete(id)

    res.json({ message: 'Чат видалено успішно' })
  } catch (err) {
    next(err)
  }
})

router.get('/status', async (req, res, next) => {
  try {
    const count = await Document.countDocuments({ userId: req.user.id })
    res.json({ count })
  } catch (err) {
    next(err)
  }
})

router.delete('/reset', async (req, res, next) => {
  try {
    await Document.deleteMany({ userId: req.user.id })
    res.json({ message: 'Базу знань очищено.' })
  } catch (err) {
    next(err)
  }
})

export default router
