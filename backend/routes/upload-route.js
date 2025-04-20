import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { extractPdfText } from '../utils/pdf.js'
import { uploadToS3 } from '../utils/s3-сlient.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const sessionId = req.body.sessionId
        const file = req.file

        if (!file || !sessionId) {
            return res.status(400).json({ message: 'Не вказано файл або sessionId' })
        }

        // 🟢 1. Завантажити в S3
        await uploadToS3({
            fileBuffer: file.buffer,
            fileName: file.originalname,
            sessionId,
            mimeType: file.mimetype
        })

        // 🟢 2. Обробити PDF
        const text = await extractPdfText(file.buffer)
        if (!text.trim()) return res.status(400).json({ message: 'PDF не містить тексту.' })

        const newChunks = text.match(/(.|[\r\n]){1,500}/g) || []
        const filePath = `user_data/user_${sessionId}.json`

        // 🧠 3. Якщо вже були фрагменти — обʼєднуємо
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
        console.error('Upload error:', err)
        res.status(500).json({ message: 'Помилка при обробці PDF.' })
    }
})

export default router
