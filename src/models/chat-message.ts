import mongoose from 'mongoose'
import { Sender } from './enums/sender.js'

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  from: { type: String, enum: Sender, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
})

export const ChatMessage = mongoose.model('ChatMessage', messageSchema)
