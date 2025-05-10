import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contentChunks: { type: [String], required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
})

export const Document = mongoose.model('Document', documentSchema)
