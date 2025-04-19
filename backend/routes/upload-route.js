import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { extractPdfText } from '../utils/pdf.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })
const DATA_DIR = path.resolve('user_data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)

router.post('/upload', upload.single('file'), async (req, res) => {

    try {
        const sessionId = req.body.sessionId
        const filePath = req.file.path

        const dataBuffer = fs.readFileSync(filePath)
        const text = await extractPdfText(dataBuffer)

        if (!text.trim()) {
            return res.status(400).json({ message: 'PDF не містить тексту.' })
        }

        const chunks = text.match(/(.|\n){1,500}/g) || []
        const outputPath = path.join(DATA_DIR, `user_${sessionId}.json`)

        fs.writeFileSync(outputPath, JSON.stringify(chunks, null, 2), 'utf-8')
        console.log('🧹 Видаляю файл:', filePath)
        fs.unlinkSync(filePath)

        res.json({ message: 'PDF оброблено й збережено.' })
    } catch (err) {
        console.error('Upload error:', err)
        res.status(500).json({ message: 'Помилка при обробці PDF.' })
    }
})

export default router
