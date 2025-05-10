import express from 'express'
import OpenAI from 'openai'
import { cosineSimilarity } from '../utils/cosine-similarity.js'
import { authMiddleware } from '../middleware/auth.js'
import { Document } from '../models/documents.js'

const router = express.Router()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

router.use(authMiddleware)

router.post('/api/chat', async (req, res, next) => {
    try {
        const { question } = req.body
        if (!question) {
            throw { status: 400, message: 'Потрібно question.' }
        }

        // Витягуємо всі chunks юзера
        const docs = await Document.find({ userId: req.user.id })

        if (!docs.length) {
            return res.json({ reply: 'У вас ще немає бази знань. Завантажте PDF.' })
        }

        const chunks = docs.flatMap(doc => doc.contentChunks)

        const questionEmbedding = await getEmbedding(question)

        const scoredChunks = await Promise.all(
            chunks.map(async chunk => {
                const emb = await getEmbedding(chunk)
                const score = cosineSimilarity(questionEmbedding, emb)
                return { chunk, score }
            })
        )

        const topChunks = scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(item => item.chunk)

        const context = topChunks.join('\n---\n')

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Відповідай лише на основі наданого контексту. Якщо не знаєш — скажи, що не знаєш.'
                },
                {
                    role: 'user',
                    content: `Контекст:\n${context}\n\nПитання: ${question}`
                }
            ]
        })

        res.json({ reply: completion.choices[0].message.content })
    } catch (err) {
        next(err)
    }
})

router.get('/api/status', async (req, res, next) => {
    try {
        const count = await Document.countDocuments({ userId: req.user.id })
        const documents = await Document.find({ userId: req.user.id })
        res.json({ count })
    } catch (err) {
        next(err)
    }
})

router.delete('/api/reset', async (req, res, next) => {
    try {
        await Document.deleteMany({ userId: req.user.id })
        res.json({ message: 'Базу знань очищено.' })
    } catch (err) {
        next(err)
    }
})

async function getEmbedding(text) {
    const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    })
    return res.data[0].embedding
}

export default router
