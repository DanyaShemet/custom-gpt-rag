import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import OpenAI from 'openai'
import 'dotenv/config'
import uploadRoute from './routes/upload-route.js'
import chatRoute from './routes/chat-route.js'


const app = express()
app.use(cors())
app.use(bodyParser.json())

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function checkModels() {
    const models = await openai.models.list()
    console.log(models.data.map(m => m.id))
}

app.use(uploadRoute)
app.use(chatRoute)
app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'))

checkModels()