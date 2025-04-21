import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { extractPdfText } from '../utils/pdf.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })
const DATA_DIR = path.resolve('user_data')

router.post('/upload', upload.single('file'), async (req, res, next) => {
    try {
        const sessionId = req.body.sessionId
        const file = req.file

        if (!file || !sessionId) {
            throw { status: 400, message: 'Не вказано файл або sessionId.' }
        }

        const text = await extractPdfText(file.buffer)
        if (!text.trim()) {
            throw { status: 400, message: 'PDF не містить тексту.' }
        }

        const newChunks = text.match(/(.|[\r\n]){1,500}/g) || []
        const filePath = path.join(DATA_DIR, `user_${sessionId}.json`)

        let allChunks = []

        if (fs.existsSync(filePath)) {
            const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            allChunks = [...existing, ...newChunks]
        } else {
            allChunks = newChunks
        }

        fs.writeFileSync(filePath, JSON.stringify(allChunks, null, 2), 'utf-8')

        res.json({
            message: `Додано ${newChunks.length} фрагментів до бази знань. Загалом: ${allChunks.length}.`
        })
    } catch (err) {
        next(err)
    }
})

export default router
