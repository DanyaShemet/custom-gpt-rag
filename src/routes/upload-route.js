import express from 'express'
import multer from 'multer'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { extractPdfText } from '../utils/pdf.js'
import { authMiddleware } from '../middleware/auth.js'
import { Document } from '../models/documents.js'
import { v4 as uuidv4 } from 'uuid'
import { getEmbedding } from '../utils/get-embeding.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

router.use(authMiddleware)

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file

    if (!file) {
      throw { status: 400, message: 'Не вказано файл.' }
    }

    const fileKey = `uploads/${uuidv4()}_${file.originalname}`

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    )

    const fileUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${fileKey}`
    const text = await extractPdfText(file.buffer)

    if (!text.trim()) {
      throw { status: 400, message: 'PDF не містить тексту.' }
    }

    const chunks = text.match(/(.|[\r\n]){1,500}/g) || []

    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (text) => ({
        text,
        embedding: await getEmbedding(text),
      })),
    )

    const document = new Document({
      userId: req.user.id,
      fileName: file.originalname,
      fileUrl,
      createdAt: new Date(),
      chunks: chunksWithEmbeddings,
    })

    await document.save()

    const totalDocs = await Document.countDocuments({ userId: req.user.id })

    res.json({
      message: `Документ додано з ${chunks.length} фрагментів. Загалом у базі знань: ${totalDocs}.`,
      fileUrl,
    })
  } catch (err) {
    next(err)
  }
})

export default router
