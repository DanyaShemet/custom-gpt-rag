import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { Document } from '../models/documents.js'
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const router = express.Router()

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
})

router.use(authMiddleware)

router.get('/documents', async (req, res, next) => {
    try {
        const docs = await Document.find({ userId: req.user.id })
        res.json(docs)
    } catch (err) {
        next(err)
    }
})


router.delete('/documents/:id', async (req, res, next) => {
    try {
        const { id } = req.params
        const doc = await Document.findById(id)

        if (!doc || doc.userId.toString() !== req.user.id) {
            throw { status: 404, message: 'Документ не знайдено або немає доступу' }
        }

        if (doc.fileKey) {
            await s3.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: doc.fileKey,
            }))
        }

        await Document.findByIdAndDelete(id)

        res.json({ message: 'Документ видалено успішно' })
    } catch (err) {
        next(err)
    }
})

export default router

