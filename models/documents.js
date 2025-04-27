import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    fileName: { type: String },
    fileUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
})

export const Document = mongoose.model('Document', documentSchema)
