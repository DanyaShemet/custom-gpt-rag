import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import OpenAI from 'openai'
import {spawn } from 'child_process'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(bodyParser.json())

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const retrieveContext = (question) => {
    return new Promise((resolve, reject) => {
        const python = process.env.PYTHON_PATH || 'python'
        const py = spawn(python, ['backend/retrieve.py', question])

        let data = ''
        py.stdout.setEncoding('utf-8')
        py.stdout.on('data', chunk => data += chunk)
        py.stderr.on('data', err => console.error(err.toString()))
        py.on('close', () => resolve(data.trim()))
    })

}



async function checkModels() {
    const models = await openai.models.list()
    console.log(models.data.map(m => m.id))
}



app.post('/api/chat', async (req, res) => {
    const { question } = req.body
    console.log('⚙️  PYTHON_PATH:', process.env.PYTHON_PATH)

    const context = await retrieveContext(question)

    console.log('🧠 CONTEXT:\n', context)

    const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'Відповідай тільки на основі контексту. Якщо не впевнений — скажи, що не знаєш.' },
            { role: 'user', content: `Контекст:\n${context}\n\nПитання: ${question}` }
        ]
    })

    res.json({ reply: completion.choices[0].message.content })
})

app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'))
checkModels()