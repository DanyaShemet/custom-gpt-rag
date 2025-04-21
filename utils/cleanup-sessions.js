import fs from 'fs'
import path from 'path'

const USER_DATA_DIR = path.resolve('user_data')
const MAX_AGE_MINUTES = 24 * 60 // 24 години

export function cleanupOldSessions() {
    if (!fs.existsSync(USER_DATA_DIR)) return

    const now = Date.now()

    fs.readdirSync(USER_DATA_DIR).forEach(file => {
        const fullPath = path.join(USER_DATA_DIR, file)
        const stats = fs.statSync(fullPath)

        const ageMinutes = (now - stats.mtimeMs) / 1000 / 60
        if (ageMinutes > MAX_AGE_MINUTES) {
            fs.unlinkSync(fullPath)
            console.log(`🧹 Видалено стару сесію: ${file}`)
        }
    })
}
