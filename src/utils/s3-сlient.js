import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { config } from 'dotenv'

config()

export const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

export async function uploadToS3({ fileBuffer, fileName, sessionId, mimeType }) {
  const key = `pdfs/user_${sessionId}/${fileName}`

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  })

  await s3.send(command)
  return key
}
