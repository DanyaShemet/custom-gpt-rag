import mongoose from 'mongoose'

const chunkSchema = new mongoose.Schema({
  text: String,
  embedding: [Number],
})

const documentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fileName: String,
  fileUrl: String,
  createdAt: Date,
  chunks: [chunkSchema],
})

export const Document = mongoose.model('Document', documentSchema)
