import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { ChatMessage } from '../models/chat-message.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/messages/:chatId', async (req, res, next) => {

  const { chatId } = req.params

  const page = parseInt(req.query.page as string) || 1
  const perPage = parseInt(req.query.perPage as string) || 20

  const skip = (page - 1) * perPage

  try {

    const total = await ChatMessage.countDocuments({ chatId })

    const messages = await ChatMessage.find({ chatId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(perPage)

    res.json({
      data: messages,
      meta: {
        total,
        page,
        perPage,
        hasMore: page * perPage < total,
      }
    })


  } catch (error) {
    next(error)
  }
})

export default router