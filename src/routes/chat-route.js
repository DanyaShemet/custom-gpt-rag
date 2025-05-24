import express from 'express'
import OpenAI from 'openai'
import { authMiddleware } from '../middleware/auth.js'
import { Document } from '../models/documents.js'
import { Chat } from '../models/chat.js'
import { getEmbedding } from '../utils/get-embeding.js'
import { cosineSimilarityNorm, normalizeEmbedding } from '../utils/cosine-similarity.js'
import { ChatMessage } from '../models/chat-message.js'
import { Sender } from '../models/enums/sender.js'
import { MAX_MESSAGES } from '../constants/max-messages.js'


const router = express.Router()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

router.use(authMiddleware)

router.post('/chat', async (req, res, next) => {
  try {
    const { question, chatId } = req.body
    if (!question || !chatId) {
      throw { status: 400, message: 'Потрібно question і chatId.' }
    }

    const chat = await Chat.findOne({ _id: chatId, userId: req.user.id })

    if (!chat) {
      throw { status: 400, message: 'Чат не знайдено.' }
    }

    const previousMessages = await ChatMessage
      .find({ chatId })
      .sort({ timestamp: -1 })
      .limit(MAX_MESSAGES)
      .sort({ timestamp: 1 })

    const gptMessages = previousMessages.map(msg => ({
      role: msg.from === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }))

    const docs = await Document.find({ userId: req.user.id })
    const allChunks = docs.flatMap(doc => doc.chunks)

    const questionEmbeddingRaw = await getEmbedding(question)
    const questionEmbedding = normalizeEmbedding(questionEmbeddingRaw)

    const scoredChunks = allChunks.map(({ text, embedding }) => {
      const score = cosineSimilarityNorm(questionEmbedding, embedding)
      return { text, score }
    })

    const topChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.text)

    const pdfContext = topChunks.join('\n---\n')

    gptMessages.unshift({
      role: 'system',
      content:
        `Ти асистент, який відповідає на основі PDF-документів користувача та історії чату. ` +
        `Використовуй лише релевантну інформацію з контексту. ` +
        `Контекст:\n${pdfContext}`,
    })

    gptMessages.push({ role: 'user', content: question })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: gptMessages,
    })

    const reply = completion.choices[0].message.content

    const now = new Date()

    await ChatMessage.insertMany([
      {
        chatId,
        from: Sender.USER,
        content: question,
        timestamp: now,
      },
      {
        chatId,
        from: Sender.BOT,
        content: reply,
        timestamp: new Date(now.getTime() + 1000),
      },
    ])

    await Chat.updateOne({ _id: chatId }, { updatedAt: new Date() })

    res.json({ reply })
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

    await ChatMessage.deleteMany({ chatId: chat._id })

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
