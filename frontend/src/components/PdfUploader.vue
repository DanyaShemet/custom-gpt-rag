<!-- components/PdfUploader.vue -->
<template>
  <div class="pdf-uploader">
    <h3>Завантажити PDF</h3>

    <input type="file" accept="application/pdf" @change="handleFileChange" />
    <button @click="uploadPdf" :disabled="!file || loading">
      {{ loading ? 'Завантаження...' : 'Завантажити' }}
    </button>

    <p v-if="message">{{ message }}</p>

    <p>Кількість фрагментів: {{ chunkCount }}</p>
    <button @click="resetKnowledge">Скинути базу знань</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const file = ref(null)
const loading = ref(false)
const message = ref('')
const chunkCount = ref(0)

const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID()
localStorage.setItem('sessionId', sessionId)

function handleFileChange(event) {
  file.value = event.target.files[0]
}

async function uploadPdf() {
  if (!file.value) return

  loading.value = true
  message.value = ''

  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('sessionId', sessionId)

  try {
    const res = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    message.value = data.message || 'PDF завантажено успішно.'
    await fetchChunkCount()
  } catch (err) {
    console.error(err)
    message.value = 'Сталася помилка під час завантаження.'
  } finally {
    loading.value = false
  }
}

async function fetchChunkCount() {
  const res = await fetch(`http://localhost:3000/api/status/${sessionId}`)
  const data = await res.json()
  chunkCount.value = data.count
}

async function resetKnowledge() {
  const res = await fetch(`http://localhost:3000/api/reset/${sessionId}`, {
    method: 'DELETE'
  })
  const data = await res.json()
  message.value = data.message
  chunkCount.value = 0
}

onMounted(fetchChunkCount)
</script>

<style scoped>
.pdf-uploader {
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 8px;
  max-width: 400px;
}
</style>
