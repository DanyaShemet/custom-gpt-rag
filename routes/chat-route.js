import express from 'express'
import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { cosineSimilarity } from '../utils/cosine-similarity.js'
import {authMiddleware} from "../middleware/auth.js";

const router = express.Router()
const DATA_DIR = path.resolve('user_data')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })


router.use(authMiddleware)
router.post('/api/chat', async (req, res, next) => {
    try {
        const { question, sessionId } = req.body
        if (!question || !sessionId) {
            throw { status: 400, message: 'Потрібно question і sessionId.' }
        }

        const filepath = path.join(DATA_DIR, `user_${sessionId}.json`)
        if (!fs.existsSync(filepath)) {
            return res.json({ reply: 'У вас ще немає бази знань. Завантажте PDF.' })
        }

        const chunks = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
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

async function getEmbedding(text) {
    const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
    })
    return res.data[0].embedding
}

router.get('/api/status/:sessionId', async (req, res, next) => {
    try {
        const { sessionId } = req.params
        const filepath = path.join(DATA_DIR, `user_${sessionId}.json`)
        if (!fs.existsSync(filepath)) return res.json({ count: 0 })
        const chunks = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
        res.json({ count: chunks.length })
    } catch (err) {
        next(err)
    }
})

router.delete('/api/reset/:sessionId', async (req, res, next) => {
    try {
        const { sessionId } = req.params
        const filepath = path.join(DATA_DIR, `user_${sessionId}.json`)
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
        res.json({ message: 'Базу знань очищено.' })
    } catch (err) {
        next(err)
    }
})

export default router
