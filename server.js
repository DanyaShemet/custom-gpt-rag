import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import OpenAI from 'openai'
import 'dotenv/config'
import uploadRoute from './routes/upload-route.js'
import chatRoute from './routes/chat-route.js'
import authRoute from './routes/auth-route.js'
import { cleanupOldSessions } from './utils/cleanup-sessions.js'
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
    console.log(models.data.map(m => m.id))
}

app.use('/auth', authRoute)

app.use(uploadRoute)
app.use(chatRoute)



setInterval(cleanupOldSessions, 60 * 60 * 1000)


app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'))

app.use(errorHandler)

checkModels()