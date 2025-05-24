import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import OpenAI from 'openai'
import 'dotenv/config'
import uploadRoute from './routes/upload-route.js'
import chatRoute from './routes/chat-route.js'
import documentsRoute from './routes/documents-route.js'
import authRoute from './routes/auth-route.js'
import messageRoute from './routes/messages-route.js'
import { errorHandler } from './middleware/error-handler.js'
import fs from 'fs'
import path from 'path'

import { connectDB } from './db/mongoose.js'

const userDataDir = path.join(process.cwd(), 'user_data')
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir)
}

const app = express()

await connectDB()

app.use(cors())
app.use(bodyParser.json())

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function checkModels() {
  const models = await openai.models.list()
  console.log(models.data.map((m) => m.id))
}

app.use('/auth', authRoute)

app.use(uploadRoute)
app.use(messageRoute)
app.use(chatRoute)
app.use(documentsRoute)

app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'))

app.use(errorHandler)

checkModels()
